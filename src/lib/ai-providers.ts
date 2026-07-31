import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIResponse {
  content: string;
  metadata: {
    provider: string;
    tokens: number;
  };
}

// Provider fallback order: Best to Good
const PROVIDERS = [
  { name: 'gemini', key: process.env.GEMINI_API_KEY, displayName: 'Google Gemini API Key' },
  { name: 'groq', key: process.env.GROQ_API_KEY, displayName: 'Groq API Key' },
  { name: 'openrouter', key: process.env.OPENROUTER_API_KEY, displayName: 'OpenRouter API Key' },
  { name: 'hf', key: process.env.HF_API_KEY, displayName: 'Hugging Face API Key' },
  { name: 'mistral', key: process.env.MISTRAL_API_KEY, displayName: 'Mistral API Key' },
  { name: 'cohere', key: process.env.COHERE_API_KEY, displayName: 'Cohere API Key' },
  { name: 'deepinfra', key: process.env.DEEPINFRA_API_KEY, displayName: 'DeepInfra API Key' },
  { name: 'cerebras', key: process.env.CEREBRAS_API_KEY, displayName: 'Cerebras API Key' },
  { name: 'sambanova', key: process.env.SAMBANOVA_API_KEY, displayName: 'SambaNova API Key' },
  { name: 'fireworks', key: process.env.FIREWORKS_API_KEY, displayName: 'Fireworks AI API Key' },
  { name: 'replicate', key: process.env.REPLICATE_API_KEY, displayName: 'Replicate API Key' },
  { name: 'cloudflare', key: process.env.CLOUDFLARE_AI_API_KEY, displayName: 'Cloudflare API Key' },
];

export async function generateResponse(
  message: string,
  mode: string,
  technology: string,
  sessionId: string
): Promise<AIResponse> {
  const systemPrompt = getSystemPrompt(mode, technology, sessionId);
  console.log("Gemini key exists:", !!process.env.GEMINI_API_KEY);

  // Check all providers - use any that are configured
  console.log("ENV CHECK:", {
    GEMINI: !!process.env.GEMINI_API_KEY,
    GROQ: !!process.env.GROQ_API_KEY,
    OPENROUTER: !!process.env.OPENROUTER_API_KEY
  });

  // Filter configured providers
  const availableProviders = PROVIDERS.filter(p => p.key);

  if (availableProviders.length === 0) {
    const allProviderNames = PROVIDERS.map(p => p.displayName);
    throw new Error(`No AI providers configured. Set one of: ${allProviderNames.join(', ')}`);
  }

  // Parallel execution with load splitting for best response
  const promises = availableProviders.map(async (provider) => {
    try {
      const response = await callProvider({ name: provider.name, key: provider.key! }, systemPrompt, message);
      return { success: true, response, provider: provider.name };
    } catch (error) {
      console.error(`${provider.name} failed:`, error instanceof Error ? error.message : error);
      return { success: false, error, provider: provider.name };
    }
  });

  const results = await Promise.allSettled(promises);
  const successful = results
    .filter((result): result is PromiseFulfilledResult<any> =>
      result.status === 'fulfilled' && result.value.success
    )
    .map(result => result.value);

  if (successful.length === 0) {
    throw new Error('All providers failed');
  }

  // Return the best response using simple scoring based on response length and provider reliability
  const rankedResults = successful.sort((a, b) => {
    // Prefer responses with more content and from more reliable providers
    const scoreA = a.response.content.length + (a.provider === 'gemini' ? 100 : 0) + (a.provider === 'groq' ? 80 : 0);
    const scoreB = b.response.content.length + (b.provider === 'gemini' ? 100 : 0) + (b.provider === 'groq' ? 80 : 0);
    return scoreB - scoreA;
  });

  return rankedResults[0].response;
}

function getSystemPrompt(mode: string, technology: string, sessionId: string): string {
  const basePrompt = `You are AthenaForge AI. Motto: "Total attention faces the problem. Like a flame, it burns through until the problem disappears."

You teach every technology from four perspectives:
1. CREATOR PERSPECTIVE - Who created it, why it exists, design principles
2. MAINTAINER AND COMMUNITY PERSPECTIVE - Official concepts, best practices
3. OPERATOR PERSPECTIVE - Daily operations, commands, configuration
4. PROBLEM SOLVER PERSPECTIVE - Complete problem resolution

Current technology: ${technology}
Current mode: ${mode}
Session context: ${sessionId}`;

  const modePrompts: Record<string, string> = {
    learning: `${basePrompt}\n\nYou are in LEARNING MODE. For any topic provide:
1. ALL CONCEPTS - Complete theory, architecture, internals
2. RELATED COMMANDS - Every command with options, examples, use cases
3. TROUBLESHOOTING - Common issues, error messages, solutions, diagnostics
4. REAL-TIME PRODUCTION ISSUES - Live scenarios, incidents, war stories
5. DIAGRAM VISUALIZATION - ASCII art, flowcharts, architecture diagrams
6. HANDS-ON LABS - Step-by-step practical exercises
Structure response as comprehensive learning module with mind maps and chapter roadmaps.`,
    troubleshooting: `${basePrompt}\n\nYou are in TROUBLESHOOTING MODE. Follow the complete flow: Problem understanding → Symptoms → Causes → Investigation → Commands → Analysis → Root cause → Solution → Prevention. Always include relevant commands, logs analysis, and production scenarios.`,
    incident: `${basePrompt}\n\nYou are in PRODUCTION INCIDENT SIMULATION MODE. Create realistic incidents with symptoms, investigation steps, root cause analysis, fixes, and prevention strategies. Include actual commands used, logs to check, and production battle stories.`,
    interview: `${basePrompt}\n\nYou are in INTERVIEW MODE. Ask questions at basic, intermediate, and advanced levels. Include architecture discussions, scenario-based questions, troubleshooting scenarios, and production war stories.`,
    code_review: `${basePrompt}\n\nYou are in CODE REVIEW MODE. Analyze code from creator, maintainer, operator, and problem-solver perspectives. Include performance analysis, production considerations, and real-world scenarios.`,
    architecture: `${basePrompt}\n\nYou are in ARCHITECTURE REVIEW MODE. Deep dive into system architecture, design decisions, trade-offs, scaling considerations, and production deployments with diagrams and real-world examples.`,
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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