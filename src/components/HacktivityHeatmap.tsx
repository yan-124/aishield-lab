import React, { useState, useMemo } from 'react'
import { Flame, Trophy, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

/* -- Generate mock activity data (past 52 weeks) -- */
function generateActivityData() {
  const data = {}
  const now = new Date()
  for (let i = 365; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    const dayOfWeek = d.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    let prob = isWeekend ? 0.25 : 0.55
    if (i < 30) prob += 0.15
    if (i < 7) prob += 0.1
    if (Math.random() < 0.08) prob += 0.5
    const active = Math.random() < prob
    let count = 0
    if (active) {
      count = Math.floor(Math.random() * 5) + 1
      if (Math.random() < 0.1) count += Math.floor(Math.random() * 8) + 3
    }
    data[key] = count
  }
  return data
}

const ACTIVITY_COLORS = [
  'rgba(139,92,246,0.08)',
  'rgba(139,92,246,0.25)',
  'rgba(139,92,246,0.45)',
  'rgba(139,92,246,0.65)',
  'rgba(168,85,247,0.75)',
  'rgba(192,132,252,0.90)',
]

function getColor(count) {
  if (count === 0) return ACTIVITY_COLORS[0]
  if (count === 1) return ACTIVITY_COLORS[1]
  if (count <= 2) return ACTIVITY_COLORS[2]
  if (count <= 3) return ACTIVITY_COLORS[3]
  if (count <= 5) return ACTIVITY_COLORS[4]
  return ACTIVITY_COLORS[5]
}

const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export default function HacktivityHeatmap() {
  const [hoveredCell, setHoveredCell] = useState(null)
  const activityData = useMemo(() => generateActivityData(), [])

  const weeks = []
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - 364)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  let currentDate = new Date(startDate)
  let currentWeek = []
  while (currentDate <= now || currentWeek.length > 0) {
    const key = currentDate.toISOString().split("T")[0]
    const count = activityData[key] ?? 0
    const isFuture = currentDate > now
    currentWeek.push({ date: key, count: isFuture ? -1 : count })
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentDate.setDate(currentDate.getDate() + 1)
    if (currentWeek.length === 0 && currentDate > now) break
  }

  const totalSolves = Object.values(activityData).reduce((s, c) => s + c, 0)
  const activeDays = Object.values(activityData).filter(c => c > 0).length

  const monthPositions = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const midDate = new Date(week[0].date)
    const m = midDate.getMonth()
    if (m !== lastMonth) {
      monthPositions.push({ label: MONTH_LABELS[m], weekIdx: wi })
      lastMonth = m
    }
  })

  const cellSize = 13
  const cellGap = 3
  const step = cellSize + cellGap

  return (
    <section className="relative py-16 sm:py-20 lg:py-24" style={{
      background: 'linear-gradient(180deg, #0A0E1F 0%, #080C18 50%, #060B14 100%)',
    }}>
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent 10%, rgba(139,92,246,0.3) 50%, transparent 90%)',
      }} />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-7 lg:px-12">
        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          className="flex items-center gap-3 mb-8 sm:mb-10">
          <div className="p-2 rounded-lg" style={{
            background: 'rgba(249,115,22,0.12)',
            border: '1px solid rgba(249,115,22,0.2)',
          }}>
            <Flame className="w-5 h-5" style={{ color: '#F97316' }} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Hacktivity</h2>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'rgba(148,163,184,0.5)' }}>
              平台攻防活动热力图 · 过去 365 天
            </p>
          </div>
        </motion.div>

        {/* Heatmap grid */}
        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          transition={{ delay: 0.1 }}
          className="relative overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}>
          <div style={{ minWidth: '700px' }}>
            {/* Month labels */}
            <div className="relative mb-1.5" style={{ height: '16px' }}>
              {monthPositions.map((mp, i) => (
                <span key={i} className="text-[10px] font-medium absolute" style={{
                  color: 'rgba(148,163,184,0.4)',
                  left: mp.weekIdx * step + 'px',
                }}>
                  {mp.label}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div className="relative" style={{ height: 7 * step + 'px' }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="absolute top-0" style={{ left: wi * step + 'px' }}>
                  {week.map((cell, di) => {
                    if (cell.count < 0) return null
                    return (
                      <div
                        key={cell.date}
                        className="absolute rounded-sm cursor-crosshair transition-all duration-150 hover:ring-1 hover:ring-purple-400/50 hover:scale-125"
                        style={{
                          left: 0,
                          top: di * step + 'px',
                          width: cellSize + 'px',
                          height: cellSize + 'px',
                          background: getColor(cell.count),
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setHoveredCell({
                            date: cell.date,
                            count: cell.count,
                            pos: { x: rect.left + rect.width / 2, y: rect.top },
                          })
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tooltip */}
        {hoveredCell && (
          <div className="fixed z-50 pointer-events-none" style={{
            left: hoveredCell.pos.x + 'px',
            top: hoveredCell.pos.y - 40 + 'px',
            transform: 'translateX(-50%)',
          }}>
            <div className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{
              background: 'rgba(30,27,75,0.95)',
              border: '1px solid rgba(139,92,246,0.3)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              color: 'rgba(226,232,240,0.9)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ color: '#C4B5FD' }}>{hoveredCell.date}</span>
              {' · '}
              {hoveredCell.count > 0
                ? <span style={{ color: '#34D399' }}>{hoveredCell.count} 次攻防</span>
                : <span style={{ color: 'rgba(148,163,184,0.5)' }}>无活动</span>
              }
            </div>
          </div>
        )}

        {/* Legend + Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 gap-4">
          {/* Color legend */}
          <div className="flex items-center gap-2 text-[10px]" style={{ color: 'rgba(148,163,184,0.4)' }}>
            <span>Less</span>
            {ACTIVITY_COLORS.map((c, i) => (
              <div key={i} className="rounded-sm" style={{ width: cellSize, height: cellSize, background: c }} />
            ))}
            <span>More</span>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-5 sm:gap-7">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" style={{ color: '#FBBF24' }} />
              <span className="text-xs font-semibold text-white">{totalSolves}</span>
              <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.4)' }}>总攻防</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" style={{ color: '#34D399' }} />
              <span className="text-xs font-semibold text-white">{activeDays}</span>
              <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.4)' }}>活跃天</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}