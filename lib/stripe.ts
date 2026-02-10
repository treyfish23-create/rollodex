import Stripe from 'stripe'
import { prisma } from './db'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const PRICE_IDS = {
  MONTHLY: process.env.STRIPE_MONTHLY_PRICE_ID!, // You'll need to create this in Stripe
  ADDITIONAL_USER: process.env.STRIPE_ADDITIONAL_USER_PRICE_ID!, // $5/month per user
}

export async function createStripeCustomer(
  email: string,
  name: string,
  companyId: string
) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      companyId,
    },
  })

  await prisma.company.update({
    where: { id: companyId },
    data: { stripeCustomerId: customer.id },
  })

  return customer
}

export async function createCheckoutSession(
  customerId: string,
  companyId: string,
  additionalUsers: number = 0
) {
  const lineItems = [
    {
      price: PRICE_IDS.MONTHLY,
      quantity: 1,
    },
  ]

  if (additionalUsers > 0) {
    lineItems.push({
      price: PRICE_IDS.ADDITIONAL_USER,
      quantity: additionalUsers,
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    metadata: {
      companyId,
    },
  })

  return session
}

export async function createCustomerPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  })

  return session
}

export async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const companyId = subscription.metadata.companyId

  if (!companyId) return

  const status = subscription.status === 'active' ? 'ACTIVE' : 
                 subscription.status === 'past_due' ? 'PAST_DUE' :
                 subscription.status === 'canceled' ? 'CANCELLED' : 'UNPAID'

  await prisma.company.update({
    where: { id: companyId },
    data: {
      subscriptionStatus: status,
      stripeSubscriptionId: subscription.id,
      subscriptionEndsAt: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000)
        : null,
    },
  })
}

export async function handleInvoicePayment(invoice: Stripe.Invoice) {
  if (invoice.subscription && typeof invoice.subscription === 'string') {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    await handleSubscriptionUpdate(subscription)
  }
}

export function isSubscriptionActive(company: any): boolean {
  return company.subscriptionStatus === 'ACTIVE'
}

export function getSubscriptionStatus(company: any): string {
  switch (company.subscriptionStatus) {
    case 'ACTIVE':
      return 'Active'
    case 'PAST_DUE':
      return 'Past Due'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return 'Unpaid'
  }
}
