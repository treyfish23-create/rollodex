'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlusIcon, 
  EyeIcon, 
  PhotoIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { AuthProvider } from '@/components/AuthProvider'
import DashboardLayout from '@/components/DashboardLayout'

interface DashboardData {
  brand: {
    id: string
    name: string
    assets: any[]
    company: {
      subscriptionStatus: string
    }
  }
  metrics: {
    totalAssets: number
    logoCount: number
    productCount: number
    campaignCount: number
    pendingRequests: number
    approvedAccess: number
  }
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [brandResponse, requestsResponse] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/access-requests?type=received')
      ])

      if (brandResponse.ok && requestsResponse.ok) {
        const brandData = await brandResponse.json()
        const requestsData = await requestsResponse.json()
        
        const assets = brandData.brand.assets
        const pendingRequests = requestsData.requests.filter(
          (req: any) => req.status === 'PENDING'
        ).length

        setData({
          brand: brandData.brand,
          metrics: {
            totalAssets: assets.length,
            logoCount: assets.filter((a: any) => a.category === 'LOGO').length,
            productCount: assets.filter((a: any) => a.category === 'PRODUCT').length,
            campaignCount: assets.filter((a: any) => a.category === 'CAMPAIGN').length,
            pendingRequests,
            approvedAccess: requestsData.requests.filter(
              (req: any) => req.status === 'APPROVED'
            ).length
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Failed to load dashboard data</div>
      </div>
    )
  }

  const isSubscribed = data.brand.company.subscriptionStatus === 'ACTIVE'

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back to {data.brand.name}</p>
        </div>
        
        {isSubscribed ? (
          <Link
            href="/brand?tab=upload"
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Assets
          </Link>
        ) : (
          <Link
            href="/billing"
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Upgrade to Add Assets
          </Link>
        )}
      </div>

      {/* Subscription Status Warning */}
      {!isSubscribed && (
        <div className="mb-8 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Subscription Required
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  Your subscription is {data.brand.company.subscriptionStatus.toLowerCase()}. 
                  You need an active subscription to upload assets and request access to other brands.
                </p>
              </div>
              <div className="mt-4">
                <Link
                  href="/billing"
                  className="text-sm bg-orange-100 text-orange-800 hover:bg-orange-200 px-3 py-1 rounded-md transition-colors duration-200"
                >
                  Manage Billing →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Assets"
          value={data.metrics.totalAssets}
          icon={PhotoIcon}
          color="bg-blue-500"
          href="/brand"
        />
        <MetricCard
          title="Logos"
          value={data.metrics.logoCount}
          icon={PhotoIcon}
          color="bg-green-500"
          href="/brand"
        />
        <MetricCard
          title="Products"
          value={data.metrics.productCount}
          icon={PhotoIcon}
          color="bg-purple-500"
          href="/brand"
        />
        <MetricCard
          title="Campaigns"
          value={data.metrics.campaignCount}
          icon={PhotoIcon}
          color="bg-orange-500"
          href="/brand"
        />
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assets */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Assets</h3>
          {data.brand.assets.length === 0 ? (
            <div className="text-center py-8">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assets</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first asset.
              </p>
              {isSubscribed && (
                <div className="mt-6">
                  <Link
                    href="/brand?tab=upload"
                    className="btn-primary inline-flex items-center text-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Upload Asset
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {data.brand.assets.slice(0, 5).map((asset: any) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {asset.originalName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {asset.category} • {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    asset.category === 'LOGO' ? 'bg-green-100 text-green-800' :
                    asset.category === 'PRODUCT' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {asset.category}
                  </span>
                </div>
              ))}
              {data.brand.assets.length > 5 && (
                <div className="text-center pt-3">
                  <Link
                    href="/brand"
                    className="text-sm text-brand-600 hover:text-brand-700"
                  >
                    View all assets →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Access Requests */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Access Overview</h3>
            <Link
              href="/access"
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              View all →
            </Link>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <UsersIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Pending Requests</p>
                  <p className="text-sm text-gray-500">Companies requesting access</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-yellow-600">
                {data.metrics.pendingRequests}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <EyeIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Approved Access</p>
                  <p className="text-sm text-gray-500">Companies with access</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {data.metrics.approvedAccess}
              </span>
            </div>
          </div>

          {data.metrics.pendingRequests > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Link
                href="/access"
                className="w-full btn-primary text-center block"
              >
                Review Requests
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  href 
}: { 
  title: string
  value: number
  icon: any
  color: string
  href: string
}) {
  return (
    <Link href={href} className="card hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${color} rounded-lg p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </AuthProvider>
  )
}
