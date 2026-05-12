import axios from 'axios'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MarkdownEditor from '../components/MarkdownEditor'
import api from '../lib/api'
import type { Article, ArticlePayload, Category } from '../types'

type ArticleFormState = {
  category: string
  content: string
  cover: string | null
  tags: string
  title: string
}

function toFormState(article?: Article | null): ArticleFormState {
  return {
    category: article?.category?.name || article?.category_name || '',
    content: article?.content || '',
    cover: article?.cover || null,
    tags: article?.tags.join(', ') || '',
    title: article?.title || '',
  }
}

function parseTags(input: string) {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('封面读取失败'))
    reader.readAsDataURL(file)
  })
}

function WritePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const [categories, setCategories] = useState<Category[]>([])
  const [formState, setFormState] = useState<ArticleFormState>(toFormState())
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadCategories = async () => {
      try {
        const { data } = await api.get<{ categories: Category[] }>('/categories')

        if (isMounted) {
          setCategories(data.categories)
        }
      } catch (error) {
        if (axios.isAxiosError(error) && isMounted) {
          setErrorMessage(error.response?.data?.message || '分类加载失败')
        }
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadArticle = async () => {
      if (!id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      try {
        const { data } = await api.get<{ post: Article }>(`/posts/${id}`)

        if (isMounted) {
          setFormState(toFormState(data.post))
        }
      } catch (error) {
        if (axios.isAxiosError(error) && isMounted) {
          setErrorMessage(error.response?.data?.message || '文章加载失败')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadArticle()

    return () => {
      isMounted = false
    }
  }, [id])

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setFormState((current) => ({ ...current, [name]: value }))
  }

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const dataUrl = await fileToDataUrl(file)
      setFormState((current) => ({ ...current, cover: dataUrl }))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '封面上传失败')
    }
  }

  const removeCover = () => {
    setFormState((current) => ({ ...current, cover: null }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')

    const payload: ArticlePayload = {
      category: formState.category,
      content: formState.content.trim(),
      cover: formState.cover,
      tags: parseTags(formState.tags),
      title: formState.title.trim(),
    }

    try {
      if (isEditMode && id) {
        const { data } = await api.put<{ post: Article }>(`/posts/${id}`, payload)
        navigate(`/post/${data.post.id}`)
      } else {
        const { data } = await api.post<{ post: Article }>('/posts', payload)
        navigate(`/post/${data.post.id}`)
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.message || '保存文章失败')
      } else {
        setErrorMessage('保存文章失败')
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <section className="page-card page-status-card">
        <span className="page-badge">加载中</span>
        <h2>正在准备编辑器</h2>
        <p>请稍候，正在加载文章内容和分类数据。</p>
      </section>
    )
  }

  return (
    <form className="page-card write-page" onSubmit={handleSubmit}>
      <div className="write-header">
        <div>
          <span className="page-badge">{isEditMode ? '编辑模式' : '新建文章'}</span>
          <h2>{isEditMode ? '编辑你的文章' : '发布一篇新文章'}</h2>
          <p>左侧编辑，右侧实时预览。支持标题、分类、标签和本地封面上传。</p>
        </div>

        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? '保存中...' : isEditMode ? '更新文章' : '发布文章'}
        </button>
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <div className="write-form-grid">
        <section className="editor-panel meta-panel">
          <div className="editor-panel-header">
            <h3>文章信息</h3>
            <span>Meta</span>
          </div>

          <label className="field-group">
            <span>标题</span>
            <input
              name="title"
              onChange={handleInputChange}
              placeholder="输入文章标题"
              required
              value={formState.title}
            />
          </label>

          <label className="field-group">
            <span>分类</span>
            <select name="category" onChange={handleInputChange} value={formState.category}>
              <option value="">请选择分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span>标签</span>
            <input
              name="tags"
              onChange={handleInputChange}
              placeholder="用英文逗号分隔，例如 React, Node.js"
              value={formState.tags}
            />
          </label>

          <label className="field-group">
            <span>封面上传</span>
            <input accept="image/*" onChange={handleCoverUpload} type="file" />
          </label>

          {formState.cover ? (
            <div className="cover-preview-card">
              <img alt="封面预览" className="cover-preview-image" src={formState.cover} />
              <button className="secondary-button" onClick={removeCover} type="button">
                移除封面
              </button>
            </div>
          ) : null}
        </section>

        <MarkdownEditor
          onChange={(value) => setFormState((current) => ({ ...current, content: value }))}
          placeholder="请输入正文内容，支持 Markdown 语法"
          value={formState.content}
        />
      </div>
    </form>
  )
}

export default WritePage