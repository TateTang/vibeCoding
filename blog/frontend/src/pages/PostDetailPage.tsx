import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import type { Article } from '../types'

function PostDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadArticle = async () => {
      if (!id) {
        setErrorMessage('文章 ID 缺失')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      try {
        const { data } = await api.get<{ post: Article }>(`/posts/${id}`)

        if (isMounted) {
          setArticle(data.post)
        }
      } catch (error) {
        if (isMounted) {
          if (axios.isAxiosError(error)) {
            setErrorMessage(error.response?.data?.message || '文章详情加载失败')
          } else {
            setErrorMessage('文章详情加载失败')
          }
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

  if (isLoading) {
    return (
      <section className="page-card page-status-card">
        <span className="page-badge">加载中</span>
        <h2>正在获取文章详情</h2>
        <p>请稍候，详情页正在请求文章内容。</p>
      </section>
    )
  }

  if (errorMessage || !article) {
    return (
      <section className="page-card page-status-card">
        <span className="page-badge">读取失败</span>
        <h2>文章无法展示</h2>
        <p>{errorMessage || '未找到对应文章'}</p>
      </section>
    )
  }

  const isOwner = user?.id === article.author_id

  const handleDelete = async () => {
    if (!window.confirm('确认删除这篇文章吗？')) {
      return
    }

    setIsDeleting(true)
    setErrorMessage('')

    try {
      await api.delete(`/posts/${article.id}`)
      navigate('/', { replace: true })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.message || '删除文章失败')
      } else {
        setErrorMessage('删除文章失败')
      }
      setIsDeleting(false)
    }
  }

  return (
    <section className="page-card markdown-card">
      <span className="page-badge">{article.category?.name || article.category_name || '未分类'}</span>
      <h2>{article.title}</h2>
      <div className="detail-toolbar">
        <div className="author-card">
          <div className="author-avatar">
            {(article.author?.username || article.author_username || '?').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <strong>{article.author?.username || article.author_username}</strong>
            <p>
              发布时间 {new Date(article.created_at).toLocaleString('zh-CN')} · 浏览 {article.views}
            </p>
          </div>
        </div>

        {isOwner ? (
          <div className="detail-actions">
            <Link className="secondary-button" to={`/write/${article.id}`}>
              编辑文章
            </Link>
            <button className="danger-button" disabled={isDeleting} onClick={handleDelete} type="button">
              {isDeleting ? '删除中...' : '删除文章'}
            </button>
          </div>
        ) : null}
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {article.cover ? <img alt={article.title} className="detail-cover" src={article.cover} /> : null}
      <div className="markdown-preview">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>
    </section>
  )
}

export default PostDetailPage