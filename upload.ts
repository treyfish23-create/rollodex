import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET!

export async function uploadFile(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await s3Client.send(command)
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

export function generateFileKey(
  companyId: string,
  category: string,
  filename: string
): string {
  const timestamp = Date.now()
  const extension = filename.split('.').pop()
  return `${companyId}/${category}/${timestamp}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isValidImageType(contentType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(contentType)
}

export function isValidFileType(contentType: string): boolean {
  const validTypes = [
    'image/jpeg',
    'image/png', 
    'image/svg+xml',
    'image/webp',
    'application/pdf',
    'application/postscript', // .ai files
  ]
  return validTypes.includes(contentType)
}

export function getFileSizeLimit(): number {
  return 10 * 1024 * 1024 // 10MB
}
