import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'

function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="container">
      <h1>练习三：React 前端打包与 Nginx 自定义配置</h1>

      <nav className="nav">
        <Link to="/home">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <div className="current-route">
        当前路由：<strong>{location.pathname}</strong>
      </div>

      <div className="content">{children}</div>
    </div>
  )
}

function Home() {
  return (
    <Layout>
      <h2>Home 页面</h2>
      <p>这是 /home 路由页面。</p>
      <p>你可以直接在浏览器地址栏输入 /home，然后按 F5 刷新验证是否正常。</p>
    </Layout>
  )
}

function About() {
  return (
    <Layout>
      <h2>About 页面</h2>
      <p>这是 /about 路由页面。</p>
      <p>如果 Nginx 没有正确配置 try_files，刷新这个页面通常会出现 404。</p>
    </Layout>
  )
}

function NotFound() {
  return (
    <Layout>
      <h2>404</h2>
      <p>页面不存在。</p>
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
