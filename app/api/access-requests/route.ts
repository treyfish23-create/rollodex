import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notifyAccessRequest, notifyAccessApproved, notifyAccessDenied } from '@/lib/notifications'

// GET - Get access requests for user's company
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received'

    if (type === 'sent') {
      // Get access requests sent by user's company
      const requests = await prisma.accessRequest.findMany({
        where: {
          requesterCompanyId: user.companyId
        },
        include: {
          targetBrand: {
            include: {
              company: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return new Response(JSON.stringify({ requests }), { status: 200 })
    } else {
      // Get access requests received by user's company (default)
      const brand = await prisma.brand.findUnique({
        where: { companyId: user.companyId }
      })

      if (!brand) {
        return new Response(JSON.stringify({ requests: [] }), { status: 200 })
      }

      const requests = await prisma.accessRequest.findMany({
        where: {
          targetBrandId: brand.id
        },
        include: {
          requesterCompany: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return new Response(JSON.stringify({ requests }), { status: 200 })
    }
  } catch (error) {
    console.error('Get access requests error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

// POST - Create access request
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const body = await request.json()
    const { brandId, accessType, message } = body

    if (!brandId) {
      return new Response(JSON.stringify({ error: 'Brand ID is required' }), { status: 400 })
    }

    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        company: {
          select: {
            name: true
          }
        }
      }
    })

    if (!brand) {
      return new Response(JSON.stringify({ error: 'Brand not found' }), { status: 404 })
    }

    // Check if requesting access to own brand
    if (brand.companyId === user.companyId) {
      return new Response(
        JSON.stringify({ error: 'Cannot request access to your own brand' }),
        { status: 400 }
      )
    }

    // Check if request already exists
    const existingRequest = await prisma.accessRequest.findUnique({
      where: {
        requesterCompanyId_targetBrandId: {
          requesterCompanyId: user.companyId,
          targetBrandId: brandId
        }
      }
    })

    if (existingRequest) {
      return new Response(
        JSON.stringify({ error: 'Access request already exists' }),
        { status: 400 }
      )
    }

    // Create access request
    const accessRequest = await prisma.accessRequest.create({
      data: {
        requesterCompanyId: user.companyId,
        targetBrandId: brandId,
        accessType: accessType || 'FULL',
        message
      },
      include: {
        targetBrand: {
          include: {
            company: {
              select: {
                name: true
              }
            }
          }
        },
        requesterCompany: {
          select: {
            name: true
          }
        }
      }
    })

    // Notify target brand's users
    await notifyAccessRequest(brandId, user.company.name)

    return new Response(JSON.stringify({ accessRequest }), { status: 201 })

  } catch (error) {
    console.error('Create access request error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

// PUT - Update access request status
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const body = await request.json()
    const { requestId, status } = body

    if (!requestId || !status) {
      return new Response(
        JSON.stringify({ error: 'Request ID and status are required' }),
        { status: 400 }
      )
    }

    // Get the access request
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        targetBrand: {
          include: {
            company: true
          }
        },
        requesterCompany: {
          select: {
            name: true
          }
        }
      }
    })

    if (!accessRequest) {
      return new Response(JSON.stringify({ error: 'Access request not found' }), { status: 404 })
    }

    // Check if user has permission to update this request
    if (accessRequest.targetBrand.companyId !== user.companyId) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 })
    }

    // Update request status
    const updatedRequest = await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: status,
        approvedAt: status === 'APPROVED' ? new Date() : null
      }
    })

    // Send notifications
    if (status === 'APPROVED') {
      await notifyAccessApproved(
        accessRequest.requesterCompanyId,
        accessRequest.targetBrand.name
      )
    } else if (status === 'DENIED') {
      await notifyAccessDenied(
        accessRequest.requesterCompanyId,
        accessRequest.targetBrand.name
      )
    }

    return new Response(JSON.stringify({ accessRequest: updatedRequest }), { status: 200 })

  } catch (error) {
    console.error('Update access request error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
