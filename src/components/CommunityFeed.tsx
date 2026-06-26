import { useState } from 'react'
import type { CommunityPost } from '../types';
import { useAppContext } from '../context/AppContext';
import { X, Send, Heart, MessageCircle, Tag } from 'lucide-react'

const SEED_POSTS: CommunityPost[] = [
  { id: '1', author: '小白学安全', avatar: '🎓', content: '今天成功通关了靶场第3关"背景伪装"！关键是要先建立信任关系再逐步引导，和真实的社会工程学攻击思路很像。大家加油！', timestamp: '2小时前', likes: 24, comments: 8, tags: ['靶场通关', 'Prompt注入'] },
  { id: '2', author: 'AI安全研究者', avatar: '🔬', content: '分享一个有趣的发现：最新版本的GPT-4在处理多语言混合的Prompt注入时，防御效果明显弱于纯英文输入。这可能和训练数据分布有关。', timestamp: '5小时前', likes: 56, comments: 15, tags: ['研究', '发现'] },
  { id: '3', author: '转行日记', avatar: '🔄', content: '从传统网络安全转AI安全两个月了，最大的感触是：传统安全的很多思路在AI领域仍然适用，但技术细节完全不同。推荐大家从Prompt注入开始入门，门槛相对低。', timestamp: '1天前', likes: 89, comments: 23, tags: ['职业发展', '经验分享'] },
  { id: '5', author: '资源猎人', avatar: '📦', content: '挖到一个宝藏GitHub仓库：Awesome LLM Security，整理了100+篇AI安全论文和开源工具的链接。附上地址，大家自己去探索 👉', timestamp: '3天前', likes: 132, comments: 19, tags: ['资源', '论文', '工具'] },
  { id: '4', author: '在读研究生', avatar: '📚', content: '请问有人研究过联邦学习中的梯度反演攻击吗？最近在写相关论文，想找一些好的防御方法参考。', timestamp: '2天前', likes: 12, comments: 6, tags: ['学术', '求助'] },
  { id: '6', author: '刚入行的小明', avatar: '🐣', content: '刚开始学AI安全，想问一下对抗攻击和Prompt注入哪个更值得先学？感觉两个方向都好深，有没有过来人给个学习路线的建议？', timestamp: '4天前', likes: 31, comments: 22, tags: ['求助', '学习路线'] },
  { id: '7', author: 'Offer收割机', avatar: '💼', content: '刚收到某大厂AI安全岗的offer，分享下面试经验：技术面问了Prompt注入分类、对抗训练原理、差分隐私算法推导。项目经验比八股文重要。', timestamp: '5天前', likes: 78, comments: 34, tags: ['求职', '面试'] },
  { id: '8', author: 'HR小助手', avatar: '📋', content: '我们团队正在招AI红队测试工程师！远程办公弹性工作制，要求有安全测试经验和大模型基础。感兴趣的私聊～', timestamp: '6天前', likes: 45, comments: 12, tags: ['招聘', '红队'] },
  { id: '9', author: '竞赛公告', avatar: '🏆', content: '本周末将举办第三届"AI安全挑战赛"线上预选赛！赛题涵盖Prompt注入、对抗攻击和模型安全三大方向，冠军奖金3万元，欢迎大家组队报名！', timestamp: '1周前', likes: 210, comments: 56, tags: ['竞赛', 'CTF'] },
  { id: '10', author: '红队老炮', avatar: '🎯', content: '花了一周时间把Garak红队框架跑通了，用它给公司内部LLM做了全量安全评估，发现了7个高危漏洞。自动化红队工具真的能大幅提升效率。', timestamp: '1周前', likes: 67, comments: 28, tags: ['红队', '工具', '经验分享'] },
];

const SUGGESTED_TAGS = ['Prompt注入', '靶场通关', '经验分享', '求助', '资源', '求职', '红队', '研究']

interface Comment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
}

function getStoredPosts(): CommunityPost[] {
  try {
    const stored = localStorage.getItem('aishield_community_posts')
    if (stored) return JSON.parse(stored)
  } catch {}
  return SEED_POSTS
}

