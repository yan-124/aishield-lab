import type { NewsItem } from '../types';
import { useAppContext } from '../context/AppContext';

const news: NewsItem[] = [
  // 模型安全事件
  { id: '1', title: '研究人员发现新型LLM水印绕过攻击方法', source: '安全内参', timestamp: '2小时前', summary: '来自清华大学的团队提出了一种新的攻击方法，可以移除大语言模型中的水印标记而不影响输出质量...', category: '模型安全' },
  // 行业动态
  { id: '2', title: 'OpenAI发布新版安全对齐技术文档', source: 'OpenAI Blog', timestamp: '5小时前', summary: 'OpenAI详细介绍了GPT-4o的安全对齐训练过程，包括RLHF和多轮红队测试的改进...', category: '行业动态' },
  // 政策法规
  { id: '3', title: '欧盟AI法案正式生效，企业合规指南发布', source: '路透社', timestamp: '8小时前', summary: '欧盟AI法案已正式实施，相关监管机构发布了企业合规操作指南，高风险AI系统需在规定时间内完成合规审查...', category: '合规治理' },
  // 威胁情报
  { id: '4', title: '深度伪造语音攻击导致金融诈骗损失上升300%', source: '暗网快讯', timestamp: '1天前', summary: '最新报告显示，利用AI深度伪造技术进行语音诈骗的案件数量大幅上升，金融机构正在加强声纹验证...', category: '威胁情报' },
  // 模型安全
  { id: '5', title: 'Google发布AI安全评估框架SAIF更新版', source: 'Google Blog', timestamp: '1天前', summary: 'Google发布了SAIF框架的重大更新，新增了对多模态模型和Agent系统的安全评估标准...', category: '模型安全' },
  // 政策法规
  { id: '6', title: '首例AI模型训练数据版权侵权案判决出炉', source: '纽约时报', timestamp: '2天前', summary: '美国法院对首例AI训练数据版权侵权案作出判决，对AI公司的数据使用行为产生重要影响...', category: '合规治理' },
  // 行业报告
  { id: '7', title: 'Gartner发布2026年AI安全技术成熟度曲线', source: 'Gartner', timestamp: '3天前', summary: '报告指出AI安全进入快速发展期，其中红队测试工具和LLM防火墙将在2-5年内进入主流采用阶段...', category: '行业动态' },
  // 工具/产品发布
  { id: '8', title: 'Meta开源Purple Llama安全工具套件', source: 'Meta AI', timestamp: '4天前', summary: 'Meta正式开源包含Llama Guard和Code Shield在内的AI安全评估工具集，支持开发者一键集成安全检测...', category: '行业动态' },
  // 学术研究突破
  { id: '9', title: 'MIT提出可证明鲁棒的对抗防御新框架', source: 'Nature Machine Intelligence', timestamp: '5天前', summary: 'MIT研究团队提出了一种基于可达集分析的形式化验证方法，首次在图像分类任务上实现可证明的对抗鲁棒性保证...', category: '模型安全' },
  // 安全事件
  { id: '10', title: '开源模型仓库遭供应链投毒攻击，多个LLM受影响', source: 'The Verge', timestamp: '6天前', summary: '攻击者向HuggingFace上传了含后门的模型权重，影响数千个下游应用。平台已启动全量扫描机制...', category: '威胁情报' },
];

const catColors: Record<string, string> = {
  '模型安全': '#3B82F6',
  '行业动态': '#10B981',
  '合规治理': '#8B5CF6',
  '威胁情报': '#EF4444',
};

export const NewsFeed = ({ compact = false }: { compact?: boolean }) => {
  const { dispatch } = useAppContext();

  const content = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {(compact ? news.slice(0, 4) : news).map(item => (
        <div key={item.id} className="p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${catColors[item.category] || '#10B981'}15`, color: catColors[item.category] || '#10B981' }}>{item.category}</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{item.timestamp}</span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.summary}</p>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>来源: {item.source}</span>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">📰 AI安全新闻</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>每日实时更新</p>
          </div>
          <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'news' })}
            className="text-xs cursor-pointer" style={{ color: '#10B981' }}>查看全部 →</button>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8 relative overflow-hidden">
      {/* amber/yellow ambient glow in header */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.45), rgba(245,158,11,0.25))' }}
      />

      <div className="relative">
        <h1 className="text-3xl font-black text-white mb-1">📰 AI安全新闻</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>每日精选AI安全领域最新动态 · 共{news.length}条</p>
      </div>
      {content}
    </div>
  );
};
