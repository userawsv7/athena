'use client';

import { useState } from 'react';
import { ModeSelector } from '@/components/ModeSelector';
import { ChatInterface } from '@/components/ChatInterface';
import { SessionPanel } from '@/components/SessionPanel';
import { TechnologySelector } from '@/components/TechnologySelector';

export default function AthenaForge() {
  const [mode, setMode] = useState<'learning' | 'troubleshooting' | 'incident' | 'interview' | 'code_review' | 'architecture'>('learning');
  const [technology, setTechnology] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isSessionActive, setIsSessionActive] = useState(false);

  const handleStartSession = (tech: string) => {
    setTechnology(tech);
    const newSessionId = `ATHENA-${tech.toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`;
    setSessionId(newSessionId);
    setIsSessionActive(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-[#2a2a2a] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AthenaForge AI</h1>
            <p className="text-sm text-gray-400">"Total attention faces the problem. Like a flame, it burns through until the problem disappears."</p>
          </div>
          <div className="flex items-center gap-4">
            {sessionId && (
              <div className="text-sm text-gray-400">Session: {sessionId}</div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {!isSessionActive ? (
          <div className="max-w-3xl mx-auto mt-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Welcome to AthenaForge AI</h2>
              <p className="text-xl text-gray-400">A living engineering companion that understands technology from its creators, learns from its community, operates like a production engineer, and solves problems until they disappear.</p>
            </div>

            <ModeSelector selectedMode={mode} onModeSelect={setMode} />
            <TechnologySelector onStartSession={handleStartSession} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <SessionPanel
                sessionId={sessionId}
                technology={technology}
                mode={mode}
              />
            </div>
            <div className="lg:col-span-3">
              <ChatInterface
                sessionId={sessionId}
                technology={technology}
                mode={mode}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}