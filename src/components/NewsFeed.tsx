import { ExternalLink, RefreshCw } from 'lucide-react';
import type { NewsItem } from '../types';
import { useAppContext } from '../context/AppContext';
import { news, NEWS_DATA_LAST_UPDATED } from '../data/news';

const catColors: Record<string, string> = {
  '模型安全': '#3B82F6',
  '行业动态': '#10B981',
  '合规治理': '#8B5CF6',
  '威胁情报': '#EF4444',
};

const NewsCard = ({ item }: { item: NewsItem }) => (
  <div className="p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
        style={{ background: `${catColors[item.category] || '#10B981'}15`, color: catColors[item.category] || '#10B981' }}>
        {item.category}
      </span>
      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{item.timestamp}</span>
    </div>
    <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
    <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.summary}</p>
    <div className="flex items-center justify-between">
      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>来源: {item.source}</span>
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors"
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
          原文
        </a>
      )}
    </div>
  </div>
);

export const NewsFeed = ({ compact = false }: { compact?: boolean }) => {
  const { dispatch } = useAppContext();

  const content = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {(compact ? news.slice(0, 4) : news).map(item => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );

  if (compact) {
    return (
      <div>
        <div className="flex items-center justify-end mb-6">
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
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-black text-white">📰 AI安全新闻</h1>
          <span className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
            <RefreshCw className="w-3 h-3" />
            数据更新于 {NEWS_DATA_LAST_UPDATED}
          </span>
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          真实AI安全资讯 · 来自安全媒体与官方公告 · 共{news.length}条
        </p>
      </div>
      {content}
    </div>
  );
};
