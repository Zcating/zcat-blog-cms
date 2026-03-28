import { ZSpin } from '@zcat/ui';
import React from 'react';

interface SuspenseBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SuspenseBoundary({
  children,
  fallback,
}: SuspenseBoundaryProps) {
  return (
    <React.Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center min-h-[200px]">
            <ZSpin size="lg" />
          </div>
        )
      }
    >
      {children}
    </React.Suspense>
  );
}

interface AsyncBoundaryProps {
  children: React.ReactNode;
  errorFallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

interface AsyncBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AsyncErrorBoundary extends React.Component<
  AsyncBoundaryProps,
  AsyncBoundaryState
> {
  constructor(props: AsyncBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AsyncBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AsyncErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.errorFallback || (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
            <p className="text-error text-lg mb-2">加载失败</p>
            <p className="text-gray-500 text-sm">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              重试
            </button>
          </div>
        )
      );
    }

    return (
      <SuspenseBoundary fallback={this.props.loadingFallback}>
        {this.props.children}
      </SuspenseBoundary>
    );
  }
}
