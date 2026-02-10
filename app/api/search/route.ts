import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || 'all'

    // Build where clause
    const whereClause: any = {
      // Exclude user's own brand
      companyId: {
        not: user.companyId
      }
    }

    if (query) {
      whereClause.name = {
        contains: query,
        mode: 'insensitive'
      }
    }

    // Get brands with access status
    const brands = await prisma.brand.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            name: true,
            subscriptionStatus: true
          }
        },
        assets: {
          select: {
            id: true,
            category: true,
            createdAt: true
          }
        },
        receivedAccessRequests: {
          where: {
            requesterCompanyId: user.companyId
          },
          select: {
            status: true,
            accessType: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 50 // Limit results
    })

    // Transform results to include access status
    const brandsWithAccess = brands.map((brand: any) => ({
      id: brand.id,
      name: brand.name,
      about: brand.about,
      website: brand.website,
      company: brand.company,
      assetCounts: {
        total: brand.assets.length,
        logos: brand.assets.filter((a: any) => a.category === 'LOGO').length,
        products: brand.assets.filter((a: any) => a.category === 'PRODUCT').length,
        campaigns: brand.assets.filter((a: any) => a.category === 'CAMPAIGN').length,
      },
      lastUpdated: brand.assets.length > 0 
        ? Math.max(...brand.assets.map((a: any) => new Date(a.createdAt).getTime()))
        : new Date(brand.updatedAt).getTime(),
      accessStatus: brand.receivedAccessRequests.length > 0 
        ? brand.receivedAccessRequests[0].status 
        : null,
      accessType: brand.receivedAccessRequests.length > 0 
        ? brand.receivedAccessRequests[0].accessType 
        : null
    }))

    return new Response(JSON.stringify({ brands: brandsWithAccess }), { status: 200 })
  } catch (error) {
    console.error('Search brands error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
