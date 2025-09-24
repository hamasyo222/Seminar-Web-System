import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export type ApiError = {
  error: string
  errors?: any
  code?: string
}

export type ApiSuccess<T = any> = {
  success: true
  data?: T
  message?: string
  meta?: any
}

// 成功レスポンス
export function successResponse<T = any>(
  data?: T,
  message?: string,
  meta?: any,
  status = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    meta
  }, { status })
}

// エラーレスポンス
export function errorResponse(
  error: string,
  status = 400,
  errors?: any,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json({
    error,
    errors,
    code
  }, { status })
}

// 共通エラーハンドラー
export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error('API Error:', error)

  // Zodバリデーションエラー
  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors
    return errorResponse(
      'バリデーションエラー',
      400,
      fieldErrors,
      'VALIDATION_ERROR'
    )
  }

  // Prismaエラー
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return errorResponse(
          '重複エラー: 既に存在するデータです',
          409,
          { field: error.meta?.target },
          'DUPLICATE_ERROR'
        )
      case 'P2025':
        return errorResponse(
          'データが見つかりません',
          404,
          undefined,
          'NOT_FOUND'
        )
      case 'P2003':
        return errorResponse(
          '外部キー制約エラー',
          409,
          { field: error.meta?.field_name },
          'FOREIGN_KEY_ERROR'
        )
      default:
        return errorResponse(
          'データベースエラーが発生しました',
          500,
          { code: error.code },
          'DATABASE_ERROR'
        )
    }
  }

  // 認証エラー
  if (error instanceof Error && error.message === 'Unauthorized') {
    return errorResponse(
      '認証が必要です',
      401,
      undefined,
      'UNAUTHORIZED'
    )
  }

  // 権限エラー
  if (error instanceof Error && error.message === 'Forbidden') {
    return errorResponse(
      '権限がありません',
      403,
      undefined,
      'FORBIDDEN'
    )
  }

  // その他のエラー
  if (error instanceof Error) {
    return errorResponse(
      error.message || 'エラーが発生しました',
      500,
      undefined,
      'INTERNAL_ERROR'
    )
  }

  return errorResponse(
    '予期しないエラーが発生しました',
    500,
    undefined,
    'UNKNOWN_ERROR'
  )
}

// ページネーションヘルパー
export interface PaginationParams {
  page?: number
  limit?: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const orderBy = searchParams.get('orderBy') || 'createdAt'
  const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

  return { page, limit, orderBy, order }
}

export function getPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit)
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}
