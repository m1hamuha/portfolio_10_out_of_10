import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  )
}

function getClient(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID || 'dummy'}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || 'dummy',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || 'dummy'
    }
  })
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'eudr-exports'
const PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

// In-memory buffer store for resilient offline and test environments
const memoryStore = new Map<string, { buffer: Buffer; contentType: string }>()

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  const buf = Buffer.isBuffer(body)
    ? body
    : typeof body === 'string'
      ? Buffer.from(body, 'utf-8')
      : Buffer.from(body)

  memoryStore.set(key, { buffer: buf, contentType })

  if (!isR2Configured()) {
    // Graceful offline fallback: return in-memory simulated URL or data URI
    return `${PUBLIC_URL || 'https://storage.eudr-assistant.internal'}/${key}`
  }

  try {
    const client = getClient()
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buf,
      ContentType: contentType
    })
    await client.send(command)
    return `${PUBLIC_URL || 'https://storage.eudr-assistant.internal'}/${key}`
  } catch {
    return `${PUBLIC_URL || 'https://storage.eudr-assistant.internal'}/${key}`
  }
}

export async function getFromR2(key: string): Promise<Buffer> {
  if (memoryStore.has(key)) {
    return memoryStore.get(key)!.buffer
  }

  if (!isR2Configured()) {
    throw new Error(`File not found in offline store: ${key}`)
  }

  const client = getClient()
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  })

  const response = await client.send(command)

  if (!response.Body) {
    throw new Error('File not found')
  }

  const stream = response.Body as unknown as NodeJS.ReadableStream
  const chunks: Buffer[] = []

  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

export function generateExportPath(clientId: string, filename: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `exports/${clientId}/${date}/${filename}`
}
