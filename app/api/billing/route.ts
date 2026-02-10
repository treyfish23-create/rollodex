import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe, createCheckoutSession, createCustomerPortalSession } from '@/lib/stripe'

// POST - Create checkout session or customer portal session
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const body = await request.json()
    const { action, additionalUsers } = body

    if (action === 'create-checkout') {
      // Create checkout session for new subscription
      if (!user.company.stripeCustomerId) {
        return new Response(
          JSON.stringify({ error: 'Stripe customer not found' }),
          { status: 400 }
        )
      }

      const session = await createCheckoutSession(
        user.company.stripeCustomerId,
        user.companyId,
        additionalUsers || 0
      )

      return new Response(JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }), { status: 200 })

    } else if (action === 'create-portal') {
      // Create customer portal session for managing existing subscription
      if (!user.company.stripeCustomerId) {
        return new Response(
          JSON.stringify({ error: 'No subscription found' }),
          { status: 400 }
        )
      }

      const session = await createCustomerPortalSession(user.company.stripeCustomerId)

      return new Response(JSON.stringify({ 
        url: session.url 
      }), { status: 200 })

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Billing error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

// GET - Get billing status
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })

    if (!company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), { status: 404 })
    }

    let subscription = null
    if (company.stripeSubscriptionId) {
      try {
        subscription = await stripe.subscriptions.retrieve(company.stripeSubscriptionId)
      } catch (error) {
        console.error('Failed to retrieve subscription:', error)
      }
    }

    return new Response(JSON.stringify({
      company: {
        id: company.id,
        name: company.name,
        subscriptionStatus: company.subscriptionStatus,
        subscriptionEndsAt: company.subscriptionEndsAt,
        userCount: company.users.length,
        users: company.users
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        currentPeriodStart: subscription.current_period_start,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      } : null
    }), { status: 200 })

  } catch (error) {
    console.error('Get billing status error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
