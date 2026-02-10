import { NextRequest } from 'next/server'
import { stripe, handleSubscriptionUpdate, handleInvoicePayment } from '@/lib/stripe'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionUpdate(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePayment(event.data.object)
        break

      case 'invoice.payment_failed':
        // Handle failed payment - could send email notification
        console.log('Payment failed for invoice:', event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response('Webhook received', { status: 200 })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response('Webhook handler failed', { status: 500 })
  }
}
