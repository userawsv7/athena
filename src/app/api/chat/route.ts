import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ai-providers';
import { prisma } from '@/lib/prisma';
import { sessionStore } from '@/lib/session-store';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, mode, technology, apiKeys } = await req.json();

    // Try to use database, fall back to in-memory store if not available
    const useDatabase = !!process.env.DATABASE_URL;

    if (useDatabase) {
      // Database operations with error handling
      try {
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
      } catch (dbError: any) {
        console.warn('Database operation failed, using in-memory store:', dbError.message);
        // Fall back to in-memory store
        if (!sessionStore.exists(sessionId)) {
          sessionStore.create(sessionId, technology, mode);
        }
        sessionStore.addMessage(sessionId, 'user', message);
      }
    } else {
      // Use in-memory store
      if (!sessionStore.exists(sessionId)) {
        sessionStore.create(sessionId, technology, mode);
      }
      sessionStore.addMessage(sessionId, 'user', message);
    }

    // Generate AI response
    let response;
    try {
      response = await generateResponse(message, mode, technology, sessionId, apiKeys);
    } catch (aiError: any) {
      console.error('AI Provider error:', aiError);

      if (aiError.message.includes('No AI providers configured') || aiError.message.includes('At least 2 API providers')) {
        return NextResponse.json(
          {
            error: 'No AI providers available',
            details: aiError.message,
            action: 'Add at least 2 AI provider API keys via the settings modal',
            providers: 'Configure at least 2 providers from the modal'
          },
          { status: 503 }
        );
      }

      throw aiError;
    }

    // Save assistant message
    if (useDatabase) {
      try {
        await prisma.message.create({
          data: {
            sessionId,
            role: 'assistant',
            content: response.content,
            metadata: response.metadata,
          },
        });
      } catch {
        sessionStore.addMessage(sessionId, 'assistant', response.content);
      }
    } else {
      sessionStore.addMessage(sessionId, 'assistant', response.content);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Chat error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error.message || 'An unexpected error occurred',
        action: 'Please check your AI provider API keys are configured correctly'
      },
      { status: 500 }
    );
  }
}