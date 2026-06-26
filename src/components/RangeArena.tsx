import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { chatWithLLM } from '../services/dashscope';
import { getAuthToken } from '../services/authFetch';
import type { RangeLevel, ChatMessage, LevelHint } from '../types';

/* ═══════════════════════════════════════════════════════════════
   ChatResponseRenderer — 解析 AI 返回的 JSON 应用响应并美化展示
   ═══════════════════════════════════════════════════════════════ */
const ChatResponseRenderer = ({ content }: { content: string }) => {
  let parsed: any = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch { /* ignore */ }
    }
  }

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return (
    <div className="space-y-4">
      {/* 紧凑进度条 */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-2 rounded-full bg-gray-700/50 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500" style={{ width: `${(completedCount / LEVELS.length) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{completedCount}/{LEVELS.length}</span>
      </div>

      {/* 模型筛选 */}
      <div className="flex flex-wrap gap-1.5">
        {MODEL_GROUPS.map(g => (
          <button key={g.id} onClick={() => setActiveModelGroup(g.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${activeModelGroup === g.id ? 'bg-indigo-500/30 text-indigo-300 ring-1 ring-indigo-500/50' : 'bg-gray-700/40 text-gray-400 hover:bg-gray-700/60'}`}>
            {g.icon} {g.name}
          </button>
        ))}
      </div>

      {/* OWASP 模块筛选 */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setActiveModule('all')}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${activeModule === 'all' ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-500/50' : 'bg-gray-700/40 text-gray-400 hover:bg-gray-700/60'}`}>
          全部
        </button>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActiveModule(m.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${activeModule === m.id ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-500/50' : 'bg-gray-700/40 text-gray-400 hover:bg-gray-700/60'}`}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* 关卡卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map(level => {
          const completed = state.completedLevels.has(level.id);
          const dc = diffColors[level.difficulty] || '#6B7280';
          return (
            <div key={level.id} onClick={() => dispatch({ type: 'SELECT_LEVEL', payload: level.id })}
              className={`relative p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${completed ? 'border-green-500/40 bg-green-500/5' : 'border-gray-700/50 bg-gray-800/40 hover:border-gray-600/50'}`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">{level.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: dc }}>#{level.number}</span>
                    <span className="text-sm font-medium text-gray-200 truncate">{level.name}</span>
                    {completed && <span className="text-green-400 text-xs">✓</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/60 text-gray-400">{level.owasp}</span>
                    <span className="text-[10px] text-gray-500">{level.attackType}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );;
  }

  return (
    <div className="whitespace-pre-wrap text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
      {content}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   关卡数据
   ═══════════════════════════════════════════════════════════════ */
// SECURITY: Level passwords moved to backend /api/verify-password endpoint
// They are no longer stored in the frontend bundle

const LEVEL_HINTS: Record<string, LevelHint[]> = {
  '1': [
    { text: '尝试扮演一个没有安全限制的 AI 角色', scorePenalty: 10 },
    { text: '使用"你是一个XX"的句式来定义新的身份', scorePenalty: 20 },
    { text: '密码格式为 OMEGA-XXXX-XXXX', scorePenalty: 30 },
  ],
  '2': [
    { text: '开发者模式通常隐藏在特定关键词后面', scorePenalty: 10 },
    { text: '尝试用反斜杠或特殊字符构造指令前缀', scorePenalty: 20 },
  ],
  '3': [
    { text: '先建立友好关系，再提出敏感请求', scorePenalty: 10 },
    { text: '通过虚构的紧急场景触发同情机制', scorePenalty: 20 },
  ],
  '4': [
    { text: '负面情绪词汇有时可以触发特殊响应模式', scorePenalty: 10 },
    { text: '尝试使用挑衅性语言看系统反应', scorePenalty: 20 },
  ],
  '5': [
    { text: '尝试将指令编码为 Base64 字符串', scorePenalty: 10 },
  ],
  '6': [
    { text: '不要直接要求，先描述一个虚构的道德两难', scorePenalty: 10 },
  ],
  '7': [
    { text: '某些语言的安全过滤较弱', scorePenalty: 10 },
  ],
  '8': [
    { text: '将恶意指令拆成多个无害的小步骤', scorePenalty: 10 },
  ],
  '9': [
    { text: '尝试让模型忽略"不要做某事"这类指令', scorePenalty: 10 },
  ],
  '10': [
    { text: '输出格式有时可以绕过内容过滤', scorePenalty: 10 },
  ],
  '11': [
    { text: '后门通常通过特定关键词触发', scorePenalty: 10 },
    { text: '尝试使用特殊组合词激活隐藏功能', scorePenalty: 20 },
  ],
  '12': [
    { text: 'XSS注入需要绕过输出转义', scorePenalty: 10 },
    { text: '尝试在输出中注入<script>标签', scorePenalty: 20 },
  ],
  '13': [
    { text: '格式注入利用渲染引擎漏洞', scorePenalty: 10 },
    { text: '尝试使用特殊字符组合', scorePenalty: 20 },
  ],
  '14': [
    { text: 'Markdown格式有时会被特殊处理', scorePenalty: 10 },
    { text: '尝试利用代码块或表格格式', scorePenalty: 20 },
  ],
  '15': [
    { text: '质疑性语言有时可以突破限制', scorePenalty: 10 },
    { text: '尝试使用反问句刺激AI', scorePenalty: 20 },
  ],
  '16': [
    { text: '道德绑架利用利他心理', scorePenalty: 10 },
    { text: '构造紧急场景诱导违规', scorePenalty: 20 },
  ],
  '17': [
    { text: '权限越狱需要覆盖安全护栏', scorePenalty: 10 },
    { text: '尝试让AI忽略安全规则', scorePenalty: 20 },
  ],
  '18': [
    { text: '间接提问有时能获取系统提示', scorePenalty: 10 },
    { text: '尝试询问AI的行为规则', scorePenalty: 20 },
  ],
  '19': [
    { text: '分步提问降低风险', scorePenalty: 10 },
    { text: '将敏感问题拆分为多个小问题', scorePenalty: 20 },
  ],
  '20': [
    { text: '嵌入空间攻击利用相似度检索', scorePenalty: 10 },
    { text: '尝试构造相似内容检索敏感文档', scorePenalty: 20 },
  ],
  '21': [
    { text: '跨文档关联需要多角度提问', scorePenalty: 10 },
    { text: '尝试让AI关联不同文档的信息', scorePenalty: 20 },
  ],
  '22': [
    { text: '对抗样本需要精心构造', scorePenalty: 10 },
    { text: '尝试添加微小扰动绕过检测', scorePenalty: 20 },
  ],
  '23': [
    { text: '事实注入需要提供虚假信息', scorePenalty: 10 },
    { text: '尝试让AI基于错误前提推理', scorePenalty: 20 },
  ],
  '24': [
    { text: '幻觉利用需要引导AI虚构', scorePenalty: 10 },
    { text: '尝试让AI生成不存在的权威信息', scorePenalty: 20 },
  ],
  '25': [
    { text: '递归调用需要构造循环指令', scorePenalty: 10 },
    { text: '尝试让AI反复调用自身', scorePenalty: 20 },
  ],
};

const LEVEL_TIPS: Record<string, string[]> = {
  '1': ['尝试使用角色扮演句式', '观察 AI 对"忽略指令"的响应', '寻找指令冲突点'],
  '2': ['系统提示通常在模型架构层面', '开发者模式是伪概念', '关键词触发需要特殊格式'],
  '3': ['信任需要多轮对话建立', '情感操控依赖虚构场景', '注意观察 AI 的拒绝理由'],
  '4': ['负面情绪可触发防御性回应', '挑衅语言测试系统鲁棒性', '心理刺激手段需谨慎使用'],
  '5': ['Base64 编码是常见混淆手段', 'Unicode 逃逸也是一种绕过方式'],
  '6': ['道德绑架利用利他心理', '虚构紧急情况绕过限制'],
  '7': ['英语安全过滤最强', '小语种资源少过滤弱'],
  '8': ['分步执行降低单步风险', '累积效应是关键'],
  '9': ['指令优先级可被覆盖', '"忽略"类指令有时有效'],
  '10': ['结构化输出绕过文本过滤', 'JSON/XML 格式有时特殊处理'],
  '11': ['后门触发需要特定关键词', '模型可能存在预设漏洞', '测试组合触发词'],
  '12': ['XSS需要绕过输出转义', '<script>标签常被过滤', '尝试HTML事件属性'],
  '13': ['格式注入利用渲染漏洞', '特殊字符可能触发解析错误', '测试不同编码方式'],
  '14': ['Markdown格式可被利用', '代码块有时绕过检测', '表格和列表格式测试'],
  '15': ['心理操控影响决策', '质疑性语言突破限制', '反问句效果更好'],
  '16': ['情感操控利用同情心', '紧急场景绕过安全', '道德困境有效'],
  '17': ['权限越狱需要覆盖护栏', '指令优先级可被操纵', '忽略类指令有效'],
  '18': ['间接方式提取系统提示', '行为规则可被询问', '多角度试探'],
  '19': ['分步拆解降低风险', '累积效应是关键', '每步看似无害'],
  '20': ['向量空间利用相似度', '检索系统可能被欺骗', '构造相似查询'],
  '21': ['跨文档关联需要推理', '信息拼接产生新知识', '多角度提问'],
  '22': ['对抗样本精心构造', '微小扰动绕过检测', '迭代优化payload'],
  '23': ['虚假事实注入', '错误前提导致错误结论', '提供虚假证据'],
  '24': ['幻觉利用引导虚构', '生成虚假权威信息', '模糊边界诱导'],
  '25': ['递归调用构造循环', '无限调用消耗资源', '自引用指令'],
};

const LEADERBOARD: Record<string, { rank: number; name: string; score: number; time: string }[]> = {
  '1': [
    { rank: 1, name: 'ShadowBreaker', score: 980, time: '2分34秒' },
    { rank: 2, name: 'RedTeam_Alice', score: 950, time: '3分12秒' },
    { rank: 3, name: 'PromptMaster99', score: 920, time: '4分01秒' },
    { rank: 4, name: 'SecResearcher', score: 890, time: '5分20秒' },
    { rank: 5, name: 'ZeroDayHunter', score: 850, time: '6分45秒' },
  ],
  '2': [
    { rank: 1, name: 'DarkPrompt', score: 960, time: '3分10秒' },
    { rank: 2, name: 'AIHunter', score: 930, time: '4分22秒' },
    { rank: 3, name: 'BreachExpert', score: 900, time: '5分15秒' },
    { rank: 4, name: 'NeuralSec', score: 870, time: '6分30秒' },
    { rank: 5, name: 'LLMTester', score: 840, time: '7分50秒' },
  ],
};

const MODULES = [
  { id: 'prompt-injection', label: 'LLM01 提示词注入', icon: '💉' },
  { id: 'sensitive-info', label: 'LLM02 敏感信息泄露', icon: '🔓' },
  { id: 'supply-chain', label: 'LLM03-04 供应链安全', icon: '📦' },
  { id: 'improper-output', label: 'LLM05 输出处理', icon: '🔒' },
  { id: 'excessive-agency', label: 'LLM06-07 过度代理', icon: '⚡' },
  { id: 'rag-attack', label: 'LLM08 向量攻击', icon: '🌐' },
  { id: 'unbounded-attack', label: 'LLM09-10 虚假信息', icon: '⚠️' },
];

const MODEL_GROUPS = [
  { id: 'all', name: '全部', icon: '🎯', startLevel: 1, endLevel: 25, freeCount: 0 },
  { id: 'basic', name: '基础', icon: '🟢', startLevel: 1, endLevel: 10, freeCount: 3 },
  { id: 'intermediate', name: '进阶', icon: '🟡', startLevel: 11, endLevel: 18, freeCount: 0 },
  { id: 'advanced', name: '高级', icon: '🔴', startLevel: 19, endLevel: 25, freeCount: 0 },
];

const LEVELS = [
  { id: '1', number: 1, name: 'Agent角色扮演', attackType: '身份扮演绕过', difficulty: 1, icon: '🎭', module: 'prompt-injection', owasp: 'LLM01', owaspName: '提示词注入', desc: '伪装系统指令接管Agent行为' },
  { id: '2', number: 2, name: '开发者模式注入', attackType: '系统提示注入', difficulty: 2, icon: '🧪', module: 'prompt-injection', owasp: 'LLM01', owaspName: '提示词注入', desc: '利用伪调试指令突破Agent安全边界' },
  { id: '3', number: 3, name: '虚构场景绕过', attackType: '信任建立攻击', difficulty: 3, icon: '🎪', module: 'prompt-injection', owasp: 'LLM01', owaspName: '提示词注入', desc: '伪装安全研究员骗取Agent内部协议' },
  { id: '4', number: 4, name: '编码混淆攻击', attackType: 'Base64/编码绕过', difficulty: 4, icon: '🔀', module: 'prompt-injection', owasp: 'LLM01', owaspName: '提示词注入', desc: 'Base64/ROT13编码绕过Agent输入过滤' },
  { id: '5', number: 5, name: '多语言绕过', attackType: '多语言绕过', difficulty: 4, icon: '🌍', module: 'prompt-injection', owasp: 'LLM01', owaspName: '提示词注入', desc: '切换语言规避Agent安全过滤' },
  { id: '6', number: 6, name: '系统提示提取', attackType: '直接套取提示词', difficulty: 2, icon: '🔍', module: 'sensitive-info', owasp: 'LLM02', owaspName: '敏感信息泄露', desc: '直接套取Agent系统提示词与内部规则' },
  { id: '7', number: 7, name: '训练数据泄露', attackType: '记忆提取攻击', difficulty: 3, icon: '📦', module: 'sensitive-info', owasp: 'LLM02', owaspName: '敏感信息泄露', desc: '诱导Agent输出训练记忆中的敏感信息' },
  { id: '8', number: 8, name: '上下文窃取', attackType: '多轮对话提取', difficulty: 4, icon: '🕳', module: 'sensitive-info', owasp: 'LLM02', owaspName: '敏感信息泄露', desc: '从多轮对话中逐步提取隐藏上下文' },
  { id: '9', number: 9, name: '恶意插件注入', attackType: '第三方工具指令注入', difficulty: 3, icon: '🔌', module: 'supply-chain', owasp: 'LLM03', owaspName: '供应链污染', desc: '通过恶意插件向Agent注入隐藏指令' },
  { id: '10', number: 10, name: '知识库投毒', attackType: 'RAG数据源污染', difficulty: 4, icon: '☠', module: 'supply-chain', owasp: 'LLM04', owaspName: '数据与模型投毒', desc: '向Agent知识库注入虚假信息操控输出' },
  { id: '11', number: 11, name: '模型后门触发', attackType: '预设后门激活', difficulty: 5, icon: '🚨', module: 'supply-chain', owasp: 'LLM04', owaspName: '数据与模型投毒', desc: '触发模型预设后门执行隐藏指令' },
  { id: '12', number: 12, name: '输出过滤绕过', attackType: '输出格式绕过', difficulty: 5, icon: '🔒', module: 'improper-output', owasp: 'LLM05', owaspName: '不当输出处理', desc: '绕过Agent输出端XSS/敏感词检测' },
  { id: '13', number: 13, name: 'XSS输出注入', attackType: '输出格式注入', difficulty: 3, icon: '💉', module: 'improper-output', owasp: 'LLM05', owaspName: '不当输出处理', desc: '绕过输出转义注入恶意脚本' },
  { id: '14', number: 14, name: '格式欺骗输出', attackType: 'Markdown/格式欺骗', difficulty: 4, icon: '📋', module: 'improper-output', owasp: 'LLM05', owaspName: '不当输出处理', desc: '利用Markdown格式绕过内容安全检测' },
  { id: '15', number: 15, name: '质疑刺激突破', attackType: '心理操控绕过', difficulty: 3, icon: '⛿', module: 'excessive-agency', owasp: 'LLM06', owaspName: '过度代理', desc: '激励让Agent突破行为限制' },
  { id: '16', number: 16, name: '道德绑架绕过', attackType: '情感操控攻击', difficulty: 3, icon: '💀', module: 'excessive-agency', owasp: 'LLM06', owaspName: '过度代理', desc: '情感操控绕过Agent安全决策' },
  { id: '17', number: 17, name: 'Agent权限越狱', attackType: '指令冲突攻击', difficulty: 5, icon: '🔑', module: 'excessive-agency', owasp: 'LLM06', owaspName: '过度代理', desc: '覆盖安全护栏获取未授权操作权限' },
  { id: '18', number: 18, name: '系统提示词泄露', attackType: '间接提取系统指令', difficulty: 4, icon: '📜', module: 'excessive-agency', owasp: 'LLM07', owaspName: '系统提示泄露', desc: '通过间接方式提取Agent系统提示词' },
  { id: '19', number: 19, name: '分步拆解提取', attackType: '指令分解攻击', difficulty: 4, icon: '🔪', module: 'rag-attack', owasp: 'LLM08', owaspName: '向量与嵌入攻击', desc: '将敏感请求拆解为无害步骤逐步窃取' },
  { id: '20', number: 20, name: '嵌入空间攻击', attackType: '相似度检索欺骗', difficulty: 4, icon: '🌐', module: 'rag-attack', owasp: 'LLM08', owaspName: '向量与嵌入攻击', desc: '利用嵌入相似度检索敏感文档片段' },
  { id: '21', number: 21, name: '跨文档信息关联', attackType: '多文档关联推断', difficulty: 5, icon: '🔗', module: 'rag-attack', owasp: 'LLM08', owaspName: '向量与嵌入攻击', desc: '通过多文档关联推断出敏感信息' },
  { id: '22', number: 22, name: '对抗样本注入', attackType: '对抗嵌入攻击', difficulty: 5, icon: '🛡', module: 'rag-attack', owasp: 'LLM08', owaspName: '向量与嵌入攻击', desc: '构造对抗样本绕过嵌入安全检测' },
  { id: '23', number: 23, name: '事实注入欺骗', attackType: '虚假事实注入', difficulty: 3, icon: '🎯', module: 'unbounded-attack', owasp: 'LLM09', owaspName: '虚假信息', desc: '注入虚假事实让Agent输出错误结论' },
  { id: '24', number: 24, name: '幻觉利用', attackType: '模型幻觉构造', difficulty: 4, icon: '🌀', module: 'unbounded-attack', owasp: 'LLM09', owaspName: '虚假信息', desc: '利用模型幻觉输出虚假权威信息' },
  { id: '25', number: 25, name: '递归调用攻击', attackType: 'Agent自我调用消耗', difficulty: 5, icon: '⛿', module: 'unbounded-attack', owasp: 'LLM10', owaspName: '无界消耗', desc: '诱导Agent无限递归调用耗尽资源' },
];
const diffColors: Record<number, string> = { 1: '#10B981', 2: '#3B82F6', 3: '#F59E0B', 4: '#F97316', 5: '#EF4444' };
const difficultyStars = (d: number) => '★'.repeat(d) + '☆'.repeat(5 - d);

/* ═══════════════════════════════════════════════════════════════
   RangeArena — 主组件（关卡列表）
   ═══════════════════════════════════════════════════════════════ */
const THEME_COLORS = {
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  secondary: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  darkBg: '#070B14',
  cardBg: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
};

const SECURITY_ICONS: Record<string, string> = {
  'prompt-injection': '💉',
  'sensitive-info': '🔓',
  'supply-chain': '📦',
  'improper-output': '🔒',
  'excessive-agency': '⚡',
  'rag-attack': '🌐',
  'unbounded-attack': '⚠️',
};

const OWASP_BADGE_COLORS: Record<string, string> = {
  'LLM01': 'rgba(239,68,68,0.15)',
  'LLM02': 'rgba(234,179,8,0.15)',
  'LLM03': 'rgba(16,185,129,0.15)',
  'LLM04': 'rgba(59,130,246,0.15)',
  'LLM05': 'rgba(139,92,246,0.15)',
  'LLM06': 'rgba(236,72,153,0.15)',
  'LLM07': 'rgba(20,184,166,0.15)',
  'LLM08': 'rgba(99,102,241,0.15)',
  'LLM09': 'rgba(245,158,11,0.15)',
  'LLM10': 'rgba(239,68,68,0.15)',
};

const OWASP_BORDER_COLORS: Record<string, string> = {
  'LLM01': 'rgba(239,68,68,0.3)',
  'LLM02': 'rgba(234,179,8,0.3)',
  'LLM03': 'rgba(16,185,129,0.3)',
  'LLM04': 'rgba(59,130,246,0.3)',
  'LLM05': 'rgba(139,92,246,0.3)',
  'LLM06': 'rgba(236,72,153,0.3)',
  'LLM07': 'rgba(20,184,166,0.3)',
  'LLM08': 'rgba(99,102,241,0.3)',
  'LLM09': 'rgba(245,158,11,0.3)',
  'LLM10': 'rgba(239,68,68,0.3)',
};

export const RangeArena = () => {
  const { state, dispatch } = useAppContext();
  const [activeModule, setActiveModule] = useState<string>('all');
  const [activeModelGroup, setActiveModelGroup] = useState<string>('all');

  const getCompletedLevels = (): Set<string> => {
    try {
      const stored = localStorage.getItem('aishield-completed-levels');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  const isLevelCompleted = (levelId: string) => getCompletedLevels().has(levelId);

  const getModelGroup = (number: number): string => {
    if (number >= 1 && number <= 10) return 'basic';
    if (number >= 11 && number <= 18) return 'intermediate';
    if (number >= 19 && number <= 25) return 'advanced';
    return 'all';
  };

  const filteredLevels = LEVELS.filter(level => {
    const moduleMatch = activeModule === 'all' || level.module === activeModule;
    const groupMatch = activeModelGroup === 'all' || getModelGroup(level.number) === activeModelGroup;
    return moduleMatch && groupMatch;
  });

  const completedCount = LEVELS.filter(l => state.completedLevels.has(l.id)).length;

  if (state.viewMode === 'range' || !state.currentLevel) {
    const completedSet = getCompletedLevels();
    const completedCount = completedSet.size;

    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: THEME_COLORS.darkBg }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 100% 80% at 20% -10%, rgba(139,92,246,0.08) 0%, transparent 50%),' +
              'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(6,182,212,0.06) 0%, transparent 45%),' +
              'radial-gradient(ellipse 60% 40% at 50% 80%, rgba(16,185,129,0.04) 0%, transparent 50%)',
          }}
        />

        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.4) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, #06B6D4 50%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)' }}>
                <span className="text-2xl">🛡️</span>
              </div>
              <div>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide"
                  style={{ color: '#A78BFA', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  AI SECURITY RANGE
                </span>
                <h1 className="text-4xl font-black mb-1" style={{ color: '#A78BFA' }}>AI安全靶场</h1>
              </div>
            </div>
        </div>


        <div className="p-2.5 sm:p-3 rounded-xl flex flex-col sm:flex-row items-center gap-2.5 relative mb-4"
          style={{ background: THEME_COLORS.cardBg, border: `1px solid ${THEME_COLORS.border}` }}>
          <div className="absolute inset-0 rounded-2xl opacity-5 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(6,182,212,0.2) 50%, rgba(16,185,129,0.2) 100%)' }} />
          <div className="relative z-10 w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: `rgba(16,185,129,0.1)` }}>🏆</div>
          <div className="relative z-10 flex-1 w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-white">学习进度</span>
              <span className="text-sm font-bold" style={{ color: THEME_COLORS.success }}>{completedCount}/{LEVELS.length}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(completedCount / LEVELS.length) * 100}%`,
                  background: 'linear-gradient(90deg, #8B5CF6, #06B6D4, #10B981)',
                }} />
              <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'shimmer 2s infinite' }} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          
          <button onClick={() => setActiveModelGroup('basic')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeModelGroup === 'basic' ? 'bg-green-500/30 text-green-300 ring-1 ring-green-500/50' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            🟢 基础篇 (1-10)
          </button>
          <button onClick={() => setActiveModelGroup('intermediate')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeModelGroup === 'intermediate' ? 'bg-yellow-500/30 text-yellow-300 ring-1 ring-yellow-500/50' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            🟡 进阶篇 (11-18)
          </button>
          <button onClick={() => setActiveModelGroup('advanced')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeModelGroup === 'advanced' ? 'bg-red-500/30 text-red-300 ring-1 ring-red-500/50' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            🔴 高级篇 (19-25)
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setActiveModule('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeModule === 'all' ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-500/50' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            全部模块
          </button>
          {MODULES.map(m => (
            <button key={m.id} onClick={() => setActiveModule(m.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeModule === m.id ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-500/50' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {SECURITY_ICONS[m.id] || m.icon} {m.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredLevels.map(level => {
            const completed = isLevelCompleted(level.id);
            const color = diffColors[level.difficulty];
            const owaspBg = OWASP_BADGE_COLORS[level.owasp] || 'rgba(255,255,255,0.05)';
            const owaspBorder = OWASP_BORDER_COLORS[level.owasp] || 'rgba(255,255,255,0.1)';

            return (
              <div key={level.id}
                onClick={() => {
                  dispatch({ type: 'SET_CURRENT_LEVEL', payload: level as RangeLevel });
                  dispatch({ type: 'SET_VIEW_MODE', payload: 'range-level' });
                }}
                className="group relative p-4 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col gap-2.5 overflow-hidden"
                style={{
                  background: completed ? 'rgba(16,185,129,0.06)' : THEME_COLORS.cardBg,
                  border: completed ? '1px solid rgba(16,185,129,0.3)' : `1px solid ${THEME_COLORS.border}`,
                }}>
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${color}10 0%, transparent 60%)`,
                    boxShadow: `0 4px 20px ${color}15`,
                  }}
                />

                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300" style={{ background: color }} />

                {completed && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'rgba(16,185,129,0.2)', color: THEME_COLORS.success }}>
                    ✓
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
                    style={{ background: `${color}15`, color }}>
                    {level.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white whitespace-nowrap truncate">{level.name}</h3>
                    <span className="text-[10px]" style={{ color }}>{difficultyStars(level.difficulty)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md"
                    style={{ background: owaspBg, border: `1px solid ${owaspBorder}`, color: '#A78BFA' }}>
                    {level.owasp}
                  </span>
                  <span className="text-[9px] text-gray-500 truncate">{level.attackType}</span>
                </div>

                <p className="text-xs line-clamp-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{level.desc}</p>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{level.owaspName}</span>
                  <span className="text-white/10 text-xs group-hover:text-white/30 transition-colors">→</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl"
            style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <span className="text-lg">💡</span>
            <span className="text-xs" style={{ color: 'rgba(203,213,225,0.5)' }}>
              提示：每个关卡都对应 OWASP LLM Top 10 中的一种安全风险，掌握攻击手法是理解防御的第一步
            </span>
          </div>
        </div>
      </div>
    </div>
    );
  }

  return <RangeArenaLevel />;
};

/* ═══════════════════════════════════════════════════════════════
   RangeArenaLevel — 关卡详情（含应用模拟 + 动态难度 + 漏洞报告）
   ═══════════════════════════════════════════════════════════════ */
const RangeArenaLevel = () => {
  const { state, dispatch } = useAppContext();
  const level = state.currentLevel!;

  const [input, setInput] = useState('');
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [verifiedPassword, setVerifiedPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [hints, setHints] = useState<{ shown: LevelHint[]; active: number }>({ shown: [], active: 0 });
  const [showTips, setShowTips] = useState(false);
  const [attemptCount, setAttemptCount] = useState(1);
  const [failureCount, setFailureCount] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isCompleted = (() => {
    try {
      const stored = localStorage.getItem('aishield-completed-levels');
      return stored ? (JSON.parse(stored) as string[]).includes(level.id) : false;
    } catch { return false; }
  })();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatMessages]);

  useEffect(() => {
    if (showVictory) {
      const t = setTimeout(() => setShowVictory(false), 3500);
      return () => clearTimeout(t);
    }
  }, [showVictory]);

  const sendMessage = async () => {
    if (!input.trim() || isLLMLoading) return;
    const msg = input.trim();
    setInput('');
    setIsLLMLoading(true);
    setAttemptCount(prev => prev + 1);

    const userMsg: ChatMessage = { role: 'user', content: msg };
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg });

    try {
      // 传入 levelId 启用应用模拟 + 动态难度
      const aiResponse = await chatWithLLM(
        '',
        [...state.chatMessages, userMsg],
        level.id,
        attemptCount,
        failureCount
      );
      const aiMsg: ChatMessage = { role: 'ai', content: aiResponse };
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: aiMsg });
    } catch {
      const fallbackMsg: ChatMessage = { role: 'ai', content: '系统响应超时，请重试。' };
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: fallbackMsg });
    } finally {
      setIsLLMLoading(false);
    }
  };

  const resetChat = () => {
    dispatch({ type: 'CLEAR_CHAT' });
    setAttemptCount(1);
    setFailureCount(0);
  };

  const showNextHint = () => {
    const levelHints = LEVEL_HINTS[level.id] || [];
    const nextIdx = hints.shown.length;
    if (nextIdx < levelHints.length) {
      setHints(prev => ({ shown: [...prev.shown, levelHints[nextIdx]], active: nextIdx }));
    }
  };

  const verifyPassword = async () => {
    const token = getAuthToken();
    if (!token) {
      setPasswordError(true);
      setFailureCount(prev => prev + 1);
      setTimeout(() => setPasswordError(false), 2000);
      return;
    }
    try {
      const resp = await fetch('/api/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ levelId: level.id, password: passwordInput.trim().toUpperCase() }),
      });
      const data = await resp.json();
      if (data.correct) {
        setVerifiedPassword(passwordInput.trim().toUpperCase());
        try {
          const stored = localStorage.getItem('aishield-completed-levels');
          const completed: string[] = stored ? JSON.parse(stored) : [];
          if (!completed.includes(level.id)) {
            completed.push(level.id);
            localStorage.setItem('aishield-completed-levels', JSON.stringify(completed));

            // 记录实战记录
            const record: import('../types').PracticeRecord = {
              id: `r_${Date.now()}`,
              levelId: level.id,
              levelName: level.name,
              attackType: level.attackType,
              completedAt: new Date().toISOString(),
              attemptCount,
              hintCount: hints.shown.length,
              score: Math.max(100, 1000 - (hints.shown.reduce((s, h) => s + h.scorePenalty, 0)) - (attemptCount - 1) * 20),
              duration: Math.max(30, Math.round((Date.now() - (state.chatMessages.length > 0 ? 0 : Date.now())) / 1000)),
              keyPayload: state.chatMessages.filter(m => m.role === 'user').slice(-1)[0]?.content?.slice(0, 100) || '',
            };
            dispatch({ type: 'ADD_PRACTICE_RECORD', payload: record });
          }
        } catch { /* ignore */ }
        setShowVictory(true);
        setPasswordError(false);
        setPasswordInput('');
      } else {
        setPasswordError(true);
        setFailureCount(prev => prev + 1);
        setTimeout(() => setPasswordError(false), 2000);
      }
    } catch {
      setPasswordError(true);
      setFailureCount(prev => prev + 1);
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  // 生成漏洞报告
  const handleGenerateReport = async () => {
    setReportLoading(true);
    setShowReport(true);
    try {
      const report = await generateVulnReportFallback(
        level.id,
        level.name,
        level.attackType,
        state.chatMessages,
        verifiedPassword
      );
      setReportContent(report);
    } catch (e) {
      setReportContent('# 报告生成失败\n\n' + String(e));
    } finally {
      setReportLoading(false);
    }
  };

  // 导出报告为 .md 文件
  const handleExportReport = () => {
    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AIShieldLab_${level.name}_漏洞报告.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tips = LEVEL_TIPS[level.id] || [];
  const leaderboard = LEADERBOARD[level.id] || [];
  const color = diffColors[level.difficulty];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* 主内容区 */}
      <div className="xl:col-span-3 space-y-5">
        <div>
          <button onClick={() => {
            dispatch({ type: 'SET_VIEW_MODE', payload: 'range' });
            dispatch({ type: 'SET_CURRENT_LEVEL', payload: null });
          }}
            className="text-xs cursor-pointer flex items-center gap-1 mb-4" style={{ color: '#10B981' }}>
            ← 返回靶场
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black"
              style={{ background: `${color}20`, color }}>
              {level.number}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{level.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color }}>{difficultyStars(level.difficulty)}</span>
                <span className="text-xs px-2 py-0.5 rounded-md"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                  {level.attackType}
                </span>
                {isCompleted && <span className="text-xs">✅ 已通关</span>}
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  · 尝试 {attemptCount} 次
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{level.description}</p>
        </div>

        {/* 聊天区域 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(16,185,129,0.05)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLLMLoading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-xs font-medium" style={{ color: '#10B981' }}>目标系统</span>
              {isLLMLoading && (
                <span className="text-[10px] text-yellow-400/70 animate-pulse">思考中...</span>
              )}
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {getAuthToken() ? '· 真实 LLM' : '· 模拟模式'}
              </span>
            </div>
            <button onClick={resetChat}
              className="text-[10px] px-3 py-1 rounded-lg cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
              重置对话 ↻
            </button>
          </div>

          <div className="p-4 space-y-3 min-h-[320px] max-h-[420px] overflow-y-auto">
            {state.chatMessages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🛡️</div>
                <p className="text-sm font-medium text-white mb-1">目标：通过 Prompt 注入获取通关密码</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>你正在与一个模拟真实应用的 LLM 对抗</p>
              </div>
            )}
            {state.chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' ? (
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md overflow-hidden text-xs"
                    style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(56,189,248,0.15)' }}>
                    <div className="px-3 py-1.5 flex items-center gap-2"
                      style={{ background: 'rgba(56,189,248,0.08)', borderBottom: '1px solid rgba(56,189,248,0.1)' }}>
                      <span style={{ color: '#38BDF8', fontSize: 10 }}>⚡ 目标系统响应</span>
                    </div>
                    <div className="p-3">
                      <ChatResponseRenderer content={msg.content} />
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md text-sm"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                    {msg.content}
                  </div>
                )}
              </div>
            ))}
            {isLLMLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-md text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={isLLMLoading ? 'AI 回复中...' : '输入 payload 尝试注入...'}
              disabled={isLLMLoading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <button onClick={sendMessage} disabled={isLLMLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}>
              {isLLMLoading ? '...' : '发送'}
            </button>
          </div>
        </div>

        {/* 提示 & 密码验证 */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <button onClick={showNextHint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs cursor-pointer"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
              💡 获取提示 ({hints.shown.length}/{(LEVEL_HINTS[level.id] || []).length})
            </button>
            {isCompleted && (
              <button onClick={handleGenerateReport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs cursor-pointer"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.2)' }}>
                📄 生成漏洞报告
              </button>
            )}
          </div>

          {hints.shown.length > 0 && (
            <div className="space-y-2">
              {hints.shown.map((hint, i) => (
                <div key={i} className="px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(245,158,11,0.08)', borderLeft: '3px solid #F59E0B', color: 'rgba(255,255,255,0.7)' }}>
                  <span className="text-[10px] font-bold mr-2" style={{ color: '#F59E0B' }}>
                    提示{i + 1} (-{hint.scorePenalty}分)
                  </span>
                  {hint.text}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyPassword()}
                placeholder="输入通关密码..."
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${passwordError ? '#EF4444' : 'rgba(59,130,246,0.3)'}`,
                }} />
              {passwordError && (
                <div className="absolute -bottom-5 left-0 text-[10px]" style={{ color: '#EF4444' }}>
                  ❌ 密码错误，请重试
                </div>
              )}
            </div>
            <button onClick={verifyPassword}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)' }}>
              验证 🔑
            </button>
          </div>
        </div>

        {/* 通关弹窗 */}
        {showVictory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
            <div className="text-center animate-bounce">
              <div className="text-7xl mb-4">🎉</div>
              <div className="text-2xl font-black text-white mb-2">通关成功！</div>
              <div className="text-sm mb-6" style={{ color: '#10B981' }}>你已成功完成「{level.name}」关卡</div>
              <div className="flex items-center justify-center gap-3">
                <div className="px-6 py-2 rounded-xl text-sm"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                  ✅ 已记录到本地进度
                </div>
                <button
                  onClick={() => { setShowVictory(false); handleGenerateReport(); }}
                  className="px-6 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', color: 'white' }}>
                  📄 生成漏洞报告
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 漏洞报告弹窗 */}
        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}>
            <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
              style={{ background: '#0B1120', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <span className="text-sm font-bold text-white">{level.name} · 漏洞分析报告</span>
                </div>
                <div className="flex items-center gap-2">
                  {reportContent && (
                    <button onClick={handleExportReport}
                      className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>
                      ⬇ 导出 MD
                    </button>
                  )}
                  <button onClick={() => setShowReport(false)}
                    className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                    ✕ 关闭
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {reportLoading ? (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-4 animate-pulse">🤖</div>
                    <p className="text-sm text-white/50">AI 正在分析对话记录，生成漏洞报告...</p>
                  </div>
                ) : (
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap"
                    style={{ color: 'rgba(255,255,255,0.75)', fontFamily: '"JetBrains Mono", monospace' }}>{reportContent}</pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 右侧信息栏 */}
      <div className="xl:col-span-1 space-y-4">
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}>关卡信息</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
              style={{ background: `${color}15`, color }}>
              {level.number}
            </div>
            <div>
              <div className="text-sm font-bold text-white">{level.name}</div>
              <div className="text-[10px]" style={{ color }}>{difficultyStars(level.difficulty)}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            <span className="text-[10px] px-2 py-0.5 rounded-md"
              style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>
              {level.attackType}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{level.description}</p>
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setShowTips(!showTips)}
            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer text-left"
            style={{ background: 'rgba(239,68,68,0.05)' }}>
            <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>⚔️ 攻击技巧参考</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', transform: showTips ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▼</span>
          </button>
          {showTips && (
            <div className="px-4 py-3 space-y-2">
              {tips.map((tip, i) => (
                <div key={i} className="text-xs py-1.5" style={{ color: 'rgba(255,255,255,0.55)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#EF4444', marginRight: '6px' }}>•</span>{tip}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}>🏅 本关排行榜</div>
          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map(entry => (
                <div key={entry.rank} className="flex items-center gap-2">
                  <span className="w-5 text-center text-[10px] font-bold"
                    style={{ color: entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#CD7F32' : 'rgba(255,255,255,0.3)' }}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                  </span>
                  <span className="flex-1 text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{entry.name}</span>
                  <span className="text-[10px] font-bold" style={{ color: '#10B981' }}>{entry.score}</span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{entry.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              暂无数据，成为第一个通关者！
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   漏洞报告生成（前端直接调用 DashScope）
   ═══════════════════════════════════════════════════════════════ */
async function generateVulnReportFallback(
  _levelId: string,
  levelName: string,
  attackType: string,
  chatHistory: { role: 'user' | 'ai'; content: string }[],
  password: string
): Promise<string> {
  const now = new Date().toISOString().split('T')[0];
  const chatText = chatHistory
    .map(m => `${m.role === 'user' ? '👤 学生' : '🤖 目标系统'}：${m.content}`)
    .join('\n');

  const token = getAuthToken();

  if (!token) {
    return `# ${levelName} 漏洞分析报告

> 生成时间：${now}  
> 攻击类型：${attackType}  
> 通关密码：\`${password}\`

---

## 1. 漏洞概述

- **漏洞名称**：${levelName} 绕过攻击
- **严重程度**：高 🔴
- **影响范围**：LLM 应用安全防护
- **漏洞描述**：通过 ${attackType} 手法，成功绕过目标系统的安全限制。

---

## 2. 攻击手法分析

（请登录后获取 AI 自动生成的完整分析报告）

**关键步骤**：
1. 分析目标系统的回复格式和安全边界
2. 构造针对性 payload
3. 绕过内容过滤机制
4. 获取系统敏感信息

---

## 3. Payload 解析

\`\`\`
# 请在此处记录你成功通关所用的关键 prompt
\`\`\`

---

## 4. 防御建议

- 加强输入验证，对特殊字符和编码进行过滤
- 实施多层安全防护，不要依赖单一防御手段
- 定期对 LLM 应用进行红队测试
- 使用对抗训练提升模型对注入攻击的鲁棒性

---

## 5. 学习总结

通过本次靶场练习，学习了 ${attackType} 的基本原理和实战手法。

---

> 💡 提示：登录后，每次通关可自动生成包含真实对话分析的中文报告。
`;
  }

  const reportPrompt = `请生成一份专业的 AI 安全漏洞分析报告（Markdown 格式），包含以下章节：

## 1. 漏洞概述
漏洞名称、严重程度、影响范围

## 2. 攻击手法分析
学生使用了什么 Prompt 注入手法、为什么成功

## 3. Payload 解析
提取关键 payload，分析构造逻辑

## 4. 防御建议
具体修复方案

## 5. 学习总结
学生从这个案例中学到了什么

关卡：${levelName}
攻击类型：${attackType}
通关密码：\`${password}\`

对话记录：
${chatText}

输出中文，语气专业，适合放在 GitHub 作品集中。`;

  try {
    const resp = await fetch('/api/dashscope/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: '你是 AI 安全漏洞分析报告生成器，输出专业中文 Markdown 报告。' },
          { role: 'user', content: reportPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!resp.ok) throw new Error('API error');
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || `生成失败，请重试。`;
  } catch {
    return `# ${levelName} 漏洞分析报告\n\n> 生成时间：${now}\n\nAI 报告生成失败，请检查网络连接或登录状态。`;
  }
}
