import { Component, ReactNode } from 'react';

interface Props { 
  children: ReactNode; 
  onError?: (message: string) => void;
}
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[AIShield Lab Error]', error, info);
    if (this.props.onError) {
      this.props.onError(error.message);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 40,
          fontFamily: 'system-ui, sans-serif',
          maxWidth: 700,
          margin: '40px auto',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
          <h1 style={{ color: '#EF4444', fontSize: 24, marginBottom: 12 }}>页面加载失败</h1>
          <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 20 }}>
            抱歉，页面加载出现问题。请刷新页面重试。
          </p>
          <pre style={{
            background: '#1E1E2E',
            color: '#CDD6F4',
            padding: 16,
            borderRadius: 8,
            overflow: 'auto',
            fontSize: 12,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            marginBottom: 20,
            maxHeight: 150,
            textAlign: 'left',
          }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
