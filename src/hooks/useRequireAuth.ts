import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext'

/**
 * Unified auth guard hook.
 * Usage: const { requireAuth, isLoggedIn, user } = useRequireAuth()
 * - requireAuth(callback): if logged in, run callback; otherwise show login modal
 * - isLoggedIn: boolean
 * - user: current user or null
 */
export function useRequireAuth() {
  const { state, dispatch } = useAppContext()

  const isLoggedIn = !!state.user?.isLoggedIn
  const user = state.user

  const requireAuth = useCallback(<T extends (...args: any[]) => any>(callback: T): T | null => {
    if (isLoggedIn) return callback
    // Not logged in — show login modal
    dispatch({ type: 'SHOW_LOGIN' })
    return null
  }, [isLoggedIn, dispatch])

  const checkAuth = useCallback((): boolean => {
    if (isLoggedIn) return true
    dispatch({ type: 'SHOW_LOGIN' })
    return false
  }, [isLoggedIn, dispatch])

  return { isLoggedIn, user, requireAuth, checkAuth }
}
