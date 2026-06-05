import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 my-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-800">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Ops! Algo deu errado
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Ocorreu um erro inesperado ao carregar esta seção. Você pode tentar recarregar ou entrar em contato com o suporte.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm focus:outline-none"
              >
                Tentar Novamente
              </button>

              {this.state.error && (
                <details className="text-left bg-slate-100 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
                  <summary className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none focus:outline-none">
                    Ver detalhes do erro
                  </summary>
                  <pre className="mt-2 text-[10px] font-mono text-red-600 dark:text-red-400 overflow-x-auto max-h-40 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
