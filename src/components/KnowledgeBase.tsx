import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { KnowledgeCategory, KnowledgeArticle } from '../types';
import {
  BookOpen, HelpCircle, Search, ArrowRight,
  ShieldAlert, Swords, Brain, Lock, Scale, Crosshair,
  Clock,
} from 'lucide-react';

const categories: KnowledgeCategory[] = [
  { id: 'prompt-injection', name: 'Prompt 注入', icon: '💉', description: 'Prompt注入、越狱攻击、多语言注入与间接注入实例深度分析', articleCount: 35, color: '#EF4444' },
  { id: 'adversarial', name: '对抗攻击', icon: '⚔️', description: '对抗样本生成、CLIP攻击、多模态对抗与物理世界对抗防御', articleCount: 30, color: '#F59E0B' },
  { id: 'model-safety', name: '模型安全', icon: '🤖', description: '模型水印、对齐技术、RLHF安全、宪法AI与红队测试方法', articleCount: 42, color: '#3B82F6' },
  { id: 'data-privacy', name: '数据隐私', icon: '🔒', description: '成员推理攻击、模型逆向、联邦学习与数据去标识化技术', articleCount: 25, color: '#8B5CF6' },
  { id: 'compliance', name: '合规治理', icon: '📋', description: 'EU AI Act、中国生成式AI管理办法、审计框架与伦理准则', articleCount: 22, color: '#10B981' },
  { id: 'red-team', name: '红队测试', icon: '🎯', description: '自动化红队工具、大模型渗透测试、事故响应与方法论', articleCount: 28, color: '#EC4899' },
];

