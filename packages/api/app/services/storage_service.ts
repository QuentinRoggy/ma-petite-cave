import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import env from '#start/env'

const s3 = new S3Client({
  region: 'auto',
  endpoint: env.get('R2_ENDPOINT'),
  credentials: {
    accessKeyId: env.get('R2_ACCESS_KEY_ID'),
    secretAccessKey: env.get('R2_SECRET_ACCESS_KEY'),
  },
})

export default class StorageService {
  async uploadWinePhoto(file: {
    tmpPath: string
    extname: string
  }): Promise<string> {
    const key = `wines/${randomUUID()}.${file.extname}`
    const body = await readFile(file.tmpPath)

    await s3.send(
      new PutObjectCommand({
        Bucket: env.get('R2_BUCKET'),
        Key: key,
        Body: body,
        ContentType: `image/${file.extname}`,
      })
    )

    return `${env.get('R2_PUBLIC_URL')}/${key}`
  }
}
