import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile, generateFileKey, isValidFileType, getFileSizeLimit } from '@/lib/upload'
import { notifyNewAssets } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    // Check subscription status
    if (user.company.subscriptionStatus !== 'ACTIVE') {
      return new Response(
        JSON.stringify({ error: 'Active subscription required to upload assets' }),
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string
    const productName = formData.get('productName') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string

    if (!file || !category) {
      return new Response(
        JSON.stringify({ error: 'File and category are required' }),
        { status: 400 }
      )
    }

    // Validate file type
    if (!isValidFileType(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Supported: JPG, PNG, SVG, PDF, AI' }),
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > getFileSizeLimit()) {
      return new Response(
        JSON.stringify({ error: 'File size must be less than 10MB' }),
        { status: 400 }
      )
    }

    // Get user's brand
    const brand = await prisma.brand.findUnique({
      where: { companyId: user.companyId }
    })

    if (!brand) {
      return new Response(
        JSON.stringify({ error: 'Brand not found' }),
        { status: 404 }
      )
    }

    // Upload file to S3
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileKey = generateFileKey(user.companyId, category.toLowerCase(), file.name)
    
    await uploadFile(fileBuffer, fileKey, file.type)

    // Parse tags
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : []

    // Save asset to database
    const asset = await prisma.asset.create({
      data: {
        filename: fileKey,
        originalName: file.name,
        fileType: file.type,
        size: file.size,
        category: category as any,
        productName: category === 'PRODUCT' ? productName : null,
        description,
        tags: tagArray,
        brandId: brand.id,
      }
    })

    // Notify companies with access to this brand
    await notifyNewAssets(brand.id, 1)

    return new Response(JSON.stringify({ asset }), { status: 201 })

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to upload file' }),
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('id')

    if (!assetId) {
      return new Response(JSON.stringify({ error: 'Asset ID required' }), { status: 400 })
    }

    // Get asset and verify ownership
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        brand: {
          include: {
            company: true
          }
        }
      }
    })

    if (!asset) {
      return new Response(JSON.stringify({ error: 'Asset not found' }), { status: 404 })
    }

    if (asset.brand.companyId !== user.companyId) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403 })
    }

    // Delete from S3 (optional - you might want to keep files for recovery)
    // await deleteFile(asset.filename)

    // Delete from database
    await prisma.asset.delete({
      where: { id: assetId }
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (error) {
    console.error('Delete asset error:', error)
    return new Response(JSON.stringify({ error: 'Failed to delete asset' }), { status: 500 })
  }
}
