import { useAppContext } from '../context/AppContext';

export const PrivacyPage = () => {
  const { state, dispatch } = useAppContext();
  const { theme } = state;
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0B1120] text-white/80' : 'bg-gray-50 text-gray-700'}`}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <button
          onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'home' })}
          className={`mb-8 text-sm ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
        >
          ← 返回
        </button>

        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          用户协议与隐私政策
        </h1>
        <p className={`text-sm mb-8 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
          最后更新：2026年5月
        </p>

        {/* 用户协议 */}
        <section className="mb-10">
          <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>一、用户协议</h2>
          <div className={`space-y-3 text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            <p>欢迎使用五迷工坊（以下简称"本平台"）。请您仔细阅读本协议，使用本平台即表示您同意本协议的全部内容。</p>
            <p><strong>1. 服务内容</strong><br/>本平台为用户提供设计模板编辑、预览、下载及打印下单服务。</p>
            <p><strong>2. 用户行为规范</strong><br/>您承诺不发布、不上传含有以下内容的设计作品：<br/>
            · 侵犯任何第三方知识产权、肖像权、名誉权的内容；<br/>
            · 含有色情、暴力、赌博、违反法律法规的内容；<br/>
            · 含有病毒、恶意代码等可能损害平台安全的内容；<br/>
            · 冒用他人名义发布内容。</p>
            <p><strong>3. 内容审核</strong><br/>平台对用户发布的内容进行人工审核，发现违规内容将立即下架，严重违规者将被封禁账号。</p>
            <p><strong>4. 知识产权</strong><br/>您上传或创建的内容，其知识产权归您所有。您授权平台在提供服务所必需的范围内使用您的内容（包括展示在模板商店）。<br/>
            您确认您发布的内容不侵犯任何第三方的知识产权。若因您发布的内容引发侵权纠纷，由您自行承担全部责任。</p>
            <p><strong>5. 免责声明</strong><br/>本平台提供的模板仅供个人学习欣赏使用，请勿用于任何商业用途。<br/>
            平台尽力确保服务的稳定性，但不对服务中断、数据丢失等不可抗力因素承担责任。</p>
          </div>
        </section>

        {/* 隐私政策 */}
        <section className="mb-10">
          <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>二、隐私政策</h2>
          <div className={`space-y-3 text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            <p><strong>1. 信息收集</strong><br/>我们收集您注册时提供的昵称、邮箱信息，以及您使用时产生的操作日志（不含敏感内容）。</p>
            <p><strong>2. 信息使用</strong><br/>您的信息仅用于提供服务、改善用户体验、发送重要通知，不会出售给第三方。</p>
            <p><strong>3. 信息存储</strong><br/>数据存储于安全服务器，我们采取合理措施保护您的数据安全。</p>
            <p><strong>4. Cookie 使用</strong><br/>我们使用 localStorage 存储您的登录状态和偏好设置，不使用第三方追踪 Cookie。</p>
          </div>
        </section>

        {/* 举报入口 */}
        <section className="mb-10">
          <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>三、内容举报</h2>
          <div className={`space-y-3 text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            <p>如果您认为某件作品侵犯了您的合法权益，或含有违规内容，请通过以下方式举报：</p>
            <p>· 在模板详情页点击「举报」按钮，填写举报原因提交；<br/>
            · 或发送邮件至：<a href="mailto:support@wuliao-studio.com" className="text-[#F59E0B]">support@wuliao-studio.com</a>，注明作品ID和举报理由。</p>
            <p>我们会在 3 个工作日内处理您的举报并给出反馈。</p>
          </div>
        </section>

        <p className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
          如有疑问，请联系客服：support@wuliao-studio.com
        </p>
      </div>
    </div>
  );
};
