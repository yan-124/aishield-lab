import type { VideoItem } from '../types';
import { Play, Eye, Clock, Film } from 'lucide-react';

const videos: VideoItem[] = [
  { id: '1', title: 'Prompt注入攻击实战演示', description: '用真实案例演示如何进行Prompt注入攻击以及防御方法', thumbnail: '', duration: '12:30', views: 2340, category: 'Prompt注入' },
  { id: '5', title: '高级越狱技术：DAN、角色扮演与编码绕过', description: '深入解析DAN攻击、角色扮演注入和Base64编码三种越狱手法', thumbnail: '', duration: '22:15', views: 3120, category: 'Prompt注入' },
  { id: '7', title: 'Prompt注入防御全攻略：输入过滤与输出检测', description: '从输入清洗到输出监控，体系化构建Prompt注入防御方案', thumbnail: '', duration: '18:40', views: 1890, category: 'Prompt注入' },
  { id: '2', title: '对抗攻击入门：让AI看错图像', description: '从零开始学习对抗样本的生成原理和实际影响', thumbnail: '', duration: '18:45', views: 1890, category: '对抗攻击' },
  { id: '8', title: '对抗防御方法对比：对抗训练与输入变换', description: '横向对比对抗训练、特征去噪、JPEG压缩等主流防御手段的效果', thumbnail: '', duration: '20:30', views: 1450, category: '对抗攻击' },
  { id: '3', title: 'ChatGPT安全机制深度解析', description: '拆解OpenAI的安全对齐技术栈', thumbnail: '', duration: '25:10', views: 4560, category: '模型安全' },
  { id: '9', title: '开源大模型安全评估：Llama、Mistral、Qwen对比', description: '针对主流开源模型进行红队测试，横向对比安全防护能力差异', thumbnail: '', duration: '28:00', views: 2230, category: '模型安全' },
  { id: '10', title: 'AI安全评估工具链搭建：从入门到自动化', description: '手把手搭建Garak+Giskard+PyRIT的集成红队评估流水线', thumbnail: '', duration: '26:20', views: 1670, category: '工具教程' },
  { id: '11', title: '自动化安全检测工具：LLM Guard使用详解', description: 'Protect AI的LLM Guard工具安装配置与自定义规则编写实战', thumbnail: '', duration: '15:50', views: 1210, category: '工具教程' },
  { id: '4', title: 'AI安全工程师的一天', description: '真实的AI安全岗位工作内容和职业发展路径', thumbnail: '', duration: '15:20', views: 3200, category: '职业发展' },
  { id: '12', title: 'AI安全行业薪资与技能要求全景图', description: '2026年AI安全各细分方向的薪资分布与必备技能矩阵', thumbnail: '', duration: '19:45', views: 2780, category: '职业发展' },
  { id: '6', title: '2025年重大AI安全事故复盘：从越狱到数据泄露', description: '回顾年度最具影响力的AI安全事故及行业应对策略', thumbnail: '', duration: '30:00', views: 5340, category: '前沿动态' },
];

const catColors: Record<string, string> = {
  'Prompt注入': '#EF4444',
  '对抗攻击': '#F59E0B',
  '模型安全': '#3B82F6',
  '工具教程': '#10B981',
  '职业发展': '#8B5CF6',
  '前沿动态': '#EC4899',
};

const gradients = [
  'linear-gradient(135deg, #EF4444, #F59E0B)',
  'linear-gradient(135deg, #3B82F6, #8B5CF6)',
  'linear-gradient(135deg, #10B981, #059669)',
  'linear-gradient(135deg, #EC4899, #F43F5E)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
  'linear-gradient(135deg, #8B5CF6, #3B82F6)',
  'linear-gradient(135deg, #EF4444, #F59E0B)',
  'linear-gradient(135deg, #3B82F6, #8B5CF6)',
  'linear-gradient(135deg, #10B981, #059669)',
  'linear-gradient(135deg, #EC4899, #F43F5E)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
  'linear-gradient(135deg, #8B5CF6, #3B82F6)',
];

export const VideoSection = ({ compact = false }: { compact?: boolean }) => {
  const VideoGrid = ({ limit }: { limit: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.slice(0, limit).map((video, i) => {
        const color = catColors[video.category] || '#38BDF8';
        return (
          <div
            key={video.id}
            className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* hover glow with category color */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10"
              style={{ boxShadow: `0 0 30px ${color}25` }}
            />

            {/* top accent line on hover */}
            <div
              className="absolute top-0 left-4 right-4 h-[2px] rounded-b opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
              style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
            />

            {/* thumbnail */}
            <div
              className="relative aspect-video flex items-center justify-center overflow-hidden"
              style={{ background: gradients[i % gradients.length] }}
            >
              {/* subtle shimmer overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite linear',
                }}
              />
              {/* subtle overlay pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* play button */}
              <div
                className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <Play size={18} className="text-white ml-0.5" fill="white" />
              </div>

              {/* duration badge */}
              <span
                className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1"
                style={{ background: 'rgba(0,0,0,0.55)', color: 'white', backdropFilter: 'blur(4px)' }}
              >
                <Clock size={9} />
                {video.duration}
              </span>
            </div>

            {/* info */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-1.5 group-hover:text-sky-200 transition-colors duration-200 line-clamp-2">
                {video.title}
              </h3>
              <p className="text-[12px] mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {video.description}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: `${color}15`,
                    color: color,
                    border: `1px solid ${color}25`,
                  }}
                >
                  {video.category}
                </span>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Eye size={11} />
                  {video.views.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Compact (HomePage) ──
  if (compact) {
    return <VideoGrid limit={3} />;
  }

  // ── Full page ──
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-8 relative overflow-hidden">
      {/* amber/orange ambient glow in header */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.45), rgba(249,115,22,0.25))' }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.2)' }}>
            VIDEO TUTORIALS
          </span>
        </div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Film size={28} className="text-amber-400" />
          <span className="text-gradient" style={{ backgroundImage: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #F97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>视频教程</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          AI安全知识点视频讲解，实战演示 · 共 {videos.length} 个视频
        </p>
      </div>
      <VideoGrid limit={12} />
    </div>
  );
};
