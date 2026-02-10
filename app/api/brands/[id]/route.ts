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
          company: {
            name: brand.company.name
          },
          assetCounts: {
            total: 0,
            logos: 0,
            products: 0,
            campaigns: 0
          }
        }
      }), { status: 200 })
    }

    // Calculate asset counts
    const assetCounts = {
      total: brand.assets.length,
      logos: brand.assets.filter(a => a.category === 'LOGO').length,
      products: brand.assets.filter(a => a.category === 'PRODUCT').length,
      campaigns: brand.assets.filter(a => a.category === 'CAMPAIGN').length,
    }

    // Return full brand data with access
    return new Response(JSON.stringify({
      brand: {
        id: brand.id,
        name: brand.name,
        about: brand.about,
        website: brand.website,
        contactEmail: brand.contactEmail,
        instagramHandle: brand.instagramHandle,
        twitterHandle: brand.twitterHandle,
        linkedinHandle: brand.linkedinHandle,
        company: brand.company,
        assets: brand.assets,
        assetCounts,
        hasAccess: true,
        accessType: brand.receivedAccessRequests.length > 0 
          ? brand.receivedAccessRequests[0].accessType 
          : 'FULL'
      }
    }), { status: 200 })
  } catch (error) {
    console.error('Get brand error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
