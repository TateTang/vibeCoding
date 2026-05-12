import { NavLink, Outlet, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PostDetailPage from './pages/PostDetailPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import WritePage from './pages/WritePage'

function AppLayout() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Personal Blog</p>
          <h1>博客前端</h1>
        </div>
        <nav className="top-nav" aria-label="Main navigation">
          <NavLink to="/">首页</NavLink>
          <NavLink to="/write">写文章</NavLink>
          <NavLink to="/profile">个人中心</NavLink>
          {isAuthenticated ? (
            <button className="nav-action" onClick={logout} type="button">
              退出 {user?.username}
            </button>
          ) : (
            <>
              <NavLink to="/login">登录</NavLink>
              <NavLink to="/register">注册</NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="page-frame">
        <Outlet />
      </main>
    </div>
  )
}

function NotFoundPage() {
  return (
    <section className="page-card page-status-card">
      <span className="page-badge">404</span>
      <h2>页面不存在</h2>
      <p>当前访问的路由未配置，请检查地址是否正确。</p>
    </section>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="post/:id" element={<PostDetailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="write" element={<WritePage />} />
            <Route path="write/:id" element={<WritePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
