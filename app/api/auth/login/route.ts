import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken, createAuthResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400 }
      )
    }

    // Find user with company and brand
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          include: {
            brand: true
          }
        }
      }
    })

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
    })

    return createAuthResponse(user, token)

  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}
