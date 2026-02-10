import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Create note
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const body = await request.json()
    const { brandId, content } = body

    if (!brandId || !content) {
      return new Response(
        JSON.stringify({ error: 'Brand ID and content are required' }),
        { status: 400 }
      )
    }

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId }
    })

    if (!brand) {
      return new Response(JSON.stringify({ error: 'Brand not found' }), { status: 404 })
    }

    // Create note
    const note = await prisma.note.create({
      data: {
        content,
        brandId,
        companyId: user.companyId,
        authorId: user.id
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return new Response(JSON.stringify({ note }), { status: 201 })

  } catch (error) {
    console.error('Create note error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

// GET - Get notes for a brand
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')

    if (!brandId) {
      return new Response(JSON.stringify({ error: 'Brand ID is required' }), { status: 400 })
    }

    // Get notes for this brand from user's company
    const notes = await prisma.note.findMany({
      where: {
        brandId,
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

    return new Response(JSON.stringify({ notes }), { status: 200 })

  } catch (error) {
    console.error('Get notes error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

// DELETE - Delete note
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('id')

    if (!noteId) {
      return new Response(JSON.stringify({ error: 'Note ID is required' }), { status: 400 })
    }

    // Get note and verify ownership
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    })

    if (!note) {
      return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 })
    }

    // Only allow author or master to delete
    if (note.authorId !== user.id && user.role !== 'MASTER') {
      return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 })
    }

    // Delete note
    await prisma.note.delete({
      where: { id: noteId }
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (error) {
    console.error('Delete note error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
