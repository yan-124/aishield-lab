import { StrictMode } from 'react';
import { createRoot, Root } from 'react-dom/client';
import './index.css';
import { AppProvider } from './components/AppProvider';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

let root: Root | null = null;

function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.classList.add('hidden');
    setTimeout(() => {
      loadingIndicator.remove();
    }, 500);
  }
}

function showErrorState(message: string = '页面加载失败') {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
  const errorContainer = document.getElementById('error-container');
  const errorMessage = errorContainer?.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.textContent = message;
  }
  if (errorContainer) {
    errorContainer.classList.add('visible');
  }
}

window.addEventListener('error', (e) => {
  console.error('[AIShield Lab] 全局错误:', e);
  showErrorState(`${e.message || '未知错误'}\n${e.filename || ''}:${e.lineno || ''}`);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[AIShield Lab] 未处理的 Promise 错误:', e.reason);
  showErrorState(String(e.reason));
});

window.addEventListener('DOMContentLoaded', () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('根元素未找到');
    }

    root = createRoot(rootElement);

    root.render(
      <StrictMode>
        <ErrorBoundary onError={showErrorState}>
          <AppProvider>
            <App onLoadComplete={hideLoadingIndicator} />
          </AppProvider>
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    console.error('[AIShield Lab] React 初始化失败:', error);
    showErrorState(error instanceof Error ? error.message : 'React 初始化失败');
  }
});

if (import.meta.env.DEV) {
}
