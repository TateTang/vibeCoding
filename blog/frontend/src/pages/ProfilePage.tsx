import { useAuth } from '../context/AuthContext'

function ProfilePage() {
  const { logout, user } = useAuth()

  return (
    <section className="page-card">
      <span className="page-badge">个人中心</span>
      <h2>{user?.username || '当前用户'}</h2>
      <p>这里会继续扩展我的文章、资料编辑和头像设置。当前先接入登录态展示和退出。</p>
      <dl className="page-meta">
        <div>
          <dt>邮箱</dt>
          <dd>{user?.email || '暂无'}</dd>
        </div>
        <div>
          <dt>注册时间</dt>
          <dd>{user?.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '暂无'}</dd>
        </div>
      </dl>
      <button className="primary-button" onClick={logout} type="button">
        退出登录
      </button>
    </section>
  )
}

export default ProfilePage