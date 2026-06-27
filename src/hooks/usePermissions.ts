import { useCallback, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import type { SubscriptionTier } from '../types'

/**
 * 权限控制 Hook
 * 
 * 使用方式：
 * const { isMember, canAccessRange, canAccessKnowledge, canAccessVideo, canUseInterviewCoach, remainingInterviewUses, showUpgradePrompt } = usePermissions()
 */
export function usePermissions() {
  const { state, dispatch } = useAppContext()
  const tier: SubscriptionTier = state.user?.subscriptionTier || 'free'

  const isMember = tier !== 'free'
  const isFree = tier === 'free'

  // 靶场：前5关免费，第6-25关需要会员
  const canAccessRange = useCallback((levelNumber: number): boolean => {
    return levelNumber <= 5 || isMember
  }, [isMember])

  // 知识库：免费用户只能看预览（前300字）
  const canAccessFullKnowledge = isMember

  // 视频：免费用户只能看前3分钟
  const canAccessFullVideo = isMember

  // 面试搭子：免费用户每天3次，会员无限次
  const getInterviewRemainingUses = useCallback((): number => {
    if (isMember) return Infinity
    const today = new Date().toISOString().split('T')[0]
    try {
      const stored = localStorage.getItem('aishield_interview_uses')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.date === today) return Math.max(0, 3 - data.count)
      }
    } catch {}
    return 3
  }, [isMember])

  const recordInterviewUse = useCallback((): boolean => {
    if (isMember) return true
    const today = new Date().toISOString().split('T')[0]
    try {
      const stored = localStorage.getItem('aishield_interview_uses')
      let data: { date: string; count: number }
      if (stored) {
        data = JSON.parse(stored)
        if (data.date !== today) {
          data = { date: today, count: 0 }
        }
      } else {
        data = { date: today, count: 0 }
      }
      if (data.count >= 3) return false
      data.count++
      localStorage.setItem('aishield_interview_uses', JSON.stringify(data))
      return true
    } catch {}
    return false
  }, [isMember])

  const canUseInterviewCoach = useCallback((): boolean => {
    if (isMember) return true
    return getInterviewRemainingUses() > 0
  }, [isMember, getInterviewRemainingUses])

  const remainingInterviewUses = useMemo(() => getInterviewRemainingUses(), [getInterviewRemainingUses])

  // 显示升级弹窗
  const showUpgradePrompt = useCallback((_feature?: string) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'pricing' })
  }, [dispatch])

  return {
    tier,
    isMember,
    isFree,
    canAccessRange,
    canAccessFullKnowledge,
    canAccessFullVideo,
    canUseInterviewCoach,
    recordInterviewUse,
    remainingInterviewUses,
    showUpgradePrompt,
  }
}
