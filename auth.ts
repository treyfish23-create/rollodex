import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { prisma } from './db'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

export interface JWTPayload {
  userId: string
  companyId: string
  role: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export async function getAuthUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null

    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        company: {
          include: {
            brand: true
          }
        }
      }
    })

    return user
  } catch (error) {
    return null
  }
}

export function createAuthResponse(user: any, token: string) {
  const response = new Response(
    JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company
      }
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `auth-token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
      }
    }
  )
  
  return response
}

export function createLogoutResponse() {
  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
      }
    }
  )
}
