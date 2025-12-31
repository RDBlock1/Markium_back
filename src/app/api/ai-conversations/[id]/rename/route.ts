// app/api/conversations/[id]/rename/route.ts
import { prisma } from '@/db/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers';
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 params is now a Promise
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure we support either params or Promise<params>

    const { id } = await params // 👈 await params
    if (!id) {
      return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 })
    }
    const { title } = await req.json()

    const conversation = await prisma.conversation.update({
      where: { id: id },
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