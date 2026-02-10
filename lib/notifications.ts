import { prisma } from './db'

export async function createNotification(
  recipientId: string,
  type: string,
  title: string,
  content: string
) {
  return await prisma.notification.create({
    data: {
      recipientId,
      type,
      title,
      content,
    },
  })
}

export async function notifyAccessRequest(
  targetBrandId: string,
  requesterCompanyName: string
) {
  // Get all users from the target brand's company
  const brand = await prisma.brand.findUnique({
    where: { id: targetBrandId },
    include: {
      company: {
        include: {
          users: true,
        },
      },
    },
  })

  if (!brand) return

  const notifications = brand.company.users.map((user: any) => ({
    recipientId: user.id,
    type: 'ACCESS_REQUEST',
    title: 'New Access Request',
    content: `${requesterCompanyName} has requested access to your brand "${brand.name}"`,
  }))

  await prisma.notification.createMany({
    data: notifications,
  })
}

export async function notifyAccessApproved(
  requesterCompanyId: string,
  brandName: string
) {
  // Get all users from the requester company
  const company = await prisma.company.findUnique({
    where: { id: requesterCompanyId },
    include: {
      users: true,
    },
  })

  if (!company) return

  const notifications = company.users.map((user: any) => ({
    recipientId: user.id,
    type: 'ACCESS_APPROVED',
    title: 'Access Approved',
    content: `Your access request to "${brandName}" has been approved`,
  }))

  await prisma.notification.createMany({
    data: notifications,
  })
}

export async function notifyAccessDenied(
  requesterCompanyId: string,
  brandName: string
) {
  // Get all users from the requester company
  const company = await prisma.company.findUnique({
    where: { id: requesterCompanyId },
    include: {
      users: true,
    },
  })

  if (!company) return

  const notifications = company.users.map((user: any) => ({
    recipientId: user.id,
    type: 'ACCESS_DENIED',
    title: 'Access Denied',
    content: `Your access request to "${brandName}" has been denied`,
  }))

  await prisma.notification.createMany({
    data: notifications,
  })
}

export async function notifyNewAssets(
  brandId: string,
  assetCount: number
) {
  // Get all companies that have access to this brand
  const accessRequests = await prisma.accessRequest.findMany({
    where: {
      targetBrandId: brandId,
      status: 'APPROVED',
    },
    include: {
      requesterCompany: {
        include: {
          users: true,
        },
      },
    },
  })

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
  })

  if (!brand) return

  const allNotifications: any[] = []

  accessRequests.forEach((request: any) => {
    const notifications = request.requesterCompany.users.map((user: any) => ({
      recipientId: user.id,
      type: 'NEW_ASSETS',
      title: 'New Assets Available',
      content: `${assetCount} new asset${assetCount > 1 ? 's' : ''} ${assetCount > 1 ? 'have' : 'has'} been added to "${brand.name}"`,
    }))
    allNotifications.push(...notifications)
  })

  if (allNotifications.length > 0) {
    await prisma.notification.createMany({
      data: allNotifications,
    })
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  return await prisma.notification.updateMany({
    where: {
      id: notificationId,
      recipientId: userId,
    },
    data: {
      read: true,
    },
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      read: false,
    },
    data: {
      read: true,
    },
  })
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      recipientId: userId,
      read: false,
    },
  })
}
