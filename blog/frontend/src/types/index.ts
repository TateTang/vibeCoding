export type User = {
  avatar: string | null
  created_at: string
  email: string
  id: number
  username: string
}

export type Category = {
  description: string | null
  id: number
  name: string
}

export type Article = {
  author: {
    avatar: string | null
    id: number
    username: string
  } | null
  author_avatar: string | null
  author_id: number
  author_username: string
  category: {
    id: number
    name: string | null
  } | null
  category_id: number | null
  category_name: string | null
  content: string
  cover: string | null
  created_at: string
  id: number
  tags: string[]
  title: string
  updated_at: string
  views: number
}

export type ArticleListResponse = {
  list: Article[]
  page: number
  pageSize: number
  total: number
}

export type ArticlePayload = {
  category: string
  content: string
  cover: string | null
  tags: string[]
  title: string
}

export type AuthResponse = {
  message: string
  token?: string
  user: User
}