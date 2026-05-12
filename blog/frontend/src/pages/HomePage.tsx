import axios from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Article, ArticleListResponse, Category } from '../types'

const PAGE_SIZE = 10

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function buildPagination(totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  return Array.from({ length: totalPages }, (_, index) => index + 1)
}

function HomePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
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

    const loadArticles = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const { data } = await api.get<ArticleListResponse>('/posts', {
          params: {
            category: selectedCategory || undefined,
            keyword: keyword || undefined,
            page,
            pageSize: PAGE_SIZE,
          },
        })

        if (isMounted) {
          setArticles(data.list)
          setTotal(data.total)
        }
      } catch (error) {
        if (axios.isAxiosError(error) && isMounted) {
          setErrorMessage(error.response?.data?.message || '文章列表加载失败')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadArticles()

    return () => {
      isMounted = false
    }
  }, [keyword, page, selectedCategory])

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setKeyword(keywordInput.trim())
  }

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value)
    setPage(1)
  }

  const pages = buildPagination(total)

  return (
    <section className="page-card home-page">
      <div className="home-hero">
        <div>
          <span className="page-badge">内容首页</span>
          <h2>发现最新文章</h2>
          <p>支持分页、分类筛选和关键词搜索，点击文章可进入详情页。</p>
        </div>

        <form className="search-form" onSubmit={handleSearchSubmit}>
          <input
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="搜索标题或内容"
            value={keywordInput}
          />
          <button className="primary-button" type="submit">
            搜索
          </button>
        </form>
      </div>

      <div className="category-filter" role="tablist" aria-label="分类筛选">
        <button
          className={selectedCategory === '' ? 'chip-button active' : 'chip-button'}
          onClick={() => handleCategorySelect('')}
          type="button"
        >
          全部分类
        </button>
        {categories.map((category) => (
          <button
            className={selectedCategory === category.name ? 'chip-button active' : 'chip-button'}
            key={category.id}
            onClick={() => handleCategorySelect(category.name)}
            type="button"
          >
            {category.name}
          </button>
        ))}
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      {isLoading ? (
        <div className="empty-state">
          <h3>正在加载文章</h3>
          <p>请稍候，正在请求文章列表。</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <h3>暂无文章</h3>
          <p>当前筛选条件下还没有内容，可以尝试切换分类或搜索词。</p>
        </div>
      ) : (
        <>
          <div className="article-grid">
            {articles.map((article) => (
              <article className="article-card" key={article.id}>
                <Link className="article-cover-link" to={`/post/${article.id}`}>
                  {article.cover ? (
                    <img alt={article.title} className="article-cover" src={article.cover} />
                  ) : (
                    <div className="article-cover article-cover-fallback">No Cover</div>
                  )}
                </Link>

                <div className="article-body">
                  <div className="article-meta-line">
                    <span>{article.category?.name || article.category_name || '未分类'}</span>
                    <span>{formatDate(article.created_at)}</span>
                  </div>

                  <Link className="article-title-link" to={`/post/${article.id}`}>
                    <h3>{article.title}</h3>
                  </Link>

                  <p>{article.content.slice(0, 120)}{article.content.length > 120 ? '...' : ''}</p>

                  <div className="article-footer">
                    <span>{article.author?.username || article.author_username}</span>
                    <span>{article.views} 次浏览</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="pagination-bar">
            {pages.map((pageNumber) => (
              <button
                className={pageNumber === page ? 'chip-button active' : 'chip-button'}
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                type="button"
              >
                {pageNumber}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default HomePage