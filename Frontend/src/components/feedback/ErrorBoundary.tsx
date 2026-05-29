import { Component, ErrorInfo, PropsWithChildren, ReactNode } from 'react';

interface State {
  error?: Error;
}

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application boundary captured an error', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="centered-state">
          <h1>Flight deck needs a reset</h1>
          <p>{this.state.error.message}</p>
          <button type="button" onClick={() => window.location.assign('/')}>
            Return home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
