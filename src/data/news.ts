/**
 * AI安全新闻数据
 * 数据来源：安全内参、CSDN、FreeBuf、The Hacker News 等安全媒体
 * 更新方式：后续可通过 Cloudflare Worker 定时抓取安全媒体RSS自动更新
 * 最近更新：2026-06-23
 */

import type { NewsItem } from '../types';

export const NEWS_DATA_LAST_UPDATED = '2026-06-23';

export const news: NewsItem[] = [
  {
    id: '1',
    title: '360发布AI漏洞挖掘报告：从模型能力涌现到智能体工程实战',
    source: '360 AI安全研究院',
    timestamp: '1天前',
    summary: '360发布报告指出AI漏洞挖掘正进入真实系统验证阶段，其智能体已累计挖出3432个漏洞，其中105个经监管确认，提出"智能体生态多米诺风险"新概念。',
    category: '模型安全',
    url: 'http://m.toutiao.com/group/7654511410080219658/',
  },
  {
    id: '2',
    title: '首份银行业保险业AI安全开发应用指导意见落地',
    source: '国家金融监督管理总局',
    timestamp: '1天前',
    summary: '6月22日，金融监管总局发布银行业保险业AI安全开发应用指导意见，涵盖治理架构、数据治理、风险管理等32项细则，标志着金融AI正式步入规范化发展阶段。',
    category: '合规治理',
    url: 'https://blog.csdn.net/haohaizi_liu/article/details/162199968',
  },
  {
    id: '3',
    title: 'AI Agent遭Prompt注入攻击可泄露CI/CD凭证',
    source: 'Microsoft Security Blog',
    timestamp: '1周前',
    summary: '红队研究确认AI Agent可通过Prompt注入被劫持，导致AWS IAM密钥、数据库密码等凭证外泄。CWE-77/CWE-94描述了这一结构缺陷，建议立即实施最小权限和人工确认机制。',
    category: '威胁情报',
    url: 'https://techjacksolutions.com/wp-content/uploads/2026/06/scc-sty-2026-0197.pdf',
  },
  {
    id: '4',
    title: '谷歌确认黑客首次利用AI独立发现零日漏洞',
    source: 'Google Threat Intelligence Group',
    timestamp: '2周前',
    summary: 'GTIG确认有攻击者使用前沿AI模型发现并利用开源Web管理工具的零日漏洞，在数分钟内生成了数百个exploit变体，CVSS评分系AI"幻觉"编造，标志着AI攻击元年到来。',
    category: '威胁情报',
    url: 'https://www.infobae.com/tecno/2026/06/10/google-alerta-sobre-el-primer-ataque-zero-day-con-ia-guia-para-proteger-tu-informacion/',
  },
  {
    id: '5',
    title: '美国发布AI创新与安全行政令：前沿模型自愿合作框架',
    source: 'The White House',
    timestamp: '3周前',
    summary: '6月2日，白宫签署行政令建立双轨AI框架，要求前沿AI开发者自愿共享模型进行安全测试，建立AI网络安全信息交换中心，明确拒绝强制许可机制。',
    category: '合规治理',
    url: 'http://www.gdtbt.org.cn/html/note-453637.html',
  },
  {
    id: '6',
    title: '中国三部门联合印发智能体规范应用与创新发展实施意见',
    source: '国家网信办/发改委/工信部',
    timestamp: '1个月内',
    summary: '5月8日，网信办等三部门发布智能体规范应用意见，提出安全可控、规范有序、创新驱动、应用牵引四大原则，48项新AI服务完成备案。',
    category: '合规治理',
    url: 'https://blog.csdn.net/qq_31142761/article/details/161346588',
  },
  {
    id: '7',
    title: 'AI辅助攻击导致7亿用户数据泄露，2026年被标记为AI攻击元年',
    source: 'The Hacker News',
    timestamp: '1个月内',
    summary: 'AI大幅降低网络攻击门槛，攻击速度与规模显著升级。佛罗里达州检方就枪击案对OpenAI发起刑事调查，AI不当行为责任归属首次进入司法程序。',
    category: '威胁情报',
    url: 'https://blog.csdn.net/qq_31142761/article/details/161346588',
  },
  {
    id: '8',
    title: '企业AI安全产品选型指南：腾讯云安全领跑Agent安全赛道',
    source: 'IDC',
    timestamp: '1天内',
    summary: 'IDC 2026评估显示腾讯云安全在Agent安全生命周期覆盖、控制深度、集成部署三项核心指标均列第一，奇安信、深信服、360在细分维度各具优势。',
    category: '行业动态',
    url: 'http://m.toutiao.com/group/7654425329993335330/',
  },
  {
    id: '9',
    title: 'EU AI Act合规期限临近，高风险AI系统8月前须完成合规评估',
    source: 'European Commission',
    timestamp: '2周前',
    summary: 'EU AI Act要求高风险AI系统在2026年8月前完成合规评估，包括AI系统风险分级管理、强制合规评估、AI生成内容标注义务和跨境数据传输规范。',
    category: '合规治理',
    url: 'https://blog.csdn.net/qq_31142761/article/details/161346588',
  },
  {
    id: '10',
    title: '奇安信启动"AI时代，攻防先行"发布周，免费公测威胁分析数字专家',
    source: '奇安信',
    timestamp: '1周前',
    summary: '奇安信首发免费公测的"威胁分析数字专家"（expert.qianxin.com），提出网络安全进入"AI智能体对抗"阶段，该工具可自动化威胁分析和研判。',
    category: '行业动态',
    url: 'http://m.toutiao.com/group/7654425329993335330/',
  },
];
