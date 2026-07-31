# AthenaForge AI

**Motto:** "Total attention faces the problem. Like a flame, it burns through until the problem disappears."

A production-ready AI Engineering Academy and Troubleshooting Assistant that helps users learn any technology deeply, understand why technologies exist, build real-world skills, troubleshoot production problems, and solve issues completely.

## Philosophy

AthenaForge AI teaches every technology from four perspectives:

1. **Creator Perspective** - Who created it, why it exists, design principles
2. **Maintainer & Community Perspective** - Official concepts, best practices, ecosystem evolution
3. **Operator Perspective** - Daily operations, commands, configuration, production failures
4. **Problem Solver Perspective** - Complete problem resolution with investigation, root cause analysis, and prevention

## Features

- 🤖 Multi-provider AI gateway (12+ providers with automatic fallback)
- 📚 6 Learning modes: Learning, Troubleshooting, Incident Simulation, Interview, Code Review, Architecture Review
- 💾 Session management with persistence
- 🗺️ Mind maps, chapter roadmaps, hands-on labs
- 🚨 Production incident simulation
- 🎯 Interview preparation with adaptive difficulty
- 🔧 Complete problem-solving flow

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Deployment:** Vercel

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your API keys
3. Install dependencies: `npm install`
4. Set up database: `npx prisma db push`
5. Run development server: `npm run dev`

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- At least one AI provider API key (GROQ_API_KEY, GEMINI_API_KEY, etc.)

## Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/athenaforge-ai)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Docker

```bash
docker-compose up -d
```

## Supported AI Providers

- Groq
- Google Gemini
- Hugging Face
- OpenRouter
- Mistral
- Cohere
- DeepInfra
- Cerebras
- SambaNova
- Fireworks AI
- Replicate
- Cloudflare AI

## Project Structure

```
athenaforge-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   └── types/
├── prisma/
│   └── schema.prisma
├── package.json
└── README.md
```

## License

MIT