import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { AdminUser } from '@prisma/client'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createJWT(payload: { userId: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function getSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-token')

  if (!token) return null

  const payload = await verifyJWT(token.value)
  if (!payload) return null

  const user = await prisma.adminUser.findUnique({
    where: { id: payload.userId }
  })

  return user
}

export async function requireAuth(): Promise<AdminUser> {
  const user = await getSession()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function login(email: string, password: string): Promise<string | null> {
  const user = await prisma.adminUser.findUnique({
    where: { email }
  })

  if (!user || !user.isActive) return null

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) return null

  const token = await createJWT({ userId: user.id, email: user.email })
  return token
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin-token')
}
