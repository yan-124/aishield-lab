import { useState } from 'react';
import { ArrowLeft, Calendar, User, Tag, Share2, Bookmark, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { news } from '../data/news';

export const NewsDetail = ({ newsId }: { newsId: string }) => {
  const { dispatch } = useAppContext();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const item = news.find(n => n.id === newsId);
  const currentIndex = news.findIndex(n => n.id === newsId);
  const prevItem = currentIndex > 0 ? news[currentIndex - 1] : null;
  const nextItem = currentIndex < news.length - 1 ? news[currentIndex + 1] : null;

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#070B14' }}>
        <div className="text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </motion.div>
          <h2 className="text-xl font-bold text-white mt-4">新闻不存在</h2>
          <p className="text-sm text-slate-400 mt-2">抱歉，该新闻可能已被删除或不存在</p>
          <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })} className="mt-6 px-6 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.summary,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      }
    } catch {
      navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#070B14' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-between mb-8">
          <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft size={18} />
            <span>返回首页</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsBookmarked(!isBookmarked)} className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" style={{ color: isBookmarked ? '#FBBF24' : '#64748B' }}>
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={handleShare} className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" style={{ color: '#64748B' }}>
              <Share2 size={18} />
            </button>
          </div>
        </motion.div>

        {/* Category Badge */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Tag size={12} />
            {item.category}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-6">
          {item.title}
        </motion.h1>

        {/* Meta Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="flex flex-wrap items-center gap-4 mb-8 text-sm" style={{ color: 'rgba(148,163,184,0.6)' }}>
          <div className="flex items-center gap-1.5">
            <User size={14} />
            <span>{item.source}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>{item.timestamp}</span>
          </div>
        </motion.div>


        {/* Content */}
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="prose prose-invert max-w-none">
          <div className="text-base sm:text-lg leading-relaxed" style={{ color: 'rgba(203,213,225,0.85)' }}>
            <p className="mb-6">{item.summary}</p>
            <p className="mb-6">AI安全领域正在经历前所未有的快速发展，随着大语言模型和AI Agent技术的普及，新的安全威胁和攻击向量不断涌现。本平台致力于提供最新、最前沿的AI安全资讯，帮助安全从业者和技术爱好者及时了解行业动态。</p>
            <h3 className="text-xl font-bold text-white mt-8 mb-4">核心要点</h3>
            <ul className="list-disc list-inside space-y-2 mb-6" style={{ color: 'rgba(203,213,225,0.7)' }}>
              <li>AI安全威胁持续升级，攻击手法日趋复杂</li>
              <li>监管政策不断完善，合规要求日益严格</li>
              <li>安全工具和防护手段需要与时俱进</li>
              <li>AI安全人才需求持续增长</li>
            </ul>
            <p className="mb-6">建议读者结合我们的靶场实战平台进行学习，通过实际操作加深对AI安全概念的理解和掌握。</p>
          </div>
        </motion.article>

        {/* Source Link */}
        {item.url && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 }} className="mt-8 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
              <ExternalLink size={14} />
              <span>查看原文</span>
            </a>
          </motion.div>
        )}

        {/* Related News Navigation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.45 }} className="mt-12 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: 'rgba(148,163,184,0.5)' }}>相关新闻</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            {prevItem && (
              <button onClick={() => { dispatch({ type: 'SET_CURRENT_ARTICLE', payload: prevItem.id }); dispatch({ type: 'SET_VIEW_MODE', payload: 'news-detail' }); }} className="flex-1 text-left p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'rgba(148,163,184,0.4)' }}>
                  <ArrowLeft size={14} />
                  <span>上一篇</span>
                </div>
                <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors line-clamp-2">{prevItem.title}</p>
              </button>
            )}
            {nextItem && (
              <button onClick={() => { dispatch({ type: 'SET_CURRENT_ARTICLE', payload: nextItem.id }); dispatch({ type: 'SET_VIEW_MODE', payload: 'news-detail' }); }} className="flex-1 text-left p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 text-xs mb-2 justify-end" style={{ color: 'rgba(148,163,184,0.4)' }}>
                  <span>下一篇</span>
                  <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                </div>
                <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors line-clamp-2">{nextItem.title}</p>
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.9)', color: 'white' }}>
          <span className="text-sm font-medium">链接已复制到剪贴板</span>
        </motion.div>
      )}
    </div>
  );
};