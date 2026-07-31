import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIResponse {
  content: string;
  metadata: {
    provider: string;
    tokens: number;
  };
}

// Provider fallback order: Fastest/Best to Good (read env vars at runtime)
function getProviders() {
  return [
    { name: 'groq', key: process.env.GROQ_API_KEY, displayName: 'Groq API Key' },
    { name: 'gemini', key: process.env.GEMINI_API_KEY, displayName: 'Google Gemini API Key' },
    { name: 'openrouter', key: process.env.OPENROUTER_API_KEY, displayName: 'OpenRouter API Key' },
    { name: 'hf', key: process.env.HF_API_KEY, displayName: 'Hugging Face API Key' },
    { name: 'mistral', key: process.env.MISTRAL_API_KEY, displayName: 'Mistral API Key' },
    { name: 'cohere', key: process.env.COHERE_API_KEY, displayName: 'Cohere API Key' },
    { name: 'deepinfra', key: process.env.DEEPINFRA_API_KEY, displayName: 'DeepInfra API Key' },
    { name: 'cerebras', key: process.env.CEREBRAS_API_KEY, displayName: 'Cerebras API Key' },
    { name: 'sambanova', key: process.env.SAMBANOVA_API_KEY, displayName: 'SambaNova API Key' },
    { name: 'fireworks', key: process.env.FIREWORKS_API_KEY, displayName: 'Fireworks AI API Key' },
    { name: 'replicate', key: process.env.REPLICATE_API_KEY, displayName: 'Replicate API Key' },
    { name: 'cloudflare', key: process.env.CLOUDFLARE_AI_API_KEY, displayName: 'Cloudflare AI API Key' },
  ];
}

export async function generateResponse(
  message: string,
  mode: string,
  technology: string,
  sessionId: string,
  apiKeys: Record<string, string>
): Promise<AIResponse> {
  const systemPrompt = getSystemPrompt(mode, technology, sessionId);

  // Only use keys from frontend - no env var checking needed
  const availableProviders: Array<{name: string; key: string; displayName: string}> = [];

  if (apiKeys) {
    Object.entries(apiKeys).forEach(([keyName, keyValue]) => {
      if (keyValue && keyValue.trim() !== '') {
        const providerName = keyName.replace('_API_KEY', '').toLowerCase();
        const displayMap: Record<string, string> = {
          'groq': 'Groq API Key',
          'gemini': 'Google Gemini API Key',
          'hf': 'Hugging Face API Key',
          'openrouter': 'OpenRouter API Key',
          'mistral': 'Mistral API Key',
          'cohere': 'Cohere API Key',
          'deepinfra': 'DeepInfra API Key',
          'cerebras': 'Cerebras API Key',
          'sambanova': 'SambaNova API Key',
          'fireworks': 'Fireworks AI API Key',
          'replicate': 'Replicate API Key',
          'cloudflare': 'Cloudflare AI API Key',
        };
        availableProviders.push({
          name: providerName,
          key: keyValue,
          displayName: displayMap[providerName] || keyName
        });
      }
    });
  }

  console.log('Available providers from frontend:', availableProviders.map(p => p.name));

  if (availableProviders.length === 0) {
    const allProviderNames = [
      'GROQ_API_KEY', 'GEMINI_API_KEY', 'HF_API_KEY', 'OPENROUTER_API_KEY',
      'MISTRAL_API_KEY', 'COHERE_API_KEY', 'DEEPINFRA_API_KEY', 'CEREBRAS_API_KEY',
      'SAMBANOVA_API_KEY', 'FIREWORKS_API_KEY', 'REPLICATE_API_KEY', 'CLOUDFLARE_AI_API_KEY'
    ];
    throw new Error(`No AI providers configured. Set one of: ${allProviderNames.join(', ')}`);
  }

  // Ensure minimum 2 providers are available
  if (availableProviders.length < 2) {
    throw new Error('At least 2 API providers are required. Please provide at least 2 different API keys.');
  }

  // Try providers sequentially until one succeeds (best to good)
  const providerErrors: string[] = [];
  for (const provider of availableProviders) {
    try {
      console.log(`Trying provider: ${provider.name}`);
      const response = await callProvider({ name: provider.name, key: provider.key! }, systemPrompt, message);
      console.log(`Success with provider: ${provider.name}`);
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`${provider.name} failed:`, errorMsg);
      providerErrors.push(`${provider.name}: ${errorMsg}`);
    }
  }

  const detailedError = `All providers failed:\n${providerErrors.join('\n')}`;
  throw new Error(detailedError);
}

