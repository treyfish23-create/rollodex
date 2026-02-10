'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Brand {
  id: string
  name: string
  about?: string
  website?: string
  contactInfo?: string
  company: {
    name: string
  }
  assets: any[]
  createdAt: string
}

export default function BrowseBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands/browse')
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands)
      } else {
        setError('Failed to load brands')
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error)
      setError('Something went wrong loading brands')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cannabis brands...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌿 Cannabis Brand Directory
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Explore cannabis brands in the ROLLodx database
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Create Your Brand
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-300 text-red-700 rounded text-center">
            {error}
          </div>
        )}

        {/* Brands Grid */}
        {brands.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {brands.map((brand) => (
              <div key={brand.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{brand.name}</h3>
                  <span className="text-sm text-gray-500">
                    {brand.assets.length} assets
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">
                  Company: {brand.company.name}
                </p>

                {brand.about && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {brand.about}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  {brand.website && (
                    <a 
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      Visit Website →
                    </a>
                  )}
                  
                  <button
                    onClick={() => router.push(`/brand?id=${brand.id}`)}
                    className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
                  >
                    View Brand
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Created {new Date(brand.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-bold text-gray-900 mb-4">No brands yet!</h3>
            <p className="text-gray-600 mb-8">Be the first to add your cannabis brand to ROLLodx</p>
            <button
              onClick={() => router.push('/')}
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Create First Brand
            </button>
          </div>
        )}

        {/* Stats */}
        {brands.length > 0 && (
          <div className="mt-16 text-center">
            <div className="bg-white rounded-xl p-8 shadow-lg max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{brands.length}</h3>
              <p className="text-gray-600">Cannabis brands in database</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
