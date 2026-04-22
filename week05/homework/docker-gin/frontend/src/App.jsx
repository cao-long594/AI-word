import { useEffect, useState } from 'react'
import request from './api/request'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [username, setUsername] = useState(localStorage.getItem('username') || '')

  const [activeTab, setActiveTab] = useState(token ? 'search' : 'login')

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  })

  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: ''
  })

  const [queryForm, setQueryForm] = useState({
    word: '',
    ai_provider: 'deepseek'
  })

  const [queryResult, setQueryResult] = useState(null)

  const [words, setWords] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(5)
  const [total, setTotal] = useState(0)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const isLogin = Boolean(token)

  useEffect(() => {
    if (isLogin && activeTab === 'list') {
      loadWords(1)
    }
  }, [activeTab, isLogin])

  function showMessage(msg) {
    setMessage(msg)
    setTimeout(() => {
      setMessage('')
    }, 2500)
  }

  async function handleRegister(e) {
    e.preventDefault()

    try {
      setLoading(true)

      await request.post('/auth/register', registerForm)

      showMessage('注册成功，请登录')
      setActiveTab('login')
      setRegisterForm({
        username: '',
        password: ''
      })
    } catch (err) {
      showMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()

    try {
      setLoading(true)

      const data = await request.post('/auth/login', loginForm)

      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.username)

      setToken(data.token)
      setUsername(data.username)
      setActiveTab('search')

      showMessage('登录成功')
    } catch (err) {
      showMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')

    setToken('')
    setUsername('')
    setQueryResult(null)
    setWords([])
    setActiveTab('login')

    showMessage('已退出登录')
  }

  async function handleQueryWord(e) {
    e.preventDefault()

    const word = queryForm.word.trim()

    if (!word) {
      showMessage('请输入单词')
      return
    }

    try {
      setLoading(true)
      setQueryResult(null)

      const data = await request.post('/words/query', {
        word,
        ai_provider: queryForm.ai_provider
      })

      setQueryResult(data)
      showMessage(data.source === 'db' ? '已从单词本读取' : 'AI 查询成功')
    } catch (err) {
      showMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveWord() {
    if (!queryResult?.word) {
      showMessage('没有可保存的单词')
      return
    }

    const wordData = queryResult.word

    try {
      setLoading(true)

      await request.post('/words', {
        word: wordData.word,
        meaning: wordData.meaning,
        examples: wordData.examples || [],
        ai_provider: wordData.ai_provider || queryForm.ai_provider
      })

      showMessage('保存成功')
      setQueryResult({
        ...queryResult,
        saved: true
      })
    } catch (err) {
      showMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadWords(targetPage = page) {
    try {
      setLoading(true)

      const data = await request.get('/words', {
        params: {
          page: targetPage,
          page_size: pageSize
        }
      })

      setWords(data.list || [])
      setTotal(data.total || 0)
      setPage(data.page || targetPage)
    } catch (err) {
      showMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteWord(id) {
    const ok = window.confirm('确定删除这个单词吗？')

    if (!ok) {
      return
    }

    try {
      setLoading(true)

      await request.delete(`/words/${id}`)

      showMessage('删除成功')

      const maxPage = Math.max(1, Math.ceil((total - 1) / pageSize))
      const nextPage = page > maxPage ? maxPage : page

      await loadWords(nextPage)
    } catch (err) {
      showMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>AI 智能单词本</h1>
          <p>React + Vite + Gin + MySQL + AI</p>
        </div>

        <div className="user-area">
          {isLogin ? (
            <>
              <span>当前用户：{username}</span>
              <button className="btn ghost" onClick={handleLogout}>
                退出
              </button>
            </>
          ) : (
            <span>未登录</span>
          )}
        </div>
      </header>

      {message && <div className="toast">{message}</div>}

      <main className="layout">
        <aside className="sidebar">
          {!isLogin && (
            <>
              <button
                className={activeTab === 'login' ? 'nav active' : 'nav'}
                onClick={() => setActiveTab('login')}
              >
                登录
              </button>

              <button
                className={activeTab === 'register' ? 'nav active' : 'nav'}
                onClick={() => setActiveTab('register')}
              >
                注册
              </button>
            </>
          )}

          {isLogin && (
            <>
              <button
                className={activeTab === 'search' ? 'nav active' : 'nav'}
                onClick={() => setActiveTab('search')}
              >
                智能查词
              </button>

              <button
                className={activeTab === 'list' ? 'nav active' : 'nav'}
                onClick={() => setActiveTab('list')}
              >
                我的单词本
              </button>
            </>
          )}
        </aside>

        <section className="content">
          {activeTab === 'login' && (
            <div className="card">
              <h2>登录</h2>

              <form onSubmit={handleLogin} className="form">
                <label>
                  用户名
                  <input
                    value={loginForm.username}
                    onChange={(e) =>
                      setLoginForm({
                        ...loginForm,
                        username: e.target.value
                      })
                    }
                    placeholder="请输入用户名"
                  />
                </label>

                <label>
                  密码
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({
                        ...loginForm,
                        password: e.target.value
                      })
                    }
                    placeholder="请输入密码"
                  />
                </label>

                <button className="btn primary" disabled={loading}>
                  {loading ? '登录中...' : '登录'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'register' && (
            <div className="card">
              <h2>注册</h2>

              <form onSubmit={handleRegister} className="form">
                <label>
                  用户名
                  <input
                    value={registerForm.username}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        username: e.target.value
                      })
                    }
                    placeholder="至少 3 位"
                  />
                </label>

                <label>
                  密码
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        password: e.target.value
                      })
                    }
                    placeholder="至少 6 位"
                  />
                </label>

                <button className="btn primary" disabled={loading}>
                  {loading ? '注册中...' : '注册'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'search' && isLogin && (
            <div className="card">
              <h2>智能查词</h2>

              <form onSubmit={handleQueryWord} className="query-form">
                <input
                  value={queryForm.word}
                  onChange={(e) =>
                    setQueryForm({
                      ...queryForm,
                      word: e.target.value
                    })
                  }
                  placeholder="输入英文单词，例如 apple"
                />

                <select
                  value={queryForm.ai_provider}
                  onChange={(e) =>
                    setQueryForm({
                      ...queryForm,
                      ai_provider: e.target.value
                    })
                  }
                >
                  <option value="deepseek">DeepSeek</option>
                  <option value="qwen">通义千问</option>
                </select>

                <button className="btn primary" disabled={loading}>
                  {loading ? '查询中...' : '查询'}
                </button>
              </form>

              {queryResult?.word && (
                <div className="result">
                  <div className="result-head">
                    <div>
                      <h3>{queryResult.word.word}</h3>
                      <span className="badge">
                        来源：{queryResult.source === 'db' ? '单词本' : 'AI'}
                      </span>
                    </div>

                    <button
                      className="btn success"
                      onClick={handleSaveWord}
                      disabled={loading || queryResult.saved}
                    >
                      {queryResult.saved ? '已保存' : '保存'}
                    </button>
                  </div>

                  <div className="meaning">
                    <strong>释义：</strong>
                    <p>{queryResult.word.meaning}</p>
                  </div>

                  <div className="examples">
                    <strong>例句：</strong>
                    <ol>
                      {(queryResult.word.examples || []).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'list' && isLogin && (
            <div className="card">
              <div className="list-head">
                <h2>我的单词本</h2>

                <button className="btn ghost" onClick={() => loadWords(page)}>
                  刷新
                </button>
              </div>

              {words.length === 0 ? (
                <div className="empty">暂无单词，请先去查询并保存。</div>
              ) : (
                <div className="word-list">
                  {words.map((item) => (
                    <div className="word-card" key={item.id}>
                      <div className="word-card-head">
                        <div>
                          <h3>{item.word}</h3>
                          <span className="badge">{item.ai_provider}</span>
                        </div>

                        <button
                          className="btn danger"
                          onClick={() => handleDeleteWord(item.id)}
                          disabled={loading}
                        >
                          删除
                        </button>
                      </div>

                      <p className="word-meaning">{item.meaning}</p>

                      <ol className="word-examples">
                        {(item.examples || []).map((example, index) => (
                          <li key={index}>{example}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}

              <div className="pagination">
                <button
                  className="btn ghost"
                  disabled={page <= 1 || loading}
                  onClick={() => loadWords(page - 1)}
                >
                  上一页
                </button>

                <span>
                  第 {page} / {totalPage} 页，共 {total} 条
                </span>

                <button
                  className="btn ghost"
                  disabled={page >= totalPage || loading}
                  onClick={() => loadWords(page + 1)}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App