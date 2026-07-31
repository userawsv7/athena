'use client';

import { useState, useEffect } from 'react';
import { ModeSelector } from '@/components/ModeSelector';
import { ChatInterface } from '@/components/ChatInterface';
import { SessionPanel } from '@/components/SessionPanel';
import { TechnologySelector } from '@/components/TechnologySelector';
import { History, Play, X } from 'lucide-react';

interface PreviousSession {
  sessionId: string;
  technology: string;
  mode: string;
  timestamp: string;
}

export default function AthenaForge() {
  const [mode, setMode] = useState<'learning' | 'troubleshooting' | 'incident' | 'interview' | 'code_review' | 'architecture'>('learning');
  const [technology, setTechnology] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [previousSessions, setPreviousSessions] = useState<PreviousSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load previous sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('athenaSessions');
    if (savedSessions) {
      setPreviousSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Save session to localStorage
  const saveSession = (tech: string, sessId: string, m: string) => {
    const newSession: PreviousSession = {
      sessionId: sessId,
      technology: tech,
      mode: m,
      timestamp: new Date().toISOString(),
    };

    const updatedSessions = [
      newSession,
      ...previousSessions.filter(s => s.sessionId !== sessId)
    ].slice(0, 10); // Keep last 10 sessions

    setPreviousSessions(updatedSessions);
    localStorage.setItem('athenaSessions', JSON.stringify(updatedSessions));
  };

  const handleStartSession = (tech: string) => {
    setTechnology(tech);
    const newSessionId = `ATHENA-${tech.toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`;
    setSessionId(newSessionId);
    setIsSessionActive(true);
    saveSession(tech, newSessionId, mode);
  };

  const handleContinueSession = (session: PreviousSession) => {
    setTechnology(session.technology);
    setSessionId(session.sessionId);
    setMode(session.mode as any);
    setIsSessionActive(true);
    setShowHistory(false);
  };

  const handleNewSession = () => {
    setIsSessionActive(false);
    setSessionId('');
    setTechnology('');
    setShowHistory(false);
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
            {previousSessions.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                <History className="w-4 h-4" />
                History ({previousSessions.length})
              </button>
            )}
            {isSessionActive && (
              <button
                onClick={handleNewSession}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                <Play className="w-4 h-4" />
                New Session
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Session History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Previous Sessions</h3>
              <button onClick={() => setShowHistory(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {previousSessions.map((session, index) => (
                <button
                  key={index}
                  onClick={() => handleContinueSession(session)}
                  className="w-full p-4 bg-[#0a0a0a] rounded-lg text-left hover:bg-[#2a2a2a] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{session.technology}</div>
                    <div className="text-sm text-gray-400">
                      {session.mode} • {session.sessionId}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Sessions are stored locally in your browser
            </p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4">
        {!isSessionActive ? (
          <div className="max-w-3xl mx-auto mt-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Welcome to AthenaForge AI</h2>
              <p className="text-xl text-gray-400">A living engineering companion that understands technology from its creators, learns from its community, operates like a production engineer, and solves problems until they disappear.</p>
              {previousSessions.length > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                  You have {previousSessions.length} previous session{previousSessions.length > 1 ? 's' : ''}.
                  Click "History" to continue where you left off.
                </p>
              )}
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