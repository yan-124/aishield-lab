import React, { useState } from 'react';
import { Shield, Building2, Users, Zap, ArrowRight, CheckCircle, Star } from 'lucide-react';

export const EnterprisePage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  const services = [
    {
      icon: Shield,
      title: '团队AI安全评估',
      desc: '为整个安全团队做OWASP LLM Top 10能力gap分析，生成组织级安全画像',
      features: ['批量评估账号', '团队能力热力图', '差距优先级排序', '季度复测追踪']
    },
    {
      icon: Zap,
      title: '定制化靶场',
      desc: '基于企业技术栈和业务场景定制专属靶场，模拟真实攻击面',
      features: ['企业专属关卡', '私有LLM靶标', '攻击报告汇总', '合规证据留存']
    },
    {
      icon: Users,
      title: '团队培训方案',
      desc: '从入门到架构师的全路径培训，含考核认证和进度管理',
      features: ['按岗位定制路径', '学习进度看板', '技能认证证书', '培训效果报告']
    }
  ];

  const cases = [
    { company: '某头部互联网公司', result: '3个月内将AI安全团队能力评分从42分提升至78分' },
    { company: '某金融机构', result: '通过OWASP LLM Top 10合规审计，靶场训练通过率95%' },
    { company: '某车企安全团队', result: '8人团队完成AI安全体系从0到1搭建' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-lg" style={{ background: 'rgba(96,165,250,0.1)' }}>
            <Building2 size={24} className="text-blue-400" />
          </div>
          <div>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide"
              style={{ color: '#60A5FA', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
              ENTERPRISE
            </span>
            <h1 className="text-4xl font-black  mb-1" style={{ color: '#60A5FA' }}>企业AI安全能力建议</h1>
          </div>
        </div>

      </div>

      {/* Services */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold mb-8">企业服务</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{s.desc}</p>
              <ul className="space-y-2">
                {s.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Cases */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold mb-8">客户案例</h2>
        <div className="space-y-4">
          {cases.map((c, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10 flex items-start gap-4">
              <Star className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-300 mb-1">{c.company}</div>
                <div className="text-sm text-gray-300">{c.result}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20">
          <h2 className="text-2xl font-bold mb-3">开始企业AI安全建设</h2>
          <p className="text-gray-400 mb-6">留下邮箱，我们的解决方案顾问将在48小时内与您联系</p>
          {submitted ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>提交成功，我们会尽快联系您！</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-md">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="企业邮箱"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                required
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                联系我们 <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
