import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// GET - Get team members
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const users = await prisma.user.findMany({
      where: {
        companyId: user.companyId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return new Response(JSON.stringify({ users }), { status: 200 })

  } catch (error) {
    console.error('Get team error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

// POST - Add team member (only MASTER can do this)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    if (user.role !== 'MASTER') {
      return new Response(JSON.stringify({ error: 'Only master users can add team members' }), { status: 403 })
    }

    const body = await request.json()
    const { email, password, firstName, lastName } = body

    if (!email || !password || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new team member
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'USER',
        companyId: user.companyId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    })

    return new Response(JSON.stringify({ user: newUser }), { status: 201 })

  } catch (error) {
    console.error('Add team member error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

// DELETE - Remove team member (only MASTER can do this)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    if (user.role !== 'MASTER') {
      return new Response(JSON.stringify({ error: 'Only master users can remove team members' }), { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 })
    }

    // Prevent master from deleting themselves
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400 }
      )
    }

    // Get the user to delete and verify they're in the same company
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!userToDelete) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
    }

    if (userToDelete.companyId !== user.companyId) {
      return new Response(JSON.stringify({ error: 'User not in your company' }), { status: 403 })
    }

    if (userToDelete.role === 'MASTER') {
      return new Response(
        JSON.stringify({ error: 'Cannot delete master user' }),
        { status: 400 }
      )
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (error) {
    console.error('Remove team member error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
