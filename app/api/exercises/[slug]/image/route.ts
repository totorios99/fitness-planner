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

  const frame = Math.max(0, Math.min(2, Number(form.get('frame') ?? 0) || 0))

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const dir = path.join(process.cwd(), 'public', 'exercises')
  await fs.mkdir(dir, { recursive: true })

  // frame 0 keeps the legacy {slug}.webp name; extra frames are {slug}-{frame}.webp
  const fileName = frame === 0 ? `${slug}.webp` : `${slug}-${frame}.webp`
  const outPath = path.join(dir, fileName)
  await sharp(buffer)
    .resize(480, 360, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile(outPath)

  // cache-bust so a replaced frame repaints immediately
  const url = `/exercises/${fileName}?v=${Date.now()}`

  const exercise = await prisma.exercise.findUnique({ where: { slug }, select: { images: true } })
  let images: (string | null)[] = []
  try { images = JSON.parse(exercise?.images ?? '[]') } catch { images = [] }
  while (images.length <= frame) images.push(null)
  images[frame] = url

  await prisma.exercise.update({
    where: { slug },
    data: {
      images: JSON.stringify(images),
      ...(frame === 0 ? { imagePath: url } : {}),
    },
  })

  return Response.json({ images })
}
