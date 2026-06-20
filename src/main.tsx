import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppProvider } from './components/AppProvider';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// 全局错误捕获（React 渲染前的错误）
window.addEventListener('error', (e) => {
  const el = document.getElementById('root');
  if (el) {
    el.innerHTML = `<div style="padding:40px;font-family:system-ui"><h1 style="color:#EF4444">全局错误</h1><pre style="background:#1E1E2E;color:#CDD6F4;padding:20px;border-radius:12px;white-space:pre-wrap">${e.message || '未知错误'}\n${e.filename || ''}:${e.lineno || ''}:${e.colno || ''}</pre></div>`;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const el = document.getElementById('root');
  if (el) {
    el.innerHTML = `<div style="padding:40px;font-family:system-ui"><h1 style="color:#EF4444">未处理的 Promise 错误</h1><pre style="background:#1E1E2E;color:#CDD6F4;padding:20px;border-radius:12px;white-space:pre-wrap">${String(e.reason)}</pre></div>`;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
);
