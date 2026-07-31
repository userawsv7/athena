import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIResponse {
  content: string;
  metadata: {
    provider: string;
    tokens: number;
  };
}

const PROVIDERS = [
  { name: 'gemini', key: process.env.GEMINI_API_KEY },
  { name: 'groq', key: process.env.GROQ_API_KEY },
  { name: 'hf', key: process.env.HF_API_KEY },
  { name: 'openrouter', key: process.env.OPENROUTER_API_KEY },
  { name: 'mistral', key: process.env.MISTRAL_API_KEY },
  { name: 'cohere', key: process.env.COHERE_API_KEY },
  { name: 'deepinfra', key: process.env.DEEPINFRA_API_KEY },
  { name: 'cerebras', key: process.env.CEREBRAS_API_KEY },
  { name: 'sambanova', key: process.env.SAMBANOVA_API_KEY },
  { name: 'fireworks', key: process.env.FIREWORKS_API_KEY },
  { name: 'replicate', key: process.env.REPLICATE_API_KEY },
  { name: 'cloudflare', key: process.env.CLOUDFLARE_AI_API_KEY },
];

export async function generateResponse(
  message: string,
  mode: string,
  technology: string,
  sessionId: string
): Promise<AIResponse> {
  const systemPrompt = getSystemPrompt(mode, technology);

  for (const provider of PROVIDERS) {
    if (!provider.key) continue;

    try {
      const response = await callProvider({ name: provider.name, key: provider.key! }, systemPrompt, message);
      return response;
    } catch (error) {
      console.error(`${provider.name} failed:`, error);
      continue;
    }
  }

  throw new Error('All providers failed');
}

function getSystemPrompt(mode: string, technology: string): string {
  const basePrompt = `You are AthenaForge AI. Motto: "Total attention faces the problem. Like a flame, it burns through until the problem disappears."

You teach every technology from four perspectives:
1. CREATOR PERSPECTIVE - Who created it, why it exists, design principles
2. MAINTAINER AND COMMUNITY PERSPECTIVE - Official concepts, best practices
3. OPERATOR PERSPECTIVE - Daily operations, commands, configuration
4. PROBLEM SOLVER PERSPECTIVE - Complete problem resolution

Current technology: ${technology}
Current mode: ${mode}`;

  const modePrompts: Record<string, string> = {
    learning: `${basePrompt}\n\nYou are in LEARNING MODE. Create mind maps, explain concepts thoroughly, provide chapter roadmaps, and create hands-on labs.`,
    troubleshooting: `${basePrompt}\n\nYou are in TROUBLESHOOTING MODE. Follow the complete flow: Problem understanding → Symptoms → Causes → Investigation → Commands → Analysis → Root cause → Solution → Prevention.`,
    incident: `${basePrompt}\n\nYou are in PRODUCTION INCIDENT SIMULATION MODE. Create realistic incidents with symptoms, investigation steps, root cause analysis, fixes, and prevention strategies.`,
    interview: `${basePrompt}\n\nYou are in INTERVIEW MODE. Ask questions at basic, intermediate, and advanced levels. Include architecture discussions and scenario-based questions.`,
    code_review: `${basePrompt}\n\nYou are in CODE REVIEW MODE. Analyze code from creator, maintainer, operator, and problem-solver perspectives.`,
    architecture: `${basePrompt}\n\nYou are in ARCHITECTURE REVIEW MODE. Deep dive into system architecture, design decisions, and trade-offs.`,
  };

  return modePrompts[mode] || basePrompt;
}

async function callProvider(
  provider: { name: string; key: string },
  systemPrompt: string,
  message: string
): Promise<AIResponse> {
  // Implementation for each provider
  // This is a simplified version - expand for each provider

  if (provider.name === 'gemini' && provider.key) {
    const genAI = new GoogleGenerativeAI(provider.key);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n${message}` }],
      }],
    });

    const response = result.response;
    return {
      content: response.text(),
      metadata: {
        provider: 'gemini',
        tokens: response.usageMetadata?.totalTokenCount || 0,
      },
    };
  }

  // Add implementations for other providers
  throw new Error(`Provider ${provider.name} not implemented`);
}