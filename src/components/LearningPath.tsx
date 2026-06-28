import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { LearningPathNode } from '../types';
import { pathNodes as PATH_NODES, categoryColors as CATEGORY_COLORS, layerLabels as LAYER_LABELS } from '../data/learningPath';

const DIFF_LABELS: Record<string, string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
};

const TYPE_ICONS: Record<string, string> = {
  article: '📖',
  range: '🎯',
  video: '🎬',
};

export const LearningPath = () => {
  const { dispatch } = useAppContext();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // 获取已完成节点
  const completedArticles = (() => {
    try {
      const a = localStorage.getItem('aishield-completed-articles');
      return a ? JSON.parse(a) as string[] : [];
    } catch { return []; }
  })();

  const completedLevels = (() => {
    try {
      const l = localStorage.getItem('aishield-completed-levels');
      return l ? JSON.parse(l) as string[] : [];
    } catch { return []; }
  })();

  const isNodeCompleted = (node: LearningPathNode): boolean => {
    if (node.type === 'article') return completedArticles.includes(node.targetId);
    if (node.type === 'range') return completedLevels.includes(node.targetId);
    return false;
  };

  const isNodeAvailable = (node: LearningPathNode): boolean => {
    if (node.prerequisiteIds.length === 0) return true;
    return node.prerequisiteIds.every(pid => {
      const pNode = PATH_NODES.find(n => n.id === pid);
      return pNode ? isNodeCompleted(pNode) : false;
    });
  };

  const completedCount = PATH_NODES.filter(n => isNodeCompleted(n)).length;
  const totalXp = PATH_NODES.filter(n => isNodeCompleted(n)).reduce((s, n) => s + n.xpReward, 0);
  const availableXp = PATH_NODES.reduce((s, n) => s + n.xpReward, 0);

  const handleNodeClick = (node: LearningPathNode) => {
    if (!isNodeAvailable(node)) return;
    if (node.type === 'article') {
      dispatch({ type: 'SET_CURRENT_ARTICLE', payload: node.targetId });
      dispatch({ type: 'SET_VIEW_MODE', payload: 'knowledge-detail' });
    } else if (node.type === 'range') {
      const level = {
        id: node.targetId,
        number: parseInt(node.targetId),
        name: node.title.replace('实战：', ''),
        attackType: node.category,
        difficulty: node.difficulty === 'beginner' ? 1 : node.difficulty === 'intermediate' ? 3 : 5,
        description: node.description,
      };
      dispatch({ type: 'SET_CURRENT_LEVEL', payload: level as any });
      dispatch({ type: 'SET_VIEW_MODE', payload: 'range-level' });
    }
  };

  // 按层排列（拓扑分层，动态处理所有节点）
  const layers: typeof PATH_NODES[] = [];
  const assigned = new Set<string>();
  while (assigned.size < PATH_NODES.length) {
    const layer = PATH_NODES.filter(n => {
      if (assigned.has(n.id)) return false;
      if (n.prerequisiteIds.length === 0) return true;
      return n.prerequisiteIds.every(pid => assigned.has(pid));
    });
    if (layer.length === 0) break; // 防止循环依赖导致死锁
    layer.forEach(n => assigned.add(n.id));
    layers.push(layer);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 relative overflow-hidden">
      {/* emerald/teal ambient glow in header */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.45), rgba(20,184,166,0.25))' }}
      />

      <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
        className="text-xs cursor-pointer flex items-center gap-1 relative" style={{ color: '#10B981' }}>
        ← 返回首页
      </button>

      <div className="relative">
        <h1 className="text-2xl font-black text-white mb-1">🗺️ 学习路径</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>循序渐进掌握 AI 安全核心技能</p>
      </div>

      {/* 总进度 */}
      <div className="p-5 rounded-2xl flex items-center gap-5"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: 'rgba(16,185,129,0.1)' }}>🏆</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">路径完成度</span>
            <span className="text-sm font-bold" style={{ color: '#10B981' }}>{completedCount}/{PATH_NODES.length}</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(completedCount / PATH_NODES.length) * 100}%`, background: 'linear-gradient(90deg, #10B981, #3B82F6)' }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>经验值 {totalXp}/{availableXp} XP</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {completedCount === PATH_NODES.length ? '🎉 全部完成！' : `还剩 ${PATH_NODES.length - completedCount} 步`}
            </span>
          </div>
        </div>
      </div>

      {/* 路径图 */}
      <div className="space-y-6">
        {layers.map((layer, li) => (
          <div key={li}>
            <div className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>{li + 1}</span>
              {LAYER_LABELS[li] || `第${li + 1}层`}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {layer.map(node => {
                const completed = isNodeCompleted(node);
                const available = isNodeAvailable(node);
                const color = CATEGORY_COLORS[node.category] || '#64748B';
                const selected = selectedNode === node.id;

                return (
                  <div key={node.id}
                    onClick={() => {
                      setSelectedNode(selected ? null : node.id);
                      if (available && !completed) handleNodeClick(node);
                    }}
                    className={`p-4 rounded-2xl transition-all duration-200 ${available ? 'cursor-pointer hover:-translate-y-0.5' : 'opacity-40 cursor-not-allowed'}`}
                    style={{
                      background: completed ? 'rgba(16,185,129,0.06)' : selected ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${completed ? 'rgba(16,185,129,0.2)' : selected ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: `${color}15`, color }}>
                        {completed ? '✅' : TYPE_ICONS[node.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white truncate">{node.title}</span>
                          {completed && <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>已完</span>}
                        </div>
                        <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{node.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                            style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>
                            {node.category}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)' }}>
                            {DIFF_LABELS[node.difficulty]}
                          </span>
                          <span className="text-[10px] ml-auto" style={{ color: '#F59E0B' }}>+{node.xpReward} XP</span>
                        </div>
                      </div>
                    </div>
                    {!available && !completed && (
                      <div className="mt-2 text-[10px] pl-13" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        🔒 需先完成：{node.prerequisiteIds.map(pid => PATH_NODES.find(n => n.id === pid)?.title).filter(Boolean).join('、')}
                      </div>
                    )}
                    {available && !completed && (
                      <div className="mt-2 text-[10px] pl-13" style={{ color: '#10B981' }}>
                        ▶ 点击开始学习
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
