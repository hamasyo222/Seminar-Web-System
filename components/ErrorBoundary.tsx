'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // エラーをログサービスに送信（本番環境）
    if (process.env.NODE_ENV === 'production') {
      // TODO: Sentryなどのエラートラッキングサービスに送信
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                エラーが発生しました
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                申し訳ございません。予期しないエラーが発生しました。
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 text-left bg-gray-100 p-4 rounded-md">
                  <p className="text-xs font-mono text-gray-700">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                もう一度試す
              </button>
              
              <Link
                href="/"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Home className="h-4 w-4 mr-2" />
                ホームに戻る
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// エラーページコンポーネント
interface ErrorPageProps {
  statusCode: number
  title?: string
  message?: string
}

export function ErrorPage({ 
  statusCode, 
  title, 
  message 
}: ErrorPageProps) {
  const defaultTitles: Record<number, string> = {
    400: '不正なリクエスト',
    401: '認証が必要です',
    403: 'アクセスが拒否されました',
    404: 'ページが見つかりません',
    500: 'サーバーエラー',
    503: 'サービス利用不可'
  }

  const defaultMessages: Record<number, string> = {
    400: 'リクエストに問題があります。もう一度お試しください。',
    401: 'このページを表示するにはログインが必要です。',
    403: 'このページへのアクセス権限がありません。',
    404: 'お探しのページは存在しないか、移動した可能性があります。',
    500: 'サーバーで問題が発生しました。しばらくしてからもう一度お試しください。',
    503: '現在メンテナンス中です。しばらくしてからもう一度お試しください。'
  }

  const displayTitle = title || defaultTitles[statusCode] || 'エラー'
  const displayMessage = message || defaultMessages[statusCode] || 'エラーが発生しました。'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-200">{statusCode}</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {displayTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {displayMessage}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/"
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="h-4 w-4 mr-2" />
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
