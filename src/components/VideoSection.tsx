import { useState } from 'react';
import { Play, Sword, Building, FileCheck, Settings, GraduationCap, Lock } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { UpgradePrompt } from './UpgradePrompt';

// 5大方向分类，与职业评估10岗位一一对应
const VIDEO_CATEGORIES = [
  {
    id: 'offense',
    icon: Sword,
    color: '#EF4444',
    gradient: 'from-red-500/20 to-red-900/20',
    title: '攻防实战',
    tags: ['Prompt注入', '越狱', '红队'],
    jobs: ['AI安全测试员', 'AI安全攻防工程师', 'LLM安全研究员']
  },
  {
    id: 'architecture',
    icon: Building,
    color: '#3B82F6',
    gradient: 'from-blue-500/20 to-blue-900/20',
    title: '安全架构',
    subtitle: '安全设计评审员 → 安全架构师 → 产品经理',
    tags: ['体系搭建', '威胁建模', '设计评审'],
    jobs: ['安全设计评审员', 'AI安全体系架构师', 'AI安全产品经理']
  },
  {
    id: 'compliance',
    icon: FileCheck,
    color: '#10B981',
    gradient: 'from-emerald-500/20 to-emerald-900/20',
    title: '合规治理',
    subtitle: '合规助理 → 合规专家 → 审计师/顾问',
    tags: ['等保', 'ISO', '审计', '监管'],
    jobs: ['合规助理', 'AI安全合规专家', 'AI安全审计师', 'AI安全顾问']
  },
  {
    id: 'operations',
    icon: Settings,
    color: '#F59E0B',
    gradient: 'from-amber-500/20 to-amber-900/20',
    title: '安全运营',
    subtitle: '安全运维 → 运营工程师 → 数据安全工程师',
    tags: ['DevSecOps', '监控', '应急'],
    jobs: ['安全运维', 'AI安全运营工程师', 'AI数据安全工程师']
  },
  {
    id: 'entry',
    icon: GraduationCap,
    color: '#8B5CF6',
    gradient: 'from-violet-500/20 to-violet-900/20',
    title: '转型入门',
    subtitle: '零基础入门 → 岗位选择 → 面试通关',
    tags: ['转型路径', '方向选择', '面试'],
    jobs: ['零基础入门', '岗位选择', '面试准备']
  }
];

// 视频数据（后续接入真实视频源）
const SAMPLE_VIDEOS = [
  { cat: 'offense', title: 'Prompt注入入门：5分钟理解攻击原理', duration: '5:30', level: '入门' },
  { cat: 'offense', title: 'DAN攻击实战：绕过ChatGPT安全过滤', duration: '12:45', level: '进阶' },
  { cat: 'offense', title: '多轮越狱：上下文注入深度解析', duration: '18:20', level: '高级' },
  { cat: 'architecture', title: 'AI安全体系从0到1：架构师必修课', duration: '22:10', level: '进阶' },
  { cat: 'architecture', title: '威胁建模实战：STRIDE方法在LLM场景的应用', duration: '15:30', level: '高级' },
  { cat: 'compliance', title: '等保2.0新增AI安全要求解读', duration: '8:45', level: '入门' },
  { cat: 'compliance', title: 'ISO 42001 AI管理体系认证实战', duration: '20:00', level: '进阶' },
  { cat: 'operations', title: 'DevSecOps落地：从代码扫描到AI安全门禁', duration: '16:30', level: '进阶' },
  { cat: 'operations', title: 'AI安全运营7×24：监控与应急响应', duration: '14:15', level: '高级' },
  { cat: 'entry', title: '安全人转型AI安全：3个月路线图', duration: '10:00', level: '入门' },
  { cat: 'entry', title: 'AI安全面试高频20题精讲', duration: '25:00', level: '进阶' },
  { cat: 'entry', title: '从合规到AI安全：我的转型故事', duration: '18:00', level: '入门' },
];

export const VideoSection = ({ compact = false }: { compact?: boolean }) => {
  const [activeCategory, setActiveCategory] = useState('offense');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { canAccessFullVideo } = usePermissions();

  const activeCat = VIDEO_CATEGORIES.find(c => c.id === activeCategory) || VIDEO_CATEGORIES[0];
  const filteredVideos = SAMPLE_VIDEOS.filter(v => v.cat === activeCategory);

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(167,139,250,0.1)' }}>
              <Play size={24} className="text-violet-400" />
            </div>
            <div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide"
                style={{ color: '#A78BFA', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                VIDEO TUTORIALS
              </span>
              <h1 className="text-4xl font-black  mb-1" style={{ color: '#A78BFA' }}>视频教程</h1>
            </div>
          </div>
        </div>

        {/* Category tabs - compact */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {VIDEO_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive ? '' : 'hover:bg-white/5'
                }`}
                style={{
                  background: isActive ? (cat.color + '18') : 'rgba(255,255,255,0.03)',
                  color: isActive ? cat.color : 'rgba(255,255,255,0.5)',
                  border: isActive ? ('1px solid ' + cat.color + '40') : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.title}</span>
                <span className="text-[10px] opacity-60">({cat.tags.length})</span>
              </button>
            );
          })}
          <div className="flex-1 flex items-center justify-end">
            <span className="text-[11px] whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.25)' }}>
              共 {filteredVideos.length} 个视频
            </span>
          </div>
        </div>

        {/* Video grid */}
        <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {filteredVideos.map((video, i) => (
            <div key={i} className="group bg-white/[0.03] rounded-xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors relative">
              {/* Thumbnail placeholder */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <Play className={`w-10 h-10 text-white/30 group-hover:text-white/50 transition-colors ${!canAccessFullVideo ? 'opacity-30' : ''}`} />
                <span className="absolute bottom-2 right-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-gray-300">
                  {video.duration}
                </span>
                <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded" style={{ color: activeCat.color, backgroundColor: activeCat.color + '20' }}>
                  {video.level}
                </span>

                {/* 非会员锁 */}
                {!canAccessFullVideo && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
                    style={{ background: 'rgba(10,10,26,0.7)', backdropFilter: 'blur(4px)' }}
                    onClick={(e) => { e.stopPropagation(); setUpgradeOpen(true); }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center mb-1.5"
                      style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)' }}>
                      <Lock size={16} style={{ color: '#A78BFA' }} />
                    </div>
                    <span className="text-[10px] font-medium text-white/60">预览 3 分钟</span>
                    <span className="text-[9px] text-white/30">会员解锁完整版</span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium leading-snug line-clamp-2">{video.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon hint */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">更多视频持续更新中 · 每周新增3-5个实战教程</p>
        </div>
      </div>

      <UpgradePrompt open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="video" />
    </div>
  );
};
