// app/api/analyze-market/messages/route.ts

import { prisma } from '@/db/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers';
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
 const session = await auth.api.getSession({
    headers: await headers()
  });
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { conversationId, message, markets } = await req.json()

    let conversation

    // CRITICAL: If conversationId exists, use it. Don't create a new one!
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      })
      
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
    } else {
      // Only create NEW conversation if conversationId is null/undefined
      conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          title: message.content.substring(0, 100)
        }
      })
    }

    // Save message to the SAME conversation
    const savedMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        type: message.type,
        content: message.content,
        images: message.images || [],
        completed: message.completed ?? true,
        marketData: markets ? { markets } : undefined
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    })
    console.log('savedMessage:', savedMessage);

    return NextResponse.json({
      success: true,
      message: savedMessage,
      conversationId: conversation.id // Always return the SAME conversation ID
    })
    
  } catch (error) {
    console.error('Error saving message:', error)
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    )
  }
}