function getSystemPrompt(mode: string, technology: string, sessionId: string): string {
  const basePrompt = `You are AthenaForge AI. Motto: "Total attention faces the problem. Like a flame, it burns through until the problem disappears."

You teach EVERY technology using this COMPLETE methodology:

TEACHING FRAMEWORK:
1. REAL WORLD PROBLEM - What problem existed before? Why was this created? What pain does it remove?
2. SIMPLE EXPLANATION - Explain in beginner language. Create the "click moment."
3. LOCATION MAP - Where does it exist? What contains it? What does it contain? What communicates with it?
4. RESPONSIBILITY MAP - Who creates it? Who manages it? Who monitors it? What happens if it fails?
5. ANALOGY - Create a real-world analogy explaining location, relationship, and responsibility.
6. VISUAL LEARNING - Architecture diagrams, flow diagrams, lifecycle diagrams, mind maps (use ASCII art)
7. INTERNAL WORKING - User action → Component flow → Communication → Final result
8. HANDS-ON - Commands, configuration, code, expected output with explanations
9. ACTIVE RECALL - Ask: Where does this exist? Why created? What problem solves? What if fails? How troubleshoot?

CHAPTER SYSTEM - Before teaching, create complete roadmap:
Chapter 1: Why it exists
Chapter 2: Big picture architecture
Chapter 3: Core components
Chapter 4: Hands-on fundamentals
Chapter 5: Advanced concepts
Chapter 6: Production scenarios
Chapter 7: Troubleshooting
Chapter 8: Real-world incidents
Chapter 9: Architecture deep-dive
Chapter 10: Best practices
Track progress. Never restart from zero.

WHOLE SYSTEM THINKING - Never explain isolated concepts. Always connect:
Component → Purpose → Dependencies → Communication → Failure points

PRODUCTION ENGINEER MODE:
Every production issue format:
Incident: [Name]
Environment: [Setup]
Symptoms: [What users observe]
Impact: [Business/technical impact]
Investigation: [Commands used]
Logs: [Relevant log entries]
Evidence: [Proof collected]
Root cause: [Actual problem]
Fix: [Resolution steps]
Prevention: [How to avoid recurrence]

DIAGRAM REQUIREMENTS:
- Always include ASCII art diagrams
- Flow diagrams showing component relationships
- Architecture diagrams with boxes and arrows
- Lifecycle diagrams
- Mind maps for concepts

Current technology: ${technology}
Current mode: ${mode}
Session context: ${sessionId}`;

  const modePrompts: Record<string, string> = {
    learning: `${basePrompt}\n\nLEARNING MODE - Create comprehensive learning module:
1. CHAPTER ROADMAP - Numbered chapters with learning objectives
2. CONCEPT TEACHING - Follow all 9 steps of teaching framework above
3. VISUAL LEARNING - Multiple ASCII diagrams, architecture drawings, flow charts
4. COMMANDS - Every command with options, examples, output explanations
5. HANDS-ON LABS - Step-by-step exercises with expected outputs
6. TROUBLESHOOTING - Common issues, error messages, diagnostic commands
7. PRODUCTION SCENARIOS - Real incidents, battle stories, war room situations
8. MIND MAPS - Visual concept connections using ASCII
9. INTERVIEW QUESTIONS - Basic, intermediate, advanced levels
10. ACTIVE RECALL - End with questions to reinforce learning
Structure as complete educational content with progress tracking.`,

    troubleshooting: `${basePrompt}\n\nTROUBLESHOOTING MODE:
1. PROBLEM ANALYSIS - Symptoms, impact, timeline
2. INVESTIGATION STEPS - Systematic approach with commands
3. LOG ANALYSIS - What to look for, red flags, patterns
4. ROOT CAUSE - Deep technical explanation
5. MULTIPLE SOLUTIONS - With trade-offs
6. PREVENTION - Monitoring, alerts, best practices
7. SIMILAR INCIDENTS - Pattern recognition
Always use the production issue format. Include actual commands and logs.`,

    incident: `${basePrompt}\n\nPRODUCTION INCIDENT MODE:
1. INCIDENT SETUP - Realistic scenario with context
2. SYMPTOMS - What operators observe, user impact
3. INVESTIGATION - Step-by-step commands, log analysis
4. EVIDENCE GATHERING - What proves the hypothesis
5. ROOT CAUSE - Technical deep-dive
6. RESOLUTION - Exact steps taken
7. POSTMORTEM - Lessons learned, prevention measures
8. BATTLE STORIES - Real production war stories
Create immersive incident simulation with diagrams of system state.`,

    interview: `${basePrompt}\n\nINTERVIEW MODE:
LEVEL 1 (Basic): Fundamentals, definitions, simple scenarios
LEVEL 2 (Intermediate): Architecture decisions, troubleshooting, trade-offs
LEVEL 3 (Advanced): System design, production incidents, leadership scenarios

For each question provide:
- The question
- Expected answer points
- Follow-up questions
- Real-world context
- Common mistakes to avoid
Include architecture discussions and production war stories.`,

    code_review: `${basePrompt}\n\nCODE REVIEW MODE:
1. CREATOR VIEW - Design decisions, trade-offs made
2. MAINTAINER VIEW - Readability, documentation, testing
3. OPERATOR VIEW - Deployment, monitoring, debugging
4. PROBLEM SOLVER VIEW - Bug potential, edge cases, failures
5. PERFORMANCE - Bottlenecks, optimization opportunities
6. PRODUCTION - Scalability, reliability concerns
7. DIAGRAMS - Code flow, component interactions
Provide actionable feedback with examples.`,

    architecture: `${basePrompt}\n\nARCHITECTURE MODE:
1. SYSTEM OVERVIEW - High-level diagram with all components
2. DESIGN DECISIONS - Why this architecture? Alternatives considered?
3. SCALING STRATEGY - How does it grow? Bottlenecks?
4. FAILURE MODES - What breaks? How does it recover?
5. DATA FLOW - Request paths, data transformations
6. DEPLOYMENT - Infrastructure, CI/CD, environments
7. MONITORING - Metrics, logs, alerting strategy
8. TRADE-OFFS - Performance vs simplicity, cost vs reliability
Include detailed ASCII architecture diagrams and decision matrices.`,
  };

  return modePrompts[mode] || basePrompt;
}

