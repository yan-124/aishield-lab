import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { KnowledgeCategory, KnowledgeArticle } from '../types';
import {
  BookOpen, Search, ArrowRight,
  ShieldAlert, Swords, Brain, Lock, Scale, Crosshair,
  Clock,
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { UpgradePrompt } from './UpgradePrompt';
import { categories, articles } from '../data/knowledge';

// 知识库分类与文章数据已迁移至 src/data/knowledge.ts，由安全工程师团队维护

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

export const KnowledgeBase = ({ compact = false }: { compact?: boolean }) => {
  const { dispatch } = useAppContext();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { canAccessFullKnowledge } = usePermissions();

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 relative overflow-hidden">
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
      <div className="flex items-center gap-2">
      <div className="relative flex-shrink-0 w-full sm:w-auto sm:max-w-xs sm:flex-1">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索知识点或标签..."
          className="w-full pl-7 pr-2.5 py-[5px] rounded-md text-xs text-white outline-none transition-all duration-200 focus:border-sky-400/40"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        />
      </div>

      {/* category filter pills — 更紧凑 */}
      <div className="flex gap-1 overflow-x-auto whitespace-nowrap flex-1">
        <button
          onClick={() => setSelectedCat(null)}
          className="px-1.5 py-[4px] rounded text-[9px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
          style={{
            background: !selectedCat ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
            color: !selectedCat ? '#38BDF8' : 'rgba(255,255,255,0.45)',
            border: !selectedCat ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          全部 ({articles.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className="flex items-center gap-0.5 px-1.5 py-[4px] rounded text-[9px] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap"
            style={{
              background: selectedCat === cat.id ? `${cat.color}15` : 'rgba(255,255,255,0.04)',
              color: selectedCat === cat.id ? cat.color : 'rgba(255,255,255,0.45)',
              border: selectedCat === cat.id ? `1px solid ${cat.color}40` : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {catIconMap[cat.id]}
            {cat.name}
          </button>
        ))}
      </div>
      </div>

      {/* minimal spacing */}
      <div className="h-1" />

      {/* article list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(article => {
          const cat = categories.find(c => c.id === article.categoryId)!;
          return (
            <div
              key={article.id}
              onClick={() => {
                if (!canAccessFullKnowledge) { setUpgradeOpen(true); return; }
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
                  <div className="flex items-center gap-2 mb-2">
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

                {/* 非会员预览标识 */}
                {!canAccessFullKnowledge && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-medium"
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.2)' }}>
                    预览
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <UpgradePrompt open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="knowledge" />
    </div>
  );
};
