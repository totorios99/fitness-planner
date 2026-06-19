import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

export const dynamic = 'force-dynamic'

// Mobility demo video upload. Stores the raw file (no transcoding) at
// public/exercises/{slug}.mp4 and records videoPath. Played inline, muted, looping.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const form = await req.formData()
  const file = form.get('video') as File | null
  if (!file) return Response.json({ error: 'No video file' }, { status: 400 })
  if (!file.type.startsWith('video/')) return Response.json({ error: 'Must be a video file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const dir = path.join(process.cwd(), 'public', 'exercises')
  await fs.mkdir(dir, { recursive: true })

  const ext = file.type === 'video/webm' ? 'webm' : 'mp4'
  const fileName = `${slug}.${ext}`
  await fs.writeFile(path.join(dir, fileName), buffer)

  const url = `/exercises/${fileName}?v=${Date.now()}`
  await prisma.exercise.update({ where: { slug }, data: { videoPath: url } })

  return Response.json({ videoPath: url })
}
