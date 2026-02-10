import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateToken, createAuthResponse } from '@/lib/auth'
import { createStripeCustomer } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, companyName } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !companyName) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create company and user in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
        }
      })

      // Create master user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'MASTER',
          companyId: company.id,
        },
        include: {
          company: {
            include: {
              brand: true
            }
          }
        }
      })

      // Create brand for the company
      const brand = await tx.brand.create({
        data: {
          name: companyName,
          companyId: company.id,
        }
      })

      return { user, company, brand }
    })

    // Create Stripe customer
    try {
      await createStripeCustomer(email, `${firstName} ${lastName}`, result.company.id)
    } catch (stripeError) {
      console.error('Failed to create Stripe customer:', stripeError)
      // Continue - Stripe customer creation is not critical for signup
    }

    // Generate JWT token
    const token = generateToken({
      userId: result.user.id,
      companyId: result.user.companyId,
      role: result.user.role,
      email: result.user.email,
    })

    return createAuthResponse(result.user, token)

  } catch (error) {
    console.error('Signup error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}
