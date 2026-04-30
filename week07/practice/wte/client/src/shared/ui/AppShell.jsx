import { Languages, Menu, Moon, Search, UserCircle2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { logout, useAuthStore } from '../../features/auth/authStore'

export function AppShell({ children }) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '')
  const menuRef = useRef(null)
  const isComposerPage = /^\/topics\/[^/]+\/posts\/new$/.test(location.pathname)

  useEffect(() => {
    setSearchValue(searchParams.get('q') ?? '')
  }, [searchParams])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  function handleSearchSubmit(event) {
    event.preventDefault()
    const query = searchValue.trim()
    const currentParams = new URLSearchParams(searchParams)
    currentParams.delete('page')

    if (query) {
      currentParams.set('q', query)
    } else {
      currentParams.delete('q')
    }

    const nextSearch = currentParams.toString()
    const search = nextSearch ? `?${nextSearch}` : ''

    if (/^\/topics\/[^/]+$/.test(location.pathname)) {
      navigate(`${location.pathname}${search}`)
      return
    }

    if (location.pathname === '/') {
      navigate(`/${search}`)
      return
    }

    navigate(`/${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      <a
        href="#main-content"
        className="focus-ring absolute left-4 top-4 -translate-y-16 rounded-[8px] bg-black px-3 py-2 text-sm text-white transition-transform duration-200 focus-visible:translate-y-0"
      >
        Skip to main content
      </a>

      <div className="mx-auto max-w-[1330px]">
        <section className="overflow-hidden rounded-[44px] border-[3px] border-black bg-white">
          <header className="flex h-[92px] items-center justify-between border-b-[3px] border-black px-8">
            <div className="flex items-center gap-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7b7b7b] text-white">
                <Menu aria-hidden="true" size={30} strokeWidth={2.2} />
              </span>
              <Link to="/" className="flex items-center gap-4">
                <span className="text-[52px] font-bold leading-none text-[#ef2f2f]">WTE</span>
              </Link>
            </div>

            {isComposerPage ? (
              <div className="w-[440px]" aria-hidden="true" />
            ) : (
              <form className="flex w-[440px] items-center gap-3 border-[3px] border-black px-4 py-3" onSubmit={handleSearchSubmit}>
                <Search aria-hidden="true" size={28} strokeWidth={2} />
                <input
                  aria-label="Search"
                  name="global-search"
                  autoComplete="off"
                  placeholder="请输入搜索内容"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-[18px] text-black outline-none placeholder:text-[#9ca3af]"
                />
              </form>
            )}

            <div className="flex items-center gap-4">
              <HeaderCircle ariaLabel="Language">
                <Languages aria-hidden="true" size={23} strokeWidth={2.1} />
              </HeaderCircle>
              <HeaderCircle ariaLabel="Theme">
                <Moon aria-hidden="true" size={22} strokeWidth={2.1} />
              </HeaderCircle>
              <div ref={menuRef} className="relative">
                <HeaderCircle
                  ariaLabel="User"
                  ariaExpanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <UserCircle2 aria-hidden="true" size={30} strokeWidth={2} />
                </HeaderCircle>

                {menuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-20 min-w-[220px] rounded-[8px] border-[3px] border-black bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
                    <p className="text-xs font-semibold tracking-[0.18em] text-[#9ca3af]">当前用户</p>
                    <p className="mt-2 break-all text-[22px] font-bold text-black">{user?.username || '未登录'}</p>
                    <button
                      type="button"
                      onClick={logout}
                      className="focus-ring mt-4 w-full rounded-[8px] border-[3px] border-black px-4 py-3 text-left text-[18px] font-semibold text-black transition hover:bg-[#f5f5f5]"
                    >
                      退出登录
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main id="main-content" className="min-h-[900px] px-8 py-10">
            {children}
          </main>

          <footer className="pb-10 text-center text-[17px] text-[#a1a1aa]">
            创意工作者们的社区
          </footer>
        </section>
      </div>
    </div>
  )
}

function HeaderCircle({ ariaLabel, ariaExpanded, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-haspopup={ariaLabel === 'User' ? 'menu' : undefined}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      className="focus-ring flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f5] text-black"
    >
      {children}
    </button>
  )
}
