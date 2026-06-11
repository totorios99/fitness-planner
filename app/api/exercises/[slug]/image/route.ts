import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const form = await req.formData()
  const file = form.get('image') as File | null
  if (!file) return Response.json({ error: 'No image file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const dir = path.join(process.cwd(), 'public', 'exercises')
  await fs.mkdir(dir, { recursive: true })

  const outPath = path.join(dir, `${slug}.webp`)
  await sharp(buffer)
    .resize(480, 360, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile(outPath)

  const imagePath = `/exercises/${slug}.webp`
  await prisma.exercise.update({ where: { slug }, data: { imagePath } })

  return Response.json({ imagePath })
}
