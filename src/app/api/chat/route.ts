import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/ai-providers';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, mode, technology } = await req.json();

    // Check database connection
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: 'Database not configured',
          details: 'Please set DATABASE_URL in your environment variables',
          action: 'Add your PostgreSQL connection string to the DATABASE_URL environment variable'
        },
        { status: 503 }
      );
    }

    // Ensure session exists with error handling
    try {
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
    } catch (dbError: any) {
      console.error('Database error:', dbError);

      if (dbError.code === 'P1001') {
        return NextResponse.json(
          {
            error: 'Database connection failed',
            details: 'Cannot connect to PostgreSQL database',
            action: 'Check your DATABASE_URL and ensure the database is running and accessible'
          },
          { status: 503 }
        );
      }

      if (dbError.code === 'P2021') {
        return NextResponse.json(
          {
            error: 'Database tables missing',
            details: 'Required tables do not exist in the database',
            action: 'Run: npx prisma db push to create the database schema'
          },
          { status: 503 }
        );
      }

      throw dbError;
    }

    // Save user message
    await prisma.message.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
      },
    });

    // Generate AI response with proper error handling
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
            action: 'Add at least one AI provider API key (e.g., GEMINI_API_KEY, GROQ_API_KEY)',
            providers: 'groq, gemini, hf, openrouter, mistral, cohere, deepinfra, cerebras, sambanova, fireworks, replicate, cloudflare'
          },
          { status: 503 }
        );
      }

      throw aiError;
    }

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
  } catch (error: any) {
    console.error('Chat error:', error);

    // Generic error with helpful context
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error.message || 'An unexpected error occurred',
        action: 'Please check the console for more details or try again'
      },
      { status: 500 }
    );
  }
}