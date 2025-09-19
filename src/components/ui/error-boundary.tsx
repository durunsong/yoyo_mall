/**
 * 错误边界组件
 * 用于捕获和处理React组件错误
 */

'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Card, CardHeader, CardTitle, CardContent } from './card';

// 错误状态接口
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// 错误边界Props接口
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// 错误回退组件Props接口
interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  onGoHome?: () => void;
}

/**
 * 默认错误回退组件
 */
function DefaultErrorFallback({ error, resetError, onGoHome }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-600">出现错误</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            抱歉，页面出现了意外错误。请尝试刷新页面或返回首页。
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                错误详情 (开发模式)
              </summary>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={resetError}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
            <Button
              onClick={onGoHome || (() => window.location.href = '/')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * React错误边界组件
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary 捕获到错误:', error);
    console.error('错误信息:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 在生产环境中可以发送错误到监控服务
    if (process.env.NODE_ENV === 'production') {
      // 发送错误到Sentry、LogRocket等服务
      // reportError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * API错误显示组件
 */
interface ApiErrorProps {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function ApiError({ error, onRetry, className }: ApiErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
      <p className="text-gray-600 mb-4">{errorMessage}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          重试
        </Button>
      )}
    </div>
  );
}

/**
 * 404错误组件
 */
export function NotFound() {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">页面未找到</h1>
        <p className="text-gray-600 mb-6">
          抱歉，您访问的页面不存在或已被移除。
        </p>
        <div className="space-x-4">
          <Button onClick={() => window.history.back()} variant="outline">
            返回上页
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * 网络错误组件
 */
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-yellow-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">网络连接错误</h3>
      <p className="text-gray-600 mb-4">
        请检查您的网络连接，然后重试。
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          重试
        </Button>
      )}
    </div>
  );
}
