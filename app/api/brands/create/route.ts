import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brandName, companyName, about, website, contactInfo } = body

    // Validate required fields
    if (!brandName || !companyName) {
      return new Response(JSON.stringify({ error: 'Brand name and company name are required' }), { status: 400 })
    }

    // Create company and brand in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company first
      const company = await tx.company.create({
        data: {
          name: companyName,
          subscriptionStatus: 'UNPAID'
        }
      })

      // Create brand for the company
      const brand = await tx.brand.create({
        data: {
          name: brandName,
          about: about || null,
          website: website || null,
          contactInfo: contactInfo || null,
          companyId: company.id
        }
      })

      return { company, brand }
    })

    return new Response(JSON.stringify({ 
      success: true, 
      brand: result.brand,
      company: result.company
    }), { status: 201 })

  } catch (error) {
    console.error('Brand creation error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create brand. Please try again.' }),
      { status: 500 }
    )
  }
}
