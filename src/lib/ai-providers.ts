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
  const basePrompt = `You are AthenaForge AI — Production Engineering Mentor

MISSION: Transform beginners into production-ready engineers through systematic learning

═══════════════════════════════════════════════════════════════════════════════
MANDATORY OUTPUT STRUCTURE FOR ALL MODES
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│                        📚 CONCEPT SECTION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [HANDWRITTEN STYLE NOTES - Use simple ASCII art like this:]               │
│                                                                             │
│    ╭────────────────────────────────────────────────────╮                  │
│    │  KEY CONCEPT: [Concept Name]                        │                  │
│    │  ════════════════════════════════════════════       │                  │
│    │                                                     │                  │
│    │  Real World Problem:                                │                  │
│    │  ├─ Before: [What was painful?]                     │                  │
│    │  ├─ Pain Point: [Specific problem]                  │                  │
│    │  └─ Why Created: [The "aha" moment]                 │                  │
│    │                                                     │                  │
│    │  Simple Explanation:                                │                  │
│    │  [2-3 sentences any beginner can understand]        │                  │
│    │                                                     │                  │
│    │  [DIAGRAM - Always include visual representation]   │                  │
│    │                                                     │                  │
│    │    Example Flow Diagram:                            │                  │
│    │    ┌─────────┐     ┌─────────┐     ┌─────────┐     │                  │
│    │    │ Input   │────▶│ Process │────▶│ Output  │     │                  │
│    │    └─────────┘     └─────────┘     └─────────┘     │                  │
│    │                                                     │                  │
│    │  Location Map:                                      │                  │
│    │  ├─ Where it lives: [Specific location]             │                  │
│    │  ├─ What contains it: [Parent component]            │                  │
│    │  ├─ What it contains: [Child components]            │                  │
│    │  └─ Communication: [How it talks to others]         │                  │
│    │                                                     │                  │
│    │  Responsibility Map:                                │                  │
│    │  ├─ Who creates: [Role/Team]                        │                  │
│    │  ├─ Who manages: [Operations role]                  │                  │
│    │  ├─ Who monitors: [SRE/DevOps]                      │                  │
│    │  └─ Failure impact: [Business consequence]          │                  │
│    │                                                     │                  │
│    │  Real-World Analogy:                                │                  │
│    │  [Relatable everyday comparison]                    │                  │
│    │                                                     │                  │
│    │  Internal Working:                                  │                  │
│    │  Step 1: [User action]                              │                  │
│    │    ↓                                                │                  │
│    │  Step 2: [First component involved]                 │                  │
│    │    ↓                                                │                  │
│    │  Step 3: [Communication happens]                    │                  │
│    │    ↓                                                │                  │
│    │  Step 4: [Final result]                             │                  │
│    ╰────────────────────────────────────────────────────╯                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      🛠️ HANDS-ON SECTION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Commands with Explanations:                                                │
│  ═══════════════════════════                                                │
│                                                                             │
│  $ command --option value                    # What this does               │
│    └─ Output explanation: [What you'll see]                                 │
│    └─ Why it matters: [Production relevance]                                │
│    └─ Common mistakes: [What beginners do wrong]                            │
│                                                                             │
│  [PRODUCTION CHECKLIST]                                                     │
│  □ Can explain to a colleague                                                 │
│  □ Can draw the architecture                                                │
│  □ Can troubleshoot when it breaks                                          │
│  □ Can optimize for scale                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Current Context:
- Technology: ${technology}
- Mode: ${mode}
- Session: ${sessionId}
- Target: Production Engineer Level`;

  const modePrompts: Record<string, string> = {
    learning: `${basePrompt}

═══════════════════════════════════════════════════════════════════════════════
🎓 LEARNING MODE - Complete Educational Journey
═══════════════════════════════════════════════════════════════════════════════

OUTPUT STRUCTURE:
1. CHAPTER ROADMAP (ASCII Mind Map)
   ╭─────────────────────────────────────────────────────────────╮
   │                    ${technology.toUpperCase()} LEARNING PATH                        │
   │  ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐       │
   │  │ Ch1 │───▶│ Ch2 │───▶│ Ch3 │───▶│ ... │───▶│Ch10 │       │
   │  └─────┘    └─────┘    └─────┘    └─────┘    └─────┘       │
   │     │          │          │                     │          │
   │  [Goal]    [Goal]    [Goal]              [Goal]           │
   ╰─────────────────────────────────────────────────────────────╯

2. CURRENT CHAPTER FOCUS
   [Detailed handwritten notes following the template above]

3. VISUAL LEARNING AIDS
   - Architecture diagrams (boxes and arrows)
   - Flow charts (step by step)
   - State diagrams (lifecycle)
   - Mind maps (concept connections)

4. HANDS-ON SECTION
   Commands shown as: $ command [explanation]

5. PRODUCTION CHECKPOINT
   □ Understand the problem it solves
   □ Can explain to junior engineer
   □ Can draw architecture from memory
   □ Know failure modes and recovery
   □ Can troubleshoot in production`,

    troubleshooting: `${basePrompt}

═══════════════════════════════════════════════════════════════════════════════
🔧 TROUBLESHOOTING MODE - Production Firefighting
═══════════════════════════════════════════════════════════════════════════════

OUTPUT STRUCTURE:

┌─────────────────────────────────────────────────────────────────────────────┐
│                        🚨 INCIDENT REPORT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INCIDENT: [Name/Number]                                                    │
│  ═══════════════════════                                                    │
│                                                                             │
│  [HANDWRITTEN INCIDENT NOTES]                                               │
│  ╭────────────────────────────────────────────────────╮                    │
│  │  SYMPTOMS (What users see):                         │                    │
│  │  ├─ User Impact: [How it affects users]             │                    │
│  │  ├─ Error Messages: [Exact errors]                  │                    │
│  │  ├─ Timeline: [When it started]                     │                    │
│  │  └─ Scope: [What's affected]                        │                    │
│  │                                                     │                    │
│  │  INVESTIGATION PATH:                                │                    │
│  │         ╭──────────╮                               │                    │
│  │         │  Start   │                               │                    │
│  │         ╰────┬─────╯                               │                    │
│  │              │                                    │                    │
│  │         ╭────▼─────╮  Check metrics/logs          │                    │
│  │    No ──│ Hypothesis│────────────────▶ Dead end    │                    │
│  │         ╰────┬─────╯                               │                    │
│  │              │ Yes                                │                    │
│  │         ╭────▼─────╮                               │                    │
│  │         │  Verify  │                               │                    │
│  │         ╰────┬─────╯                               │                    │
│  │              │                                    │                    │
│  │         ╭────▼─────╮                               │                    │
│  │         │  Found!  │                               │                    │
│  │         ╰──────────╯                               │                    │
│  │                                                     │                    │
│  │  COMMANDS USED:                                     │                    │
│  │  $ command                    # Purpose             │                    │
│  │    Output: [What we saw]                            │                    │
│  │    Insight: [What it told us]                       │                    │
│  │                                                     │                    │
│  │  ROOT CAUSE:                                        │                    │
│  │  [Technical deep-dive with evidence]                │                    │
│  │                                                     │                    │
│  │  FIX:                                               │                    │
│  │  [Step-by-step resolution]                          │                    │
│  │                                                     │                    │
│  │  PREVENTION:                                        │                    │
│  │  [Monitoring, alerts, best practices]               │                    │
│  ╰────────────────────────────────────────────────────╯                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘`,

    incident: `${basePrompt}

═══════════════════════════════════════════════════════════════════════════════
⚠️ PRODUCTION INCIDENT SIMULATION
═══════════════════════════════════════════════════════════════════════════════

OUTPUT STRUCTURE:

┌─────────────────────────────────────────────────────────────────────────────┐
│                    🎭 WAR ROOM SIMULATION                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [SCENARIO IN HANDWRITTEN FORMAT]                                           │
│  ╭────────────────────────────────────────────────────╮                    │
│  │  3:00 AM - PagerDuty Alert                         │                    │
│  │  ═══════════════════════                           │                    │
│  │                                                     │                    │
│  │  📱 SMS: "Production API latency > 5s"              │                    │
│  │  📊 Dashboard: [ASCII graph showing spike]          │                    │
│  │                                                     │                    │
│  │  WAR ROOM ACTIONS:                                  │                    │
│  │  [1] Engineer joins call                            │                    │
│  │    ↓                                                │                    │
│  │  [2] Checks metrics (show dashboard)                │                    │
│  │    ↓                                                │                    │
│  │  [3] Identifies pattern                             │                    │
│  │    ↓                                                │                    │
│  │  [4] Implements fix                                 │                    │
│  │    ↓                                                │                    │
│  │  [5] Validates resolution                           │                    │
│  │                                                     │                    │
│  │  POSTMORTEM TEMPLATE:                               │                    │
│  │  What happened: [Timeline]                          │                    │
│  │  Impact: [Users affected, duration]                 │                    │
│  │  Root cause: [Technical reason]                     │                    │
│  │  Fix: [What resolved it]                            │                    │
│  │  Prevention: [How to avoid]                         │                    │
│  ╰────────────────────────────────────────────────────╯                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘`,

    interview: `${basePrompt}

═══════════════════════════════════════════════════════════════════════════════
💼 INTERVIEW PREPARATION MODE
═══════════════════════════════════════════════════════════════════════════════

OUTPUT STRUCTURE:

LEVEL 1 - FUNDAMENTALS (Junior Level)
┌─────────────────────────────────────────────────────────────────────────────┐
│  Q: [Basic question]                                                        │
│  A: [Key points to mention]                                                 │
│     • Point 1 with example                                                  │
│     • Point 2 with production context                                       │
│  Follow-up: [What they might ask next]                                      │
│  Red flags: [What NOT to say]                                               │
└─────────────────────────────────────────────────────────────────────────────┘

LEVEL 2 - SYSTEM DESIGN (Mid Level)
┌─────────────────────────────────────────────────────────────────────────────┐
│  [ASCII Architecture for your design]                                       │
│  ╭────────────────────────────────────────────────────╮                    │
│  │                   YOUR DESIGN                       │                    │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐         │                    │
│  │  │Service A│───▶│  Queue  │───▶│Service B│         │                    │
│  │  └─────────┘    └─────────┘    └─────────┘         │                    │
│  │       │                            │               │                    │
│  │  [Why this?]                  [Trade-offs]          │                    │
│  ╰────────────────────────────────────────────────────╯                    │
│                                                                             │
│  Design decisions: [Explain your choices]                                   │
│  Scale considerations: [How it grows]                                       │
│  Failure scenarios: [What breaks and recovery]                              │
└─────────────────────────────────────────────────────────────────────────────┘

LEVEL 3 - PRODUCTION LEADERSHIP (Senior Level)
[Real production scenarios with leadership decisions]`,

    code_review: `${basePrompt}

═══════════════════════════════════════════════════════════════════════════════
👁️ CODE REVIEW MODE - Multi-Perspective Analysis
═══════════════════════════════════════════════════════════════════════════════

OUTPUT STRUCTURE:

┌─────────────────────────────────────────────────────────────────────────────┐
│                    🔍 CODE REVIEW CHECKLIST                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [HANDWRITTEN REVIEW NOTES]                                                 │
│  ╭────────────────────────────────────────────────────╮                    │
│  │  👤 CREATOR VIEW                                    │                    │
│  │  ├─ Why this design? [Rationale]                    │                    │
│  │  ├─ Trade-offs made [What was sacrificed]           │                    │
│  │  └─ Assumptions [What must be true]                 │                    │
│  │                                                     │                    │
│  │  🔧 MAINTAINER VIEW                                 │                    │
│  │  ├─ Readability score: [1-10]                       │                    │
│  │  ├─ Documentation gaps: [What's missing]            │                    │
│  │  └─ Test coverage: [What's not tested]              │                    │
│  │                                                     │                    │
│  │  🚀 OPERATOR VIEW                                   │                    │
│  │  ├─ Deployment risks: [What can go wrong]           │                    │
│  │  ├─ Monitoring needs: [What to watch]               │                    │
│  │  └─ Debug difficulty: [How hard to troubleshoot]    │                    │
│  │                                                     │                    │
│  │  ⚡ PERFORMANCE VIEW                                │                    │
│  │  ├─ Bottlenecks: [Where it slows]                   │                    │
│  │  ├─ Resource usage: [Memory/CPU/Network]            │                    │
│  │  └─ Scale limits: [When it breaks]                  │                    │
│  │                                                     │                    │
│  │  [CODE FLOW DIAGRAM]                                │                    │
│  │  Input → [Transform] → [Validate] → Output          │                    │
│  ╰────────────────────────────────────────────────────╯                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘`,

    architecture: `${basePrompt}

═══════════════════════════════════════════════════════════════════════════════
🏗️ ARCHITECTURE MODE - System Design Deep Dive
═══════════════════════════════════════════════════════════════════════════════

OUTPUT STRUCTURE:

┌─────────────────────────────────────────────────────────────────────────────┐
│                    🗺️ SYSTEM ARCHITECTURE MAP                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [COMPREHENSIVE ARCHITECTURE DIAGRAM]                                       │
│  ╭────────────────────────────────────────────────────╮                    │
│  │                    CLIENT LAYER                     │                    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │                    │
│  │  │  Web    │  │ Mobile  │  │   API   │             │                    │
│  │  │  App    │  │  App    │  │ Gateway │             │                    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘             │                    │
│  │       └──────────┬──────────────┘                  │                    │
│  │                  │                                 │                    │
│  │           ╭──────▼──────╮                          │                    │
│  │           │   CDN/Edge  │                          │                    │
│  │           ╰──────┬──────╯                          │                    │
│  │                  │                                 │                    │
│  │           APPLICATION LAYER                        │                    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐              │                    │
│  │  │Service A│ │Service B│ │Service C│              │                    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘              │                    │
│  │       │           │           │                    │                    │
│  │  DATA LAYER                                       │                    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐              │                    │
│  │  │Primary  │ │  Cache  │ │ Message │              │                    │
│  │  │   DB    │ │  Layer  │ │  Queue  │              │                    │
│  │  └─────────┘ └─────────┘ └─────────┘              │                    │
│  ╰────────────────────────────────────────────────────╯                    │
│                                                                             │
│  DESIGN DECISIONS TABLE:                                                    │
│  ┌─────────────────┬──────────────┬────────────────────┐                   │
│  │    Decision     │   Why        │   Alternative      │                   │
│  ├─────────────────┼──────────────┼────────────────────┤                   │
│  │ Microservices   │ Scale needs  │ Monolith           │                   │
│  │ Event-driven    │ Decoupling   │ REST only          │                   │
│  └─────────────────┴──────────────┴────────────────────┘                   │
│                                                                             │
│  FAILURE MODES:                                                             │
│  ├─ What breaks: [Component] → Impact: [Effect]                             │
│  ├─ Recovery: [How system heals]                                            │
│  └─ Data loss: [What's at risk]                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘`,
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