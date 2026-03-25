import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white p-8 font-mono overflow-auto">
          <h1 className="text-red-500 text-2xl font-bold mb-4">Algo deu errado (React Crash)</h1>
          <div className="bg-zinc-900 p-4 rounded border border-red-900/50 mb-4">
            <p className="font-bold text-red-400">{this.state.error?.toString()}</p>
          </div>
          <p className="text-zinc-400 mb-2 italic">Stack Trace:</p>
          <pre className="text-xs text-zinc-500 bg-black/50 p-4 rounded overflow-x-auto">
            {this.state.error?.stack}
            {"\n\nComponent Stack:\n"}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-sans transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
