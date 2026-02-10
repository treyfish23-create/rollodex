'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  PlusIcon, 
  TrashIcon,
  EyeIcon,
  PencilIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { AuthProvider } from '@/components/AuthProvider'
import DashboardLayout from '@/components/DashboardLayout'

interface Brand {
  id: string
  name: string
  about?: string
  website?: string
  contactInfo?: string
  socialLinks?: any
  assets: Asset[]
  company: {
    subscriptionStatus: string
  }
}

interface Asset {
  id: string
  originalName: string
  filename: string
  fileType: string
  size: number
  category: string
  productName?: string
  description?: string
  tags: string[]
  createdAt: string
}

function BrandContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'info'
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Form states
  const [brandForm, setBrandForm] = useState({
    name: '',
    about: '',
    website: '',
    contactInfo: '',
    socialLinks: {
      instagram: '',
      linkedin: '',
      twitter: '',
      facebook: ''
    }
  })

  useEffect(() => {
    fetchBrand()
  }, [])

  useEffect(() => {
    if (brand) {
      setBrandForm({
        name: brand.name || '',
        about: brand.about || '',
        website: brand.website || '',
        contactInfo: brand.contactInfo || '',
        socialLinks: {
          instagram: brand.socialLinks?.instagram || '',
          linkedin: brand.socialLinks?.linkedin || '',
          twitter: brand.socialLinks?.twitter || '',
          facebook: brand.socialLinks?.facebook || ''
        }
      })
    }
  }, [brand])

  const fetchBrand = async () => {
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrand(data.brand)
      }
    } catch (error) {
      console.error('Failed to fetch brand:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const response = await fetch('/api/brands', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brandForm),
      })

      if (response.ok) {
        const data = await response.json()
        setBrand(data.brand)
        // Show success message
      }
    } catch (error) {
      console.error('Failed to update brand:', error)
    } finally {
      setUpdating(false)
    }
  }

  const deleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const response = await fetch(`/api/upload?id=${assetId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setBrand(prev => prev ? {
          ...prev,
          assets: prev.assets.filter(asset => asset.id !== assetId)
        } : null)
      }
    } catch (error) {
      console.error('Failed to delete asset:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Failed to load brand data</div>
      </div>
    )
  }

  const isSubscribed = brand.company.subscriptionStatus === 'ACTIVE'

  const tabs = [
    { id: 'info', name: 'Brand Info', count: null },
    { id: 'assets', name: 'Assets', count: brand.assets.length },
    { id: 'upload', name: 'Upload', count: null, disabled: !isSubscribed },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Brand</h1>
          <p className="text-gray-600">Manage your brand profile and assets</p>
        </div>
      </div>

      {/* Subscription Warning */}
      {!isSubscribed && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-orange-800">
            <strong>Subscription required:</strong> Upgrade to upload assets and manage your brand profile.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600'
                  : tab.disabled
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              {tab.name}
              {tab.count !== null && (
                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-brand-100 text-brand-600'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="max-w-2xl">
          <form onSubmit={updateBrand} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Brand Name</label>
              <input
                type="text"
                value={brandForm.name}
                onChange={(e) => setBrandForm(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">About</label>
              <textarea
                value={brandForm.about}
                onChange={(e) => setBrandForm(prev => ({ ...prev, about: e.target.value }))}
                rows={4}
                className="mt-1 input-field"
                placeholder="Tell other companies about your brand..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                value={brandForm.website}
                onChange={(e) => setBrandForm(prev => ({ ...prev, website: e.target.value }))}
                className="mt-1 input-field"
                placeholder="https://yourbrand.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Information</label>
              <textarea
                value={brandForm.contactInfo}
                onChange={(e) => setBrandForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                rows={3}
                className="mt-1 input-field"
                placeholder="Email, phone, or other contact details..."
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Social Links</label>
              <div className="space-y-3">
                {Object.entries(brandForm.socialLinks).map(([platform, value]) => (
                  <div key={platform}>
                    <label className="block text-xs font-medium text-gray-600 capitalize mb-1">
                      {platform}
                    </label>
                    <input
                      type="url"
                      value={value}
                      onChange={(e) => setBrandForm(prev => ({
                        ...prev,
                        socialLinks: {
                          ...prev.socialLinks,
                          [platform]: e.target.value
                        }
                      }))}
                      className="input-field"
                      placeholder={`https://${platform}.com/yourbrand`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={updating || !isSubscribed}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'assets' && (
        <AssetGrid assets={brand.assets} onDelete={deleteAsset} />
      )}

      {activeTab === 'upload' && isSubscribed && (
        <UploadForm onUploadSuccess={fetchBrand} />
      )}
    </div>
  )
}

function AssetGrid({ assets, onDelete }: { assets: Asset[], onDelete: (id: string) => void }) {
  const [filter, setFilter] = useState('all')

  const filteredAssets = assets.filter(asset => 
    filter === 'all' || asset.category === filter.toUpperCase()
  )

  const categories = [
    { id: 'all', name: 'All Assets', count: assets.length },
    { id: 'logo', name: 'Logos', count: assets.filter(a => a.category === 'LOGO').length },
    { id: 'product', name: 'Products', count: assets.filter(a => a.category === 'PRODUCT').length },
    { id: 'campaign', name: 'Campaigns', count: assets.filter(a => a.category === 'CAMPAIGN').length },
  ]

  return (
    <div>
      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilter(category.id)}
              className={`${
                filter === category.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              {category.name}
              <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs ${
                filter === category.id
                  ? 'bg-brand-100 text-brand-600'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {category.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Upload your first asset to get started.' 
              : `No ${filter} assets found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <div key={asset.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg mb-4">
                {asset.fileType.startsWith('image/') ? (
                  <img
                    src={`/api/assets/${asset.filename}`}
                    alt={asset.originalName}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                    <PhotoIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {asset.productName || asset.originalName}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {asset.category} • {(asset.size / 1024 / 1024).toFixed(1)}MB
                </p>
                {asset.description && (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {asset.description}
                  </p>
                )}
                {asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {asset.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{asset.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="text-xs text-gray-500">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </span>
                <div className="flex space-x-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(asset.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UploadForm({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    category: 'LOGO',
    productName: '',
    description: '',
    tags: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement
    const file = fileInput.files?.[0]

    if (!file) return

    setUploading(true)

    const uploadData = new FormData()
    uploadData.append('file', file)
    uploadData.append('category', formData.category)
    uploadData.append('productName', formData.productName)
    uploadData.append('description', formData.description)
    uploadData.append('tags', formData.tags)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      })

      if (response.ok) {
        setFormData({
          category: 'LOGO',
          productName: '',
          description: '',
          tags: ''
        })
        form.reset()
        onUploadSuccess()
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">File</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.svg,.pdf,.ai"
            required
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Supported: JPG, PNG, SVG, PDF, AI (max 10MB)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="mt-1 input-field"
          >
            <option value="LOGO">Logo</option>
            <option value="PRODUCT">Product</option>
            <option value="CAMPAIGN">Campaign</option>
          </select>
        </div>

        {formData.category === 'PRODUCT' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
              className="mt-1 input-field"
              placeholder="e.g., Blue Dream Vape Cartridge"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="mt-1 input-field"
            placeholder="Describe this asset..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            className="mt-1 input-field"
            placeholder="e.g., vape, cartridge, blue-dream (comma separated)"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Asset'}
        </button>
      </form>
    </div>
  )
}

export default function BrandPage() {
  return (
    <AuthProvider>
      <DashboardLayout>
        <BrandContent />
      </DashboardLayout>
    </AuthProvider>
  )
}
