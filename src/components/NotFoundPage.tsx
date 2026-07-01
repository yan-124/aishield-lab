import { useAppContext } from '../context/AppContext'

export const NotFoundPage = () => {
  const { dispatch } = useAppContext()

  const handleGoHome = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })
    window.location.hash = ''
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
      style={{ backgroundColor: 'var(--color-bg-root)' }}
    >
      {/* 404 大字 */}
      <div
        className="text-8xl md:text-9xl font-bold select-none"
        style={{
          color: 'var(--color-text-secondary)',
          opacity: 0.15,
        }}
      >
        404
      </div>

      {/* 盾牌图标 */}
      <div className="mt-[-3rem] mb-4">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--color-accent)' }}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {/* 提示文字 */}
      <h1
        className="text-2xl font-bold mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        页面不存在
      </h1>
      <p
        className="text-base mb-8 text-center max-w-md"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        您访问的页面不存在或已被移除，请检查链接是否正确，或返回首页继续探索。
      </p>

      {/* 返回首页按钮 */}
      <button
        onClick={handleGoHome}
        className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        返回首页
      </button>
    </div>
  )
}