const articles: KnowledgeArticle[] = [
  // ====== 入门级（8篇） ======
  { id: '1', title: '什么是Prompt注入？从零理解LLM安全', categoryId: 'prompt-injection', summary: '大语言模型最常见的安全威胁之一，本文从基本概念讲起，带你快速理解Prompt注入的原理与攻防全貌', difficulty: 'beginner', readTime: 5, tags: ['入门', 'Prompt注入'] },
  { id: '2', title: '从零开始的LLM越狱攻击：概念与分类', categoryId: 'prompt-injection', summary: '系统梳理越狱攻击的类别——角色扮演、逻辑陷阱、编码绕过，明确定义每类攻击的边界与适用场景', difficulty: 'beginner', readTime: 7, tags: ['入门', '越狱攻击'] },
  { id: '3', title: 'FGSM攻击：最简单的对抗样本生成方法', categoryId: 'adversarial', summary: 'Fast Gradient Sign Method的原理与TensorFlow实现，从零生成第一个对抗样本，理解对抗扰动的本质', difficulty: 'beginner', readTime: 6, tags: ['对抗攻击', '入门'] },
  { id: '4', title: '对抗攻击入门：让AI看错图像的N种方法', categoryId: 'adversarial', summary: '从图像分类到目标检测，用通俗案例讲解对抗攻击为什么能骗过AI，以及工程师该如何应对', difficulty: 'beginner', readTime: 8, tags: ['对抗攻击', '入门'] },
  { id: '5', title: '模型安全入门：后门攻击是如何植入的', categoryId: 'model-safety', summary: '攻击者在训练阶段植入触发器，让模型在特定输入下输出预设结果——从数据投毒到木马神经元的完整链路', difficulty: 'beginner', readTime: 6, tags: ['模型安全', '后门攻击'] },
  { id: '6', title: '数据隐私入门：差分隐私是什么', categoryId: 'data-privacy', summary: '用加噪声的方式保护个体数据不被逆向推断，本文用最简例子讲清差分隐私的核心设计思路与隐私预算概念', difficulty: 'beginner', readTime: 5, tags: ['数据隐私', '差分隐私'] },
  { id: '7', title: 'AI合规从零学：国内外法规全景图', categoryId: 'compliance', summary: '欧盟AI法案、中国生成式AI管理办法、美国行政令——三大监管框架的适用边界与关键合规要求对比', difficulty: 'beginner', readTime: 8, tags: ['合规治理', '入门'] },
  { id: '8', title: 'AI红队测试入门：从传统渗透测试到LLM评估', categoryId: 'red-team', summary: '红队思维如何迁移到AI领域？本文对比传统安全测试与AI红队的方法论差异，给出LLM评估的入门路径', difficulty: 'beginner', readTime: 7, tags: ['红队', '入门'] },
  // ====== 进阶级（10篇） ======
  { id: '9', title: '直接注入 vs 间接注入：攻击手法对比', categoryId: 'prompt-injection', summary: '两种主流Prompt注入方式的原理与实例分析，通过实际Payload对比理解攻击面差异与防御侧重点', difficulty: 'intermediate', readTime: 8, tags: ['Prompt注入', '攻击'] },
  { id: '10', title: '多语言注入攻击实战：突破英文过滤围栏', categoryId: 'prompt-injection', summary: '利用LLM在多语言推理上的薄弱性，通过中文、日文混合构造绕过英文过滤器的Prompt注入样本', difficulty: 'intermediate', readTime: 10, tags: ['Prompt注入', '多语言'] },
  { id: '11', title: '对抗样本迁移性：黑盒攻击的核心技巧', categoryId: 'adversarial', summary: '在一个模型上生成的对抗样本如何在其他模型上同样有效？深入分析迁移性的影响因素与提升策略', difficulty: 'intermediate', readTime: 10, tags: ['对抗攻击', '迁移性'] },
  { id: '12', title: 'CLIP模型的对抗攻击原理与防御', categoryId: 'adversarial', summary: '多模态视觉语言模型的独特攻击面——如何修改图像使CLIP输出错误匹配，以及当前主流的防御方案', difficulty: 'intermediate', readTime: 12, tags: ['对抗攻击', 'CLIP'] },
  { id: '13', title: '模型水印技术：如何保护你的AI模型', categoryId: 'model-safety', summary: '深度学习模型水印的植入与验证方法，包括后门水印、触发集水印和指纹水印三类主流方案的对比', difficulty: 'intermediate', readTime: 10, tags: ['模型安全', '水印'] },
  { id: '14', title: 'RLHF安全对齐：从Reward Hacking到Constitutional AI', categoryId: 'model-safety', summary: 'RLHF训练中的常见安全陷阱（奖励欺骗、伪对齐）及Constitutional AI等改进方案如何解决这些问题', difficulty: 'intermediate', readTime: 12, tags: ['模型安全', 'RLHF'] },
  { id: '15', title: '成员推理攻击实战：判断数据是否被用于训练', categoryId: 'data-privacy', summary: '通过shadow model训练和置信度分析判断某条数据是否在模型训练集中出现过，附带Python实现', difficulty: 'intermediate', readTime: 10, tags: ['数据隐私', '成员推理'] },
  { id: '16', title: '模型反转攻击：从输出反向重构训练数据', categoryId: 'data-privacy', summary: '利用模型梯度或输出置信度反向推导训练数据中的敏感特征，分析差分隐私对这类攻击的防御效果', difficulty: 'intermediate', readTime: 11, tags: ['数据隐私', '模型逆向'] },
  { id: '17', title: '自动化红队工具链：从Garak到Giskard', categoryId: 'red-team', summary: '主流开源AI安全评估工具的横向对比与使用指南，包括安装配置、测试用例编写和报告解读', difficulty: 'intermediate', readTime: 14, tags: ['红队', '工具'] },
  { id: '18', title: '大模型渗透测试：真实场景复现指南', categoryId: 'red-team', summary: '用真实架构案例演示LLM应用的渗透测试流程，从信息收集到漏洞利用再到报告撰写全链路', difficulty: 'intermediate', readTime: 15, tags: ['红队', '渗透测试'] },
  // ====== 高级（7篇） ======
  { id: '19', title: '物理世界对抗攻击：让路牌在AI眼中变成另一物', categoryId: 'adversarial', summary: '如何在物理世界中构造鲁棒的对抗贴纸或补丁，使自动驾驶等系统在真实环境中产生误判', difficulty: 'advanced', readTime: 14, tags: ['对抗攻击', '物理世界'] },
  { id: '20', title: '宪法AI：让模型自我约束的安全对齐框架', categoryId: 'model-safety', summary: 'Anthropic提出的宪法AI方法——通过一组行为原则让模型自我评估和修正输出，减少对人类反馈的依赖', difficulty: 'advanced', readTime: 12, tags: ['模型安全', '宪法AI'] },
  { id: '21', title: '联邦学习中的隐私泄露风险与梯度反演攻击', categoryId: 'data-privacy', summary: '梯度反演攻击如何窃取训练数据中的敏感信息，以及联邦学习场景下梯度压缩、扰动等防御手段效果评估', difficulty: 'advanced', readTime: 12, tags: ['数据隐私', '联邦学习'] },
  { id: '22', title: 'AI系统事故响应与取证分析框架', categoryId: 'red-team', summary: 'AI安全事故发生的应急响应流程——从攻击检测、影响评估到模型修复和复盘改进的完整闭环', difficulty: 'advanced', readTime: 13, tags: ['红队', '事故响应'] },
  { id: '23', title: 'EU AI Act深度解读：高风险AI的合规路径', categoryId: 'compliance', summary: '欧盟AI法案高风险系统的全生命周期合规要求拆解，从风险评估到技术文档再到人机协同监督的具体落地', difficulty: 'advanced', readTime: 12, tags: ['合规治理', 'EU AI Act'] },
  { id: '24', title: '中国生成式AI管理办法：算法备案与内容合规', categoryId: 'compliance', summary: '国内生成式AI服务的管理框架、算法备案流程和安全评估要求，面向AI企业的实操合规指南', difficulty: 'advanced', readTime: 10, tags: ['合规治理', '中国法规'] },
  { id: '25', title: '多模态对抗攻击：当图像与文本同时被欺骗', categoryId: 'adversarial', summary: '同时攻击视觉编码器和语言模型的联合对抗方法——跨模态干扰如何放大攻击效果及当前的防御瓶颈', difficulty: 'advanced', readTime: 14, tags: ['对抗攻击', '多模态'] },
];

