import axios from 'axios'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '', username: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await register(formData)
      navigate('/profile', { replace: true })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.message || '注册失败，请稍后重试')
      } else {
        setErrorMessage('注册失败，请稍后重试')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page-card auth-card">
      <span className="page-badge">创建账号</span>
      <h2>开始写作</h2>
      <p>注册后会自动登录，随后可以直接进入个人中心或开始写文章。</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>用户名</span>
          <input
            autoComplete="username"
            maxLength={20}
            minLength={3}
            name="username"
            onChange={handleChange}
            placeholder="3-20 个字符"
            required
            value={formData.username}
          />
        </label>

        <label>
          <span>邮箱</span>
          <input
            autoComplete="email"
            name="email"
            onChange={handleChange}
            placeholder="请输入邮箱地址"
            required
            type="email"
            value={formData.email}
          />
        </label>

        <label>
          <span>密码</span>
          <input
            autoComplete="new-password"
            minLength={6}
            name="password"
            onChange={handleChange}
            placeholder="至少 6 位密码"
            required
            type="password"
            value={formData.password}
          />
        </label>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? '注册中...' : '注册并登录'}
        </button>
      </form>

      <p className="auth-switch">
        已有账号？<Link to="/login">去登录</Link>
      </p>
    </section>
  )
}

export default RegisterPage