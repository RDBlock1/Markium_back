// app/api/conversations/[id]/favorite/route.ts
import { prisma } from '@/db/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
 const session = await auth.api.getSession({
    headers: await headers()
  });
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure we support either params or Promise<params>
    const paramsResolved = await context.params
    const id = paramsResolved?.id
    if (!id) {
      return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 })
    }

    const body = await req.json()
    const { isFavorite } = body ?? {}

    // validate isFavorite is a boolean (optional)
    if (typeof isFavorite !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { isFavorite }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('PATCH /api/conversations/[id]/favorite error:', error)
    return NextResponse.json(
      { error: 'Failed to update favorite' },
      { status: 500 }
    )
  }
}