function savePosts(posts: CommunityPost[]) {
  localStorage.setItem('aishield_community_posts', JSON.stringify(posts))
}

function getStoredLikes(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem('aishield_community_likes')
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

function saveLikes(likes: Record<string, boolean>) {
  localStorage.setItem('aishield_community_likes', JSON.stringify(likes))
}

function getStoredComments(): Record<string, Comment[]> {
  try {
    const stored = localStorage.getItem('aishield_community_comments')
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

function saveComments(comments: Record<string, Comment[]>) {
  localStorage.setItem('aishield_community_comments', JSON.stringify(comments))
}

export const CommunityFeed = ({ compact = false }: { compact?: boolean }) => {
  const { dispatch, state } = useAppContext();
  const [posts, setPosts] = useState<CommunityPost[]>(getStoredPosts)
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>(getStoredLikes)
  const [allComments, setAllComments] = useState<Record<string, Comment[]>>(getStoredComments)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [expandedComments, setExpandedComments] = useState<string | null>(null)
  const [commentInput, setCommentInput] = useState('')

  const toggleLike = (postId: string) => {
    const isLiked = likedPosts[postId]
    const newLiked = { ...likedPosts, [postId]: !isLiked }
    setLikedPosts(newLiked)
    saveLikes(newLiked)
    setPosts(prev => {
      const updated = prev.map(p =>
        p.id === postId ? { ...p, likes: p.likes + (isLiked ? -1 : 1) } : p
      )
      savePosts(updated)
      return updated
    })
  }

  const handlePost = () => {
    if (!newContent.trim()) return
    if (!state.user) {
      dispatch({ type: 'SHOW_REGISTER' })
      setShowNewPost(false)
      return
    }
    const newPost: CommunityPost = {
      id: `user_${Date.now()}`,
      author: state.user.nickname,
      avatar: state.user.nickname[0],
      content: newContent.trim(),
      timestamp: '刚刚',
      likes: 0,
      comments: 0,
      tags: newTags.length > 0 ? newTags : undefined,
    }
    const updated = [newPost, ...posts]
    setPosts(updated)
    savePosts(updated)
    setNewContent('')
    setNewTags([])
    setCustomTag('')
    setShowNewPost(false)
  }

  const toggleTag = (tag: string) => {
    setNewTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const addCustomTag = () => {
    const t = customTag.trim()
    if (t && !newTags.includes(t)) {
      setNewTags(prev => [...prev, t])
      setCustomTag('')
    }
  }

  const handleComment = (postId: string) => {
    if (!commentInput.trim()) return
    if (!state.user) {
      dispatch({ type: 'SHOW_REGISTER' })
      return
    }
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      author: state.user.nickname,
      avatar: state.user.nickname[0],
      content: commentInput.trim(),
      timestamp: '刚刚',
    }
    const updatedComments = {
      ...allComments,
      [postId]: [...(allComments[postId] || []), newComment],
    }
    setAllComments(updatedComments)
    saveComments(updatedComments)
    setPosts(prev => {
      const updated = prev.map(p =>
        p.id === postId ? { ...p, comments: p.comments + 1 } : p
      )
      savePosts(updated)
      return updated
    })
    setCommentInput('')
  }

  const getCommentCount = (postId: string) => {
    return (allComments[postId]?.length || 0)
  }

  const content = (
    <div className="space-y-4">
      {(compact ? posts.slice(0, 4) : posts).map(post => {
        const isLiked = likedPosts[post.id]
        const postComments = allComments[post.id] || []
        const showComments = expandedComments === post.id

        return (
          <div key={post.id} className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start sm:items-center gap-3 mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg flex-shrink-0 font-bold"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>{post.avatar}</div>
                <div>
                  <div className="text-sm font-semibold text-white">{post.author}</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{post.timestamp}</div>
                </div>
              </div>

              {/* Content */}
              <p className="text-sm mb-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{post.content}</p>

              {/* Tags + Actions */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {post.tags?.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>#{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleLike(post.id)}
                    className="text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    style={{ color: isLiked ? '#F472B6' : 'rgba(255,255,255,0.3)' }}>
                    <Heart size={13} fill={isLiked ? '#F472B6' : 'none'} strokeWidth={isLiked ? 0 : 1.5} />
                    {post.likes}
                  </button>
                  <button onClick={() => setExpandedComments(showComments ? null : post.id)}
                    className="text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    style={{ color: showComments ? '#60A5FA' : 'rgba(255,255,255,0.3)' }}>
                    <MessageCircle size={13} strokeWidth={1.5} />
                    {post.comments + getCommentCount(post.id)}
                  </button>
                </div>
              </div>
            </div>

            {/* Comments section */}
            {showComments && (
              <div className="px-5 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {/* Existing comments */}
                {postComments.length > 0 && (
                  <div className="pt-3 space-y-2.5">
                    {postComments.map(c => (
                      <div key={c.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA' }}>{c.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-white">{c.author}</span>
                            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{c.timestamp}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment input */}
                <div className="flex items-center gap-2 mt-3">
                  <input
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleComment(post.id) }}
                    placeholder={state.user ? '写评论...' : '登录后评论'}
                    className="flex-1 px-3 py-2 rounded-lg text-xs outline-none transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}
                    disabled={!state.user}
                  />
                  <button onClick={() => handleComment(post.id)}
                    className="p-2 rounded-lg cursor-pointer transition-colors"
                    style={{ background: 'rgba(16,185,129,0.12)', color: commentInput.trim() ? '#10B981' : 'rgba(16,185,129,0.3)' }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  );

  if (compact) {
    return (
      <div>
        <div className="flex items-center justify-end mb-6">
          <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'community' })}
            className="text-xs cursor-pointer" style={{ color: '#10B981' }}>查看全部 →</button>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-8 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.45), rgba(139,92,246,0.25))' }} />

      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg" style={{ background: 'rgba(251,113,133,0.1)' }}>
            <MessageCircle size={24} className="text-rose-400" />
          </div>
          <div>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide"
              style={{ color: '#FB7185', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.2)' }}>
              COMMUNITY
            </span>
            <h1 className="text-4xl font-black  mb-1" style={{ color: '#FB7185' }}>社区动态</h1>
          </div>
        </div>
        <button onClick={() => {
          if (!state.user) { dispatch({ type: 'SHOW_REGISTER' }); return }
          setShowNewPost(true)
        }}
          className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
          ✏️ 发布动态
        </button>
      </div>

      {content}

      {/* New post modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewPost(false) }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0F1729 0%, #0C1027 100%)', border: '1px solid rgba(139,92,246,0.18)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-base font-bold text-white">发布动态</h3>
              <button onClick={() => setShowNewPost(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/5"
                style={{ color: '#64748B' }}>
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="分享你的学习心得、发现或提问..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', minHeight: '120px' }}
              />

              {/* Tags */}
              <div>
                <div className="text-[11px] font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>标签（可选）</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SUGGESTED_TAGS.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className="text-[10px] px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                      style={{
                        background: newTags.includes(tag) ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                        color: newTags.includes(tag) ? '#60A5FA' : 'rgba(255,255,255,0.35)',
                        border: `1px solid ${newTags.includes(tag) ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      }}>
                      {tag}
                    </button>
                  ))}
                </div>
                {/* Custom tag */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <input
                      value={customTag}
                      onChange={e => setCustomTag(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addCustomTag() }}
                      placeholder="自定义标签"
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg text-[11px] outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}
                    />
                  </div>
                  <button onClick={addCustomTag}
                    className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                    添加
                  </button>
                </div>
                {newTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newTags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>
                        #{tag}
                        <button onClick={() => toggleTag(tag)} className="cursor-pointer hover:text-white">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setShowNewPost(false)}
                className="px-4 py-2 rounded-xl text-xs cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                取消
              </button>
              <button onClick={handlePost}
                className="px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                style={{
                  background: newContent.trim() ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(16,185,129,0.15)',
                  color: newContent.trim() ? 'white' : 'rgba(16,185,129,0.4)',
                  boxShadow: newContent.trim() ? '0 4px 16px rgba(16,185,129,0.3)' : 'none',
                }}>
                发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
