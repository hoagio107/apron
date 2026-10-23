import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
          <span className="text-6xl">😵</span>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Đã xảy ra lỗi không mong muốn</h2>
            <p className="text-sm text-default-500 max-w-sm mx-auto">
              {this.state.error?.message || 'Lỗi không xác định'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
