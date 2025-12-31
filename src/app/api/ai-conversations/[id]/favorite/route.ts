// app/api/conversations/[id]/favorite/route.ts
import { prisma } from '@/db/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 👈 params is now a Promise
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params // 👈 await params
    if (!id) {
      return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 })
    }

    const body = await req.json()
    const { isFavorite } = body ?? {}

    if (typeof isFavorite !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { isFavorite },
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('PATCH /api/conversations/[id]/favorite error:', error)
    return NextResponse.json(
      { error: 'Failed to update favorite' },
      { status: 500 },
    )
  }
}