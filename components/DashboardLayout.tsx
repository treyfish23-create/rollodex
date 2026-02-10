'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Bars3Icon, 
  XMarkIcon, 
  BellIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CreditCardIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/components/AuthProvider'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'My Brand', href: '/brand', icon: BuildingOfficeIcon },
  { name: 'Search Brands', href: '/search', icon: MagnifyingGlassIcon },
  { name: 'Access Requests', href: '/access', icon: UsersIcon },
  { name: 'Team', href: '/team', icon: UsersIcon },
  { name: 'Billing', href: '/billing', icon: CreditCardIcon },
]

interface Notification {
  id: string
  title: string
  content: string
  read: boolean
  createdAt: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    } else {
      fetchNotifications()
    }
  }, [user, router])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (notificationId?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          markAllRead: !notificationId
        }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 flex z-40 md:hidden`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navigation={navigation} pathname={pathname} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <SidebarContent navigation={navigation} pathname={pathname} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1" />
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAsRead()}
                            className="text-sm text-brand-600 hover:text-brand-700"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-gray-500 text-center">No notifications</div>
                      ) : (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? 'bg-brand-50' : ''
                            }`}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-brand-600 rounded-full ml-2" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-right">
                    <p className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-gray-500">{user.company.name}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                    title="Logout"
                  >
                    <Cog6ToothIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ navigation, pathname }: { navigation: any[], pathname: string }) {
  return (
    <>
      <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-brand-600">ROLLodex</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? 'bg-brand-100 border-brand-600 text-brand-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors duration-200`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-5 w-5`}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
