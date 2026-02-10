import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const whereClause: any = {
      recipientId: user.id
    }

    if (unreadOnly) {
      whereClause.read = false
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 notifications
    })

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: user.id,
        read: false
      }
    })

    return new Response(JSON.stringify({ 
      notifications, 
      unreadCount 
    }), { status: 200 })

  } catch (error) {
    console.error('Get notifications error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}

// PUT - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const body = await request.json()
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          recipientId: user.id,
          read: false
        },
        data: {
          read: true
        }
      })
    } else if (notificationId) {
      // Mark specific notification as read
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          recipientId: user.id
        },
        data: {
          read: true
        }
      })
    } else {
      return new Response(
        JSON.stringify({ error: 'Either notificationId or markAllRead is required' }),
        { status: 400 }
      )
    }

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: user.id,
        read: false
      }
    })

    return new Response(JSON.stringify({ 
      success: true, 
      unreadCount 
    }), { status: 200 })

  } catch (error) {
    console.error('Update notification error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
