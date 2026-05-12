import axios from 'axios'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ password: '', username: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const redirectTo = (location.state as { from?: string } | null)?.from || '/profile'

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await login(formData)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.message || '登录失败，请稍后重试')
      } else {
        setErrorMessage('登录失败，请稍后重试')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page-card auth-card">
      <span className="page-badge">账号登录</span>
      <h2>欢迎回来</h2>
      <p>输入用户名和密码，登录后可发布文章和进入个人中心。</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>用户名</span>
          <input
            autoComplete="username"
            name="username"
            onChange={handleChange}
            placeholder="请输入用户名"
            required
            value={formData.username}
          />
        </label>

        <label>
          <span>密码</span>
          <input
            autoComplete="current-password"
            minLength={6}
            name="password"
            onChange={handleChange}
            placeholder="请输入密码"
            required
            type="password"
            value={formData.password}
          />
        </label>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? '登录中...' : '登录'}
        </button>
      </form>

      <p className="auth-switch">
        还没有账号？<Link to="/register">去注册</Link>
      </p>
    </section>
  )
}

export default LoginPage