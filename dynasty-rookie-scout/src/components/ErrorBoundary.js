import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40,
          textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: '#ef4444',
            marginBottom: 8,
          }}>Something went wrong</h2>
          <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>
            The app hit an unexpected error. Check the browser console for details.
          </p>
          <details style={{
            textAlign: 'left',
            maxWidth: 600,
            margin: '0 auto 20px',
            background: '#1a1d2e',
            border: '1px solid #2a2d3e',
            borderRadius: 8,
            padding: 16,
          }}>
            <summary style={{ color: '#f59e0b', cursor: 'pointer', fontSize: 12, marginBottom: 8 }}>
              Error details
            </summary>
            <pre style={{
              color: '#ef4444',
              fontSize: 11,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              padding: '10px 24px',
              border: '1px solid #f59e0b',
              borderRadius: 6,
              background: 'rgba(245,158,11,0.15)',
              color: '#f59e0b',
              cursor: 'pointer',
              letterSpacing: 1,
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