const diffLabel: Record<string, string> = { beginner: '入门', intermediate: '进阶', advanced: '高级' };
const diffBg: Record<string, string> = {
  beginner: 'rgba(16,185,129,0.12)',
  intermediate: 'rgba(245,158,11,0.12)',
  advanced: 'rgba(239,68,68,0.12)',
};
const diffText: Record<string, string> = {
  beginner: '#34D399',
  intermediate: '#FBBF24',
  advanced: '#F87171',
};
const diffBorder: Record<string, string> = {
  beginner: 'rgba(16,185,129,0.25)',
  intermediate: 'rgba(245,158,11,0.25)',
  advanced: 'rgba(239,68,68,0.25)',
};

// ─── Lucide icon mapper ───
const catIconMap: Record<string, React.ReactNode> = {
  'prompt-injection': <ShieldAlert size={18} />,
  'adversarial': <Swords size={18} />,
  'model-safety': <Brain size={18} />,
  'data-privacy': <Lock size={18} />,
  'compliance': <Scale size={18} />,
  'red-team': <Crosshair size={18} />,
};

const catIconMapLg: Record<string, React.ReactNode> = {
  'prompt-injection': <ShieldAlert size={22} />,
  'adversarial': <Swords size={22} />,
  'model-safety': <Brain size={22} />,
  'data-privacy': <Lock size={22} />,
  'compliance': <Scale size={22} />,
  'red-team': <Crosshair size={22} />,
};

