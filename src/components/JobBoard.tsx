import { ExternalLink, RefreshCw } from 'lucide-react';
import { jobs, JOB_DATA_LAST_UPDATED } from '../data/jobs';

export const JobBoard = () => (
  <div className="max-w-4xl mx-auto px-6 py-12 space-y-8 relative overflow-hidden">
    {/* blue/indigo ambient glow in header */}
    <div
      className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.45), rgba(99,102,241,0.25))' }}
    />

    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-4xl font-black text-white">💼 AI安全招聘</h1>
        <span className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
          <RefreshCw className="w-3 h-3" />
          数据更新于 {JOB_DATA_LAST_UPDATED}
        </span>
      </div>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
        真实AI安全岗位 · 来自猎聘/Boss直聘等平台 · 共{jobs.length}个在招岗位
      </p>
    </div>

    <div className="space-y-3 relative">
      {jobs.map(job => (
        <div key={job.id} className="p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)' }}>{job.logo}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1 gap-2">
                <h3 className="text-sm font-bold text-white truncate">{job.title}</h3>
                <span className="text-sm font-bold shrink-0" style={{ color: '#10B981' }}>{job.salary}</span>
              </div>
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {job.company} · {job.location}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {job.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>{tag}</span>
                ))}
                <span className="text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }}>{job.postedAt}</span>
              </div>
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[10px] px-2 py-0.5 rounded-full transition-colors"
                  style={{
                    background: 'rgba(59,130,246,0.08)',
                    color: 'rgba(96,165,250,0.7)',
                    border: '1px solid rgba(59,130,246,0.15)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
                    e.currentTarget.style.color = '#60A5FA';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
                    e.currentTarget.style.color = 'rgba(96,165,250,0.7)';
                  }}
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  {job.sourceName ?? '查看原文'}
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="text-center pt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
      <p className="text-xs">💡 更多AI安全岗位可前往 <a href="https://www.zhipin.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400 transition-colors">Boss直聘</a> / <a href="https://www.liepin.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400 transition-colors">猎聘</a> 搜索「AI安全」「大模型安全」「LLM安全」</p>
    </div>
  </div>
);