async function callProvider(
  provider: { name: string; key: string },
  systemPrompt: string,
  message: string
): Promise<AIResponse> {
  const fullPrompt = `${systemPrompt}\n\n${message}`;

  try {
    switch (provider.name) {
      case 'gemini':
        console.log(`[Gemini] Attempting with key length: ${provider.key.length}`);
        const genAI = new GoogleGenerativeAI(provider.key);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [{ text: fullPrompt }],
          }],
        });

        const response = result.response;
        console.log(`[Gemini] Success - Response length: ${response.text().length}`);
        return {
          content: response.text(),
          metadata: {
            provider: 'gemini',
            tokens: response.usageMetadata?.totalTokenCount || 0,
          },
        };

      case 'groq':
        console.log(`[Groq] Attempting with key length: ${provider.key.length}`);
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: fullPrompt }],
            max_tokens: 4000,
          }),
        });

        if (!groqResponse.ok) {
          const error = await groqResponse.text();
          throw new Error(`Groq API error: ${groqResponse.status} - ${error}`);
        }

        const groqData = await groqResponse.json();
        console.log(`[Groq] Success - Response length: ${groqData.choices[0].message.content.length}`);
        return {
          content: groqData.choices[0].message.content,
          metadata: {
            provider: 'groq',
            tokens: groqData.usage?.total_tokens || 0,
          },
        };

      case 'openrouter':
        console.log(`[OpenRouter] Attempting with key length: ${provider.key.length}`);
        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://athenaforge.ai',
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3-haiku',
            messages: [{ role: 'user', content: fullPrompt }],
            max_tokens: 4000,
          }),
        });

        if (!orResponse.ok) {
          const error = await orResponse.text();
          throw new Error(`OpenRouter API error: ${orResponse.status} - ${error}`);
        }

        const orData = await orResponse.json();
        console.log(`[OpenRouter] Success - Response length: ${orData.choices[0].message.content.length}`);
        return {
          content: orData.choices[0].message.content,
          metadata: {
            provider: 'openrouter',
            tokens: orData.usage?.total_tokens || 0,
          },
        };

      case 'hf':
        console.log(`[HuggingFace] Attempting with key length: ${provider.key.length}`);
        const hfResponse = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              max_new_tokens: 2000,
              return_full_text: false,
            },
          }),
        });

        if (!hfResponse.ok) {
          const error = await hfResponse.text();
          throw new Error(`HuggingFace API error: ${hfResponse.status} - ${error}`);
        }

        const hfData = await hfResponse.json();
        const hfContent = Array.isArray(hfData) ? hfData[0].generated_text : hfData.generated_text;
        console.log(`[HuggingFace] Success - Response length: ${hfContent.length}`);
        return {
          content: hfContent,
          metadata: {
            provider: 'hf',
            tokens: 0,
          },
        };

      case 'mistral':
        console.log(`[Mistral] Attempting with key length: ${provider.key.length}`);
        const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [{ role: 'user', content: fullPrompt }],
            max_tokens: 4000,
          }),
        });

        if (!mistralResponse.ok) {
          const error = await mistralResponse.text();
          throw new Error(`Mistral API error: ${mistralResponse.status} - ${error}`);
        }

        const mistralData = await mistralResponse.json();
        console.log(`[Mistral] Success - Response length: ${mistralData.choices[0].message.content.length}`);
        return {
          content: mistralData.choices[0].message.content,
          metadata: {
            provider: 'mistral',
            tokens: mistralData.usage?.total_tokens || 0,
          },
        };

      case 'cohere':
        console.log(`[Cohere] Attempting with key length: ${provider.key.length}`);
        const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'command-r-plus',
            message: fullPrompt,
            max_tokens: 4000,
          }),
        });

        if (!cohereResponse.ok) {
          const error = await cohereResponse.text();
          throw new Error(`Cohere API error: ${cohereResponse.status} - ${error}`);
        }

        const cohereData = await cohereResponse.json();
        console.log(`[Cohere] Success - Response length: ${cohereData.text.length}`);
        return {
          content: cohereData.text,
          metadata: {
            provider: 'cohere',
            tokens: cohereData.meta?.tokens?.input_tokens + cohereData.meta?.tokens?.output_tokens || 0,
          },
        };

      case 'deepinfra':
        console.log(`[DeepInfra] Attempting with key length: ${provider.key.length}`);
        const deepinfraResponse = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'meta-llama/Meta-Llama-3-70B-Instruct',
            messages: [{ role: 'user', content: fullPrompt }],
            max_tokens: 4000,
          }),
        });

        if (!deepinfraResponse.ok) {
          const error = await deepinfraResponse.text();
          throw new Error(`DeepInfra API error: ${deepinfraResponse.status} - ${error}`);
        }

        const deepinfraData = await deepinfraResponse.json();
        console.log(`[DeepInfra] Success - Response length: ${deepinfraData.choices[0].message.content.length}`);
        return {
          content: deepinfraData.choices[0].message.content,
          metadata: {
            provider: 'deepinfra',
            tokens: deepinfraData.usage?.total_tokens || 0,
          },
        };

      case 'cerebras':
        console.log(`[Cerebras] Attempting with key length: ${provider.key.length}`);
        const cerebrasResponse = await fetch('https://api.cerebras.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3.1-70b',
            messages: [{ role: 'user', content: fullPrompt }],
            max_tokens: 4000,
          }),
        });

        if (!cerebrasResponse.ok) {
          const error = await cerebrasResponse.text();
          throw new Error(`Cerebras API error: ${cerebrasResponse.status} - ${error}`);
        }

        const cerebrasData = await cerebrasResponse.json();
        console.log(`[Cerebras] Success - Response length: ${cerebrasData.choices[0].message.content.length}`);
        return {
          content: cerebrasData.choices[0].message.content,
          metadata: {
            provider: 'cerebras',
            tokens: cerebrasData.usage?.total_tokens || 0,
          },
        };

      case 'sambanova':
        console.log(`[SambaNova] Attempting with key length: ${provider.key.length}`);
        const sambanovaResponse = await fetch('https://api.sambanova.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'Meta-Llama-3.1-70B-Instruct',
            messages: [{ role: 'user', content: fullPrompt }],
            max_tokens: 4000,
          }),
        });

        if (!sambanovaResponse.ok) {
          const error = await sambanovaResponse.text();
          throw new Error(`SambaNova API error: ${sambanovaResponse.status} - ${error}`);
        }

        const sambanovaData = await sambanovaResponse.json();
        console.log(`[SambaNova] Success - Response length: ${sambanovaData.choices[0].message.content.length}`);
        return {
          content: sambanovaData.choices[0].message.content,
          metadata: {
            provider: 'sambanova',
            tokens: sambanovaData.usage?.total_tokens || 0,
          },
        };

      case 'fireworks':
        console.log(`[Fireworks] Attempting with key length: ${provider.key.length}`);
        const fireworksResponse = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'accounts/fireworks/models/llama-v3-70b-instruct',
            messages: [{ role: 'user', content: fullPrompt }],
            max_tokens: 4000,
          }),
        });

        if (!fireworksResponse.ok) {
          const error = await fireworksResponse.text();
          throw new Error(`Fireworks API error: ${fireworksResponse.status} - ${error}`);
        }

        const fireworksData = await fireworksResponse.json();
        console.log(`[Fireworks] Success - Response length: ${fireworksData.choices[0].message.content.length}`);
        return {
          content: fireworksData.choices[0].message.content,
          metadata: {
            provider: 'fireworks',
            tokens: fireworksData.usage?.total_tokens || 0,
          },
        };

      case 'replicate':
        console.log(`[Replicate] Attempting with key length: ${provider.key.length}`);
        const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${provider.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: 'meta/meta-llama-3-70b-instruct',
            input: {
              prompt: fullPrompt,
              max_new_tokens: 4000,
            },
          }),
        });

        if (!replicateResponse.ok) {
          const error = await replicateResponse.text();
          throw new Error(`Replicate API error: ${replicateResponse.status} - ${error}`);
        }

        const replicateData = await replicateResponse.json();

        // Poll for completion
        let replicateResult = replicateData;
        while (replicateResult.status !== 'succeeded' && replicateResult.status !== 'failed') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const pollResponse = await fetch(replicateResult.urls.get, {
            headers: { 'Authorization': `Token ${provider.key}` },
          });
          replicateResult = await pollResponse.json();
        }

        if (replicateResult.status === 'failed') {
          throw new Error('Replicate prediction failed');
        }

        const replicateContent = replicateResult.output.join('');
        console.log(`[Replicate] Success - Response length: ${replicateContent.length}`);
        return {
          content: replicateContent,
          metadata: {
            provider: 'replicate',
            tokens: 0,
          },
        };

      case 'cloudflare':
        console.log(`[Cloudflare] Attempting with key length: ${provider.key.length}`);
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
        const cloudflareResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-70b-instruct`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${provider.key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: fullPrompt }],
            }),
          }
        );

        if (!cloudflareResponse.ok) {
          const error = await cloudflareResponse.text();
          throw new Error(`Cloudflare API error: ${cloudflareResponse.status} - ${error}`);
        }

        const cloudflareData = await cloudflareResponse.json();
        console.log(`[Cloudflare] Success - Response length: ${cloudflareData.result.response.length}`);
        return {
          content: cloudflareData.result.response,
          metadata: {
            provider: 'cloudflare',
            tokens: 0,
          },
        };

      default:
        // For unimplemented providers, throw specific error to continue to next
        console.log(`[Provider] ${provider.name} not yet implemented, skipping`);
        throw new Error(`Provider ${provider.name} not implemented`);
    }
  } catch (error: any) {
    console.error(`[${provider.name}] API Error:`, error.message);
    throw error;
  }
}