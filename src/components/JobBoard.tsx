import type { JobItem } from '../types';

const jobs: JobItem[] = [
  { id: '1', company: '字节跳动', logo: '🏢', title: 'AI安全工程师', location: '北京', salary: '40-70K', tags: ['Prompt安全', '模型审计'], postedAt: '1天前' },
  { id: '2', company: '蚂蚁集团', logo: '🐜', title: '大模型安全研究员', location: '上海', salary: '35-60K', tags: ['对抗攻击', '红队测试'], postedAt: '2天前' },
  { id: '3', company: '微众银行', logo: '🏦', title: 'AI合规专家', location: '深圳', salary: '30-50K', tags: ['合规治理', '风险评估'], postedAt: '3天前' },
  { id: '4', company: '月之暗面', logo: '🌙', title: '安全算法工程师', location: '北京', salary: '45-80K', tags: ['模型安全', '联邦学习'], postedAt: '5天前' },
  { id: '5', company: '奇安信', logo: '🛡️', title: 'AI红队测试工程师', location: '成都', salary: '30-55K', tags: ['红队', '渗透测试'], postedAt: '1周前' },
  { id: '6', company: '百度安全', logo: '🔍', title: 'LLM安全评测师', location: '北京', salary: '35-65K', tags: ['评测', 'Prompt注入'], postedAt: '1周前' },
  { id: '7', company: '腾讯安全', logo: '💬', title: 'AI安全产品经理', location: '深圳', salary: '40-75K', tags: ['产品', '安全'], postedAt: '2周前' },
  { id: '8', company: '智谱AI', logo: '🧠', title: 'AI安全研究员（可信AI方向）', location: '北京', salary: '50-90K', tags: ['模型安全', '对齐'], postedAt: '2周前' },
];

export const JobBoard = () => (
  <div className="max-w-4xl mx-auto px-6 py-12 space-y-8 relative overflow-hidden">
    {/* blue/indigo ambient glow in header */}
    <div
      className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.45), rgba(99,102,241,0.25))' }}
    />

    <div className="relative">
      <h1 className="text-3xl font-black text-white mb-1">💼 招聘信息</h1>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>AI安全相关岗位推荐 · 共{jobs.length}个岗位</p>
    </div>
    <div className="space-y-3 relative">
      {jobs.map(job => (
        <div key={job.id} className="p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)' }}>{job.logo}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-sm font-bold text-white">{job.title}</h3>
                <span className="text-sm font-bold shrink-0" style={{ color: '#10B981' }}>{job.salary}</span>
              </div>
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{job.company} · {job.location}</p>
              <div className="flex items-center gap-2">
                {job.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>{tag}</span>
                ))}
                <span className="text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }}>{job.postedAt}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
