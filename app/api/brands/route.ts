import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    // Get user's own brand
    const brand = await prisma.brand.findUnique({
      where: { companyId: user.companyId },
      include: {
        assets: {
          orderBy: { createdAt: 'desc' }
        },
        company: {
          select: {
            name: true,
            subscriptionStatus: true
          }
        }
      }
    })

    if (!brand) {
      return new Response(JSON.stringify({ error: 'Brand not found' }), { status: 404 })
    }

    return new Response(JSON.stringify({ brand }), { status: 200 })
  } catch (error) {
    console.error('Get brand error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const body = await request.json()
    const { name, about, website, contactInfo, socialLinks } = body

    // Validate required fields
    if (!name) {
      return new Response(JSON.stringify({ error: 'Brand name is required' }), { status: 400 })
    }

    // Update brand
    const brand = await prisma.brand.update({
      where: { companyId: user.companyId },
      data: {
        name,
        about,
        website,
        contactInfo,
        socialLinks: socialLinks || {}
      },
      include: {
        assets: {
          orderBy: { createdAt: 'desc' }
        },
        company: {
          select: {
            name: true,
            subscriptionStatus: true
          }
        }
      }
    })

    return new Response(JSON.stringify({ brand }), { status: 200 })
  } catch (error) {
    console.error('Update brand error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
