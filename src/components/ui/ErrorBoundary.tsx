import { Component, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches render errors anywhere below it and shows a calm message instead of a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error('[FeeBridge] Unexpected error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-serif text-2xl font-bold text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm text-body">
            That's on us, not you. Nothing has been lost - reloading the page usually fixes it.
          </p>
          <button
            className="btn-primary mt-5"
            onClick={() => { window.location.reload(); }}
          >
            <RefreshCw size={15} />
            Reload FeeBridge
          </button>
        </div>
      </div>
    );
  }
}
