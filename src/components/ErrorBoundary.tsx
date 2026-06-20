import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[AIShield Lab Error]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 40,
          fontFamily: 'system-ui, sans-serif',
          maxWidth: 700,
          margin: '40px auto',
        }}>
          <h1 style={{ color: '#EF4444', fontSize: 24 }}>AIShield Lab 发生了错误</h1>
          <pre style={{
            background: '#1E1E2E',
            color: '#CDD6F4',
            padding: 20,
            borderRadius: 12,
            overflow: 'auto',
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 16,
              padding: '10px 24px',
              background: '#3B82F6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
