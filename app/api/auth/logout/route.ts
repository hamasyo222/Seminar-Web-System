import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await logout()
  
  const response = NextResponse.redirect(new URL('/login', req.url))
  response.cookies.delete('admin-token')
  
  return response
}
