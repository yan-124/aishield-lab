import { useState, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useAppContext } from '../context/AppContext';
import type { ArticleProgress } from '../types';
import { articles, buildArticleContent, categories } from '../data/knowledge';

const DIFF_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  beginner:     { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: '入门' },
  intermediate:  { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', label: '进阶' },
  advanced:     { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444', label: '高级' },
};

const CATEGORY_COLOR: Record<string, string> = {
  'prompt-injection': '#EF4444',
  'adversarial': '#F59E0B',
  'model-safety': '#3B82F6',
  'data-privacy': '#8B5CF6',
  'compliance': '#10B981',
  'red-team': '#EC4899',
};

// ─── 目录提取 ───────────────────────────────────────────
function extractToc(body: string): { id: string; text: string; level: number }[] {
  return (body.match(/^#{1,3}\s+(.+)$/gm) || []).map((line, i) => {
    const level = line.match(/^#+/)![0].length;
    const text = line.replace(/^#+\s+/, '');
    return { id: `toc-${i}`, text, level };
  });
}

// ─── Markdown 渲染（简化版）───────────────────────────────────────
function renderMarkdown(body: string): string {
  return body
    // 代码块
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_: string, lang: string, code: string) =>
      `<pre class="code-block" data-lang="${lang}"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
    )
    // 表格
    .replace(/\|(.+)\|\n\|[-| ]+\|\n([\s\S]*?)(?=\n\n|\n##|$)/g, (_: string, header: string, rows: string) => {
      const ths = header.split('|').filter(Boolean).map(h => `<th>${h.trim()}</th>`).join('');
      const trs = rows.split('\n').filter(r => r.trim()).map(row => {
        const tds = row.split('|').filter(Boolean).map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<div class="table-wrap"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
    })
    // 引用块
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // 标题
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // 粗体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // 水平线
    .replace(/^---$/gm, '<hr/>')
    // 列表项
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // 段落
    .replace(/^(?!<[a-z])(.+)$/gm, '<p>$1</p>');
}

export const KnowledgeDetail = ({ articleId }: { articleId?: string }) => {
  const { state, dispatch } = useAppContext();
  const [progress, setProgress] = useState<ArticleProgress>({ liked: false, favorited: false, readTime: 0, lastReadAt: '' });
  const [showToc, setShowToc] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const id = articleId || state.currentArticleId || 'a1';
  const articleMeta = articles.find(a => a.id === id);
  const article = articleMeta ? buildArticleContent(articleMeta) : null;

  // 找不到文章时的处理
  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-4">📖</div>
        <h2 className="text-xl font-bold text-white mb-2">文章不存在</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          该文章可能已被移除或链接有误
        </p>
        <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'knowledge' })}
          className="px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
          返回知识库
        </button>
      </div>
    );
  }

  const diff = DIFF_COLOR[article.difficulty];
  const catColor = CATEGORY_COLOR[article.categoryId] || '#10B981';
  const toc = extractToc(article.body);
  const html = DOMPurify.sanitize(renderMarkdown(article.body), {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'code', 'pre', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'hr', 'li', 'ul', 'ol', 'span', 'a'],
    ALLOWED_ATTR: ['class', 'data-lang', 'href', 'style'],
  });

  // 相关文章
  const relatedArticles = (article.related || [])
    .map(rid => articles.find(a => a.id === rid))
    .filter(Boolean);

  // 上下篇（按文章列表顺序）
  const currentIdx = articles.findIndex(a => a.id === id);
  const prevArticle = currentIdx > 0 ? articles[currentIdx - 1] : null;
  const nextArticle = currentIdx < articles.length - 1 ? articles[currentIdx + 1] : null;

  const toggleLike = () => setProgress(p => ({ ...p, liked: !p.liked }));
  const toggleFavorite = () => setProgress(p => ({ ...p, favorited: !p.favorited }));

  const categoryName = categories.find(c => c.id === article.categoryId)?.name || article.categoryId;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* ── 右侧目录（桌面端）─── */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="sticky top-20">
          <button onClick={() => setShowToc(!showToc)}
            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            目录 {showToc ? '▲' : '▼'}
          </button>
          {showToc && (
            <nav className="space-y-1">
              {toc.map(item => (
                <a key={item.id}
                  href={`#${item.id}`}
                  className="block text-xs py-1 transition-colors"
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    paddingLeft: `${(item.level - 1) * 12}px`,
                    borderLeft: item.level === 2 ? '2px solid rgba(16,185,129,0.2)' : 'none',
                  }}>
                  {item.text}
                </a>
              ))}
            </nav>
          )}

          {/* 文章元信息 */}
          <div className="mt-6 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: diff.bg, color: diff.text }}>
                {diff.label}
              </span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>· {article.readTime}分钟</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {article.tags.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 主内容区 ─── */}
      <div className="lg:col-span-3 space-y-6">
        {/* 返回按钮 */}
        <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'knowledge' })}
          className="text-xs cursor-pointer flex items-center gap-1"
          style={{ color: '#10B981' }}>
          ← 返回知识库
        </button>

        {/* 文章头部 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: `${catColor}15`, color: catColor }}>
              {categoryName}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: diff.bg, color: diff.text }}>
              {diff.label}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
            {article.title}
          </h1>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>{article.summary}</p>
          <div className="flex items-center gap-4 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>📖 {article.readTime} 分钟阅读</span>
            <span>🏷️ {article.tags.join(' / ')}</span>
          </div>
        </div>

        {/* 文章内容 */}
        <article
          ref={contentRef}
          className="prose prose-invert max-w-none"
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: '15px',
            lineHeight: '1.8',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button onClick={toggleLike}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
              style={{
                background: progress.liked ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
                color: progress.liked ? '#EF4444' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${progress.liked ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              {progress.liked ? '❤️ 已赞' : '🤍 点赞'}
            </button>
            <button onClick={toggleFavorite}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
              style={{
                background: progress.favorited ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                color: progress.favorited ? '#F59E0B' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${progress.favorited ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              {progress.favorited ? '⭐ 已收藏' : '☆ 收藏'}
            </button>
            <button onClick={() => navigator.clipboard?.writeText(window.location.href).catch(() => {})}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              🔗 分享
            </button>
          </div>
        </div>

        {/* 上下篇导航 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {prevArticle ? (
            <button onClick={() => {
              dispatch({ type: 'SET_CURRENT_ARTICLE', payload: prevArticle.id });
            }}
              className="p-4 rounded-xl text-left cursor-pointer transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>← 上一篇</div>
              <div className="text-sm font-medium text-white">{prevArticle.title}</div>
            </button>
          ) : <div />}
          {nextArticle ? (
            <button onClick={() => {
              dispatch({ type: 'SET_CURRENT_ARTICLE', payload: nextArticle.id });
            }}
              className="p-4 rounded-xl text-right cursor-pointer transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>下一篇 →</div>
              <div className="text-sm font-medium text-white">{nextArticle.title}</div>
            </button>
          ) : <div />}
        </div>

        {/* 相关文章 */}
        {relatedArticles.length > 0 && (
          <div className="pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-bold text-white mb-3">📚 相关文章</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {relatedArticles.map(ra => ra && (
                <button key={ra.id}
                  onClick={() => dispatch({ type: 'SET_CURRENT_ARTICLE', payload: ra.id })}
                  className="p-4 rounded-xl text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-sm font-medium text-white mb-1">{ra.title}</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {categories.find(c => c.id === ra.categoryId)?.name || ra.categoryId}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Markdown 渲染样式 ─── */}
      <style>{`
        .code-block {
          background: #0D1117;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 16px 20px;
          overflow-x: auto;
          margin: 16px 0;
          font-size: 13px;
          line-height: 1.6;
          color: #C9D1D9;
          position: relative;
        }
        .code-block::before {
          content: attr(data-lang);
          position: absolute;
          top: 8px;
          right: 12px;
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          text-transform: uppercase;
        }
        .inline-code {
          background: rgba(16,185,129,0.1);
          color: #10B981;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'Fira Code', 'Consolas', monospace;
        }
        .table-wrap {
          overflow-x: auto;
          margin: 16px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th {
          background: rgba(16,185,129,0.08);
          color: #10B981;
          padding: 8px 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        td {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6);
        }
        tr:hover td {
          background: rgba(255,255,255,0.02);
        }
        blockquote {
          border-left: 3px solid #F59E0B;
          background: rgba(245,158,11,0.06);
          padding: 12px 16px;
          margin: 16px 0;
          border-radius: 0 8px 8px 0;
          color: rgba(255,255,255,0.6);
          font-style: italic;
        }
        h1 { color: white; font-size: 1.6em; margin: 1.2em 0 0.6em; font-weight: 800; }
        h2 { color: white; font-size: 1.3em; margin: 1em 0 0.5em; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; }
        h3 { color: rgba(255,255,255,0.9); font-size: 1.05em; margin: 0.8em 0 0.4em; font-weight: 600; }
        hr { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 24px 0; }
        li { margin: 4px 0; padding-left: 4px; }
        p { margin: 8px 0; }
      `}</style>
    </div>
  );
};
