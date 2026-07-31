import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ai-providers';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, mode, technology } = await req.json();

    // Ensure session exists
    await prisma.session.upsert({
      where: { sessionId },
      update: { updatedAt: new Date() },
      create: {
        sessionId,
        userId: 'default-user',
        mode,
        technology,
      },
    });

    // Save user message
    await prisma.message.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
      },
    });

    // Generate AI response
    const response = await generateResponse(message, mode, technology, sessionId);

    // Save assistant message
    await prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        content: response.content,
        metadata: response.metadata,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}