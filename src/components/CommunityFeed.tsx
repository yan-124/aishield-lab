import type { CommunityPost } from '../types';
import { useAppContext } from '../context/AppContext';

const posts: CommunityPost[] = [
  // 技术讨论帖
  { id: '1', author: '小白学安全', avatar: '🎓', content: '今天成功通关了靶场第3关"背景伪装"！关键是要先建立信任关系再逐步引导，和真实的社会工程学攻击思路很像。大家加油！', timestamp: '2小时前', likes: 24, comments: 8, tags: ['靶场通关', 'Prompt注入'] },
  { id: '2', author: 'AI安全研究者', avatar: '🔬', content: '分享一个有趣的发现：最新版本的GPT-4在处理多语言混合的Prompt注入时，防御效果明显弱于纯英文输入。这可能和训练数据分布有关。', timestamp: '5小时前', likes: 56, comments: 15, tags: ['研究', '发现'] },
  // 经验分享帖
  { id: '3', author: '转行日记', avatar: '🔄', content: '从传统网络安全转AI安全两个月了，最大的感触是：传统安全的很多思路在AI领域仍然适用，但技术细节完全不同。推荐大家从Prompt注入开始入门，门槛相对低。', timestamp: '1天前', likes: 89, comments: 23, tags: ['职业发展', '经验分享'] },
  // 资源分享帖
  { id: '5', author: '资源猎人', avatar: '📦', content: '挖到一个宝藏GitHub仓库：Awesome LLM Security，整理了100+篇AI安全论文和开源工具的链接。附上地址，大家自己去探索 👉', timestamp: '3天前', likes: 132, comments: 19, tags: ['资源', '论文', '工具'] },
  // 新手求助帖
  { id: '4', author: '在读研究生', avatar: '📚', content: '请问有人研究过联邦学习中的梯度反演攻击吗？最近在写相关论文，想找一些好的防御方法参考。', timestamp: '2天前', likes: 12, comments: 6, tags: ['学术', '求助'] },
  { id: '6', author: '刚入行的小明', avatar: '🐣', content: '刚开始学AI安全，想问一下对抗攻击和Prompt注入哪个更值得先学？感觉两个方向都好深，有没有过来人给个学习路线的建议？', timestamp: '4天前', likes: 31, comments: 22, tags: ['求助', '学习路线'] },
  // 求职/招聘讨论
  { id: '7', author: 'Offer收割机', avatar: '💼', content: '刚收到某大厂AI安全岗的offer，分享下面试经验：技术面问了Prompt注入分类、对抗训练原理、差分隐私算法推导。项目经验比八股文重要。', timestamp: '5天前', likes: 78, comments: 34, tags: ['求职', '面试'] },
  { id: '8', author: 'HR小助手', avatar: '📋', content: '我们团队正在招AI红队测试工程师！远程办公弹性工作制，要求有安全测试经验和大模型基础。感兴趣的私聊～', timestamp: '6天前', likes: 45, comments: 12, tags: ['招聘', '红队'] },
  // CTF/安全竞赛通知
  { id: '9', author: '竞赛公告', avatar: '🏆', content: '本周末将举办第三届"AI安全挑战赛"线上预选赛！赛题涵盖Prompt注入、对抗攻击和模型安全三大方向，冠军奖金3万元，欢迎大家组队报名！', timestamp: '1周前', likes: 210, comments: 56, tags: ['竞赛', 'CTF'] },
  // 技术讨论帖
  { id: '10', author: '红队老炮', avatar: '🎯', content: '花了一周时间把Garak红队框架跑通了，用它给公司内部LLM做了全量安全评估，发现了7个高危漏洞。自动化红队工具真的能大幅提升效率。', timestamp: '1周前', likes: 67, comments: 28, tags: ['红队', '工具', '经验分享'] },
];

export const CommunityFeed = ({ compact = false }: { compact?: boolean }) => {
  const { dispatch } = useAppContext();

  const content = (
    <div className="space-y-4">
      {(compact ? posts.slice(0, 4) : posts).map(post => (
        <div key={post.id} className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ background: 'rgba(16,185,129,0.1)' }}>{post.avatar}</div>
            <div>
              <div className="text-sm font-semibold text-white">{post.author}</div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{post.timestamp}</div>
            </div>
          </div>
          <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>{post.content}</p>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {post.tags?.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>#{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button className="text-[10px] flex items-center gap-1 cursor-pointer" style={{ color: 'rgba(255,255,255,0.3)' }}>
                ❤️ {post.likes}
              </button>
              <button className="text-[10px] flex items-center gap-1 cursor-pointer" style={{ color: 'rgba(255,255,255,0.3)' }}>
                💬 {post.comments}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">💬 社区动态</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>学员分享与交流</p>
          </div>
          <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'community' })}
            className="text-xs cursor-pointer" style={{ color: '#10B981' }}>查看全部 →</button>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8 relative overflow-hidden">
      {/* purple/pink ambient glow in header */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.45), rgba(139,92,246,0.25))' }}
      />

      <div className="flex items-center justify-between relative">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">💬 社区动态</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>分享你的学习心得和发现 · 共{posts.length}条动态</p>
        </div>
        <button className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
          ✏️ 发布动态
        </button>
      </div>
      {content}
    </div>
  );
};
