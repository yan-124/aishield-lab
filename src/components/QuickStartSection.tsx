import { useAppContext } from '../context/AppContext'
import { BookOpen, Target, Trophy, ArrowRight } from 'lucide-react'

/**
 * 快速开始模块 - 紧急上线版本
 * 位置：放在HeroSection和HacktivityHeatmap之间
 * 目的：告诉新用户"下一步该做什么"
 */
export function QuickStartSection() {
  const { dispatch } = useAppContext()

  const handleStartLearning = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'learning-path' })
  }

  const handleStartPractice = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'range' })
  }

  const handleViewKnowledge = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'knowledge' })
  }

  return (
    <section className="relative py-20 px-6 lg:px-12 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            选择你的学习路径
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            无论你是AI安全新手还是经验丰富的专家，我们为你准备了系统的学习方案
          </p>
        </div>

        {/* 3张卡片 */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* 卡片1：新手入门 */}
          <div 
            className="group relative bg-white/[0.03] backdrop-blur-sm rounded-2xl p-8 border border-white/10 
                       hover:border-purple-500/30 hover:bg-white/[0.06] 
                       transition-all duration-300 cursor-pointer"
            onClick={handleStartLearning}
          >
            {/* 图标 */}
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6
                          bg-gradient-to-br from-green-500/20 to-emerald-500/20
                          group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="w-7 h-7 text-green-400" />
            </div>

            {/* 内容 */}
            <h3 className="text-xl font-semibold text-white mb-3">
              我是新手
            </h3>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              从未接触过AI安全？从零开始，系统学习AI Agent安全的基础知识和实战技能
            </p>

            {/* 元数据 */}
            <div className="flex items-center gap-4 text-xs text-white/40 mb-6">
              <span>📚 25关实战</span>
              <span>⏱️ 预计20小时</span>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleStartLearning(); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                         bg-purple-500/10 text-purple-300 border border-purple-500/20
                         group-hover:bg-purple-500/20 group-hover:border-purple-500/30
                         transition-all duration-200"
            >
              开始学习
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 悬停光效 */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 60%)',
              }}
            />
          </div>

          {/* 卡片2：实战练习 */}
          <div 
            className="group relative bg-white/[0.03] backdrop-blur-sm rounded-2xl p-8 border border-white/10 
                       hover:border-cyan-500/30 hover:bg-white/[0.06] 
                       transition-all duration-300 cursor-pointer"
            onClick={handleStartPractice}
          >
            {/* 图标 */}
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6
                          bg-gradient-to-br from-cyan-500/20 to-blue-500/20
                          group-hover:scale-110 transition-transform duration-300">
              <Target className="w-7 h-7 text-cyan-400" />
            </div>

            {/* 内容 */}
            <h3 className="text-xl font-semibold text-white mb-3">
              实战练习
            </h3>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              已有基础？直接进入靶场，挑战OWASP LLM Top 10攻防演练，提升实战能力
            </p>

            {/* 元数据 */}
            <div className="flex items-center gap-4 text-xs text-white/40 mb-6">
              <span>🎯 3大模型</span>
              <span>🔥 难度递增</span>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleStartPractice(); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                         bg-cyan-500/10 text-cyan-300 border border-cyan-500/20
                         group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30
                         transition-all duration-200"
            >
              进入靶场
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 悬停光效 */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.1) 0%, transparent 60%)',
              }}
            />
          </div>

          {/* 卡片3：知识库 */}
          <div 
            className="group relative bg-white/[0.03] backdrop-blur-sm rounded-2xl p-8 border border-white/10 
                       hover:border-amber-500/30 hover:bg-white/[0.06] 
                       transition-all duration-300 cursor-pointer"
            onClick={handleViewKnowledge}
          >
            {/* 图标 */}
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6
                          bg-gradient-to-br from-amber-500/20 to-orange-500/20
                          group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>

            {/* 内容 */}
            <h3 className="text-xl font-semibold text-white mb-3">
              知识库
            </h3>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              查阅详细的AI安全文档、技术文章和最佳实践，系统掌握知识体系
            </p>

            {/* 元数据 */}
            <div className="flex items-center gap-4 text-xs text-white/40 mb-6">
              <span>📖 100+文章</span>
              <span>🆕 持续更新</span>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleViewKnowledge(); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                         bg-amber-500/10 text-amber-300 border border-amber-500/20
                         group-hover:bg-amber-500/20 group-hover:border-amber-500/30
                         transition-all duration-200"
            >
              浏览知识库
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 悬停光效 */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(251,191,36,0.1) 0%, transparent 60%)',
              }}
            />
          </div>

        </div>

        {/* 底部提示 */}
        <div className="text-center mt-12">
          <p className="text-white/40 text-sm">
            💡 提示：建议从"新手入门"开始，系统学习效果更好
          </p>
        </div>

      </div>
    </section>
  )
}
