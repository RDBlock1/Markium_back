// app/api/conversations/[id]/rename/route.ts
import { prisma } from '@/db/prisma'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure we support either params or Promise<params>
    const paramsResolved = await context.params
    const id = paramsResolved?.id
    if (!id) {
      return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 })
    }
    const params = await context.params
    const { title } = await req.json()

    const conversation = await prisma.conversation.update({
      where: { id: params.id },
      data: { title }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to rename' },
      { status: 500 }
    )
  }
}