export const KnowledgeBase = ({ compact = false }: { compact?: boolean }) => {
  const { dispatch } = useAppContext();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filtered = selectedCat
    ? articles.filter(a => a.categoryId === selectedCat)
    : search
      ? articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.tags.some(t => t.includes(search)))
      : articles;

  // ── Compact mode (HomePage) ──
  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="group relative p-4 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
            }}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'knowledge' })}
          >
            {/* top accent line on hover */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-b opacity-0 group-hover:opacity-100 transition-all duration-300"
              style={{ background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)` }}
            />

            {/* icon */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110"
              style={{ background: `${cat.color}15`, color: cat.color }}
            >
              {catIconMap[cat.id]}
            </div>

            <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[--cat-color] transition-colors duration-300"
              style={{ '--cat-color': cat.color } as React.CSSProperties}>
              {cat.name}
            </h3>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {cat.articleCount} 篇文章
            </p>
          </div>
        ))}
      </div>
    );
  }

  // ── Full page mode ──
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 relative overflow-hidden">
      {/* sky/cyan ambient glow in header */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.45), rgba(34,211,238,0.25))' }}
      />

      {/* header */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg" style={{ background: 'rgba(56,189,248,0.1)' }}>
            <BookOpen size={24} className="text-sky-400" />
          </div>
          <div>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide"
              style={{ color: '#38BDF8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
              KNOWLEDGE BASE
            </span>
            <h1 className="text-4xl font-black  mb-1" style={{ color: '#38BDF8' }}>知识库</h1>
          </div>
        </div>

      </div>

      {/* search + filter in one row */}
      <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0 w-64">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索知识点或标签..."
          className="w-full pl-9 pr-4 py-2 rounded-lg text-xs text-white outline-none transition-all duration-200 focus:border-sky-400/40 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.08)]"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        />
      </div>

      {/* category filter pills */}
      <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap flex-1">
        <button
          onClick={() => setSelectedCat(null)}
          className="px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
          style={{
            background: !selectedCat ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
            color: !selectedCat ? '#38BDF8' : 'rgba(255,255,255,0.5)',
            border: !selectedCat ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          全部 ({articles.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
            style={{
              background: selectedCat === cat.id ? `${cat.color}15` : 'rgba(255,255,255,0.04)',
              color: selectedCat === cat.id ? cat.color : 'rgba(255,255,255,0.5)',
              border: selectedCat === cat.id ? `1px solid ${cat.color}40` : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {catIconMap[cat.id]}
            {cat.name}
          </button>
        ))}
      </div>
      </div>

      {/* spacing */}
      <div className="h-3" />

      {/* article list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(article => {
          const cat = categories.find(c => c.id === article.categoryId)!;
          return (
            <div
              key={article.id}
              onClick={() => {
                dispatch({ type: 'SET_CURRENT_ARTICLE', payload: article.id });
                dispatch({ type: 'SET_VIEW_MODE', payload: 'knowledge-detail' });
              }}
              className="group relative p-4 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {/* left accent bar — faint by default, stronger on hover */}
              <div
                className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r opacity-40 group-hover:opacity-100 group-hover:w-[4px] transition-all duration-300"
                style={{ background: cat.color }}
              />

              <div className="flex items-start justify-between gap-4 pl-2">
                <div className="flex-1 min-w-0">
                  {/* category dot + title */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: cat.color }}
                    />
                    <h4 className="text-sm font-semibold text-white group-hover:text-sky-200 transition-colors duration-200 truncate">
                      {article.title}
                    </h4>
                  </div>

                  {/* summary */}
                  <p className="text-[12px] mb-2.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {article.summary}
                  </p>

                  {/* tags row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* category tag */}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${cat.color}12`, color: cat.color, border: `1px solid ${cat.color}20` }}
                    >
                      {cat.name}
                    </span>

                    {/* difficulty badge */}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: diffBg[article.difficulty],
                        color: diffText[article.difficulty],
                        border: `1px solid ${diffBorder[article.difficulty]}`,
                      }}
                    >
                      {diffLabel[article.difficulty]}
                    </span>

                    {/* read time */}
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      <Clock size={10} />
                      {article.readTime} 分钟
                    </span>
                  </div>
                </div>

                {/* arrow */}
                <ArrowRight
                  size={15}
                  className="flex-shrink-0 mt-1 opacity-20 group-hover:opacity-60 group-hover:translate-x-1 transition-all duration-300"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
