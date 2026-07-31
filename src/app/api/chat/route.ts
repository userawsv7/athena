import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ai-providers';
import { prisma } from '@/lib/prisma';
import { sessionStore } from '@/lib/session-store';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, mode, technology } = await req.json();

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
      response = await generateResponse(message, mode, technology, sessionId);
    } catch (aiError: any) {
      console.error('AI Provider error:', aiError);

      if (aiError.message.includes('All providers failed')) {
        return NextResponse.json(
          {
            error: 'No AI providers available',
            details: 'No API keys configured for AI providers',
            action: 'Add at least one AI provider API key to environment variables',
            providers: 'Set one of: GROQ_API_KEY, GEMINI_API_KEY, HF_API_KEY, OPENROUTER_API_KEY, MISTRAL_API_KEY, etc.'
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