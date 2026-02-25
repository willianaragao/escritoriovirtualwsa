import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2.5rem', background: '#fff', color: '#000', minHeight: '100vh', overflow: 'auto' }}>
                    <h1 style={{ color: 'red' }}>Ops! Algo deu errado.</h1>
                    <p><strong>Erro:</strong> {this.state.error && this.state.error.toString()}</p>
                    <pre style={{ background: '#f5f5f5', padding: '1rem', border: '1px solid #ccc' }}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ padding: '10px 20px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        Recarregar Sistema
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
