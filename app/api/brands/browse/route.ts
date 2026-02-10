import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get all brands with basic info (no auth required)
    const brands = await prisma.brand.findMany({
      include: {
        company: {
          select: {
            name: true
          }
        },
        assets: {
          select: {
            id: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return new Response(JSON.stringify({ brands }), { status: 200 })
  } catch (error) {
    console.error('Browse brands error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to load brands' }),
      { status: 500 }
    )
  }
}
