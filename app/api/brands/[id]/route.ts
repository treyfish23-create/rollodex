import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AccessRequest } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const brandId = params.id

    // Get brand with all details
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            subscriptionStatus: true
          }
        },
        assets: {
          orderBy: { createdAt: 'desc' }
        },
        receivedAccessRequests: {
          where: {
            requesterCompanyId: user.companyId
          }
        }
      }
    })

    if (!brand) {
      return new Response(JSON.stringify({ error: 'Brand not found' }), { status: 404 })
    }

    // Check if this is user's own brand
    const isOwnBrand = brand.companyId === user.companyId

    // Check access permissions
    const hasAccess = isOwnBrand || 
      brand.receivedAccessRequests.some((req: AccessRequest) => req.status === 'APPROVED')

    if (!hasAccess && !isOwnBrand) {
      // Return limited info if no access
      return new Response(JSON.stringify({
        brand: {
          id: brand.id,
          name: brand.name,
          about: brand.about,
          website: brand.website,
          company: brand.company,
          hasAccess: false,
          accessStatus: brand.receivedAccessRequests[0]?.status || null
        }
      }), { status: 200 })
    }

    // Get user's notes for this brand
    const notes = await prisma.note.findMany({
      where: {
        brandId: brandId,
        companyId: user.companyId
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Return full brand data
    return new Response(JSON.stringify({
      brand: {
        ...brand,
        hasAccess: true,
        accessStatus: brand.receivedAccessRequests[0]?.status || 'APPROVED',
        accessType: brand.receivedAccessRequests[0]?.accessType || 'FULL',
        isOwnBrand
      },
      notes
    }), { status: 200 })

  } catch (error) {
    console.error('Get brand error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
