'use client';

import { useState } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface ChatInterfaceProps {
  sessionId: string;
  technology: string;
  mode: string;
}

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  metadata?: any;
}

export function ChatInterface({ sessionId, technology, mode }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Started ${mode} mode for ${technology}. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          mode,
          technology,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle structured error responses
        const errorMessage = data.error || 'An error occurred';
        const errorDetails = data.details || '';
        const errorAction = data.action || '';

        let fullError = errorMessage;
        if (errorDetails) fullError += `\n\nDetails: ${errorDetails}`;
        if (errorAction) fullError += `\n\nAction: ${errorAction}`;
        if (data.providers) fullError += `\n\nAvailable providers: ${data.providers}`;

        setMessages((prev) => [
          ...prev,
          { role: 'error', content: fullError, metadata: data },
        ]);
        setError(errorMessage);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
      }
    } catch (error: any) {
      const errorMsg = 'Network error: Unable to connect to the server';
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: errorMsg },
      ]);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageStyle = (msg: Message) => {
    if (msg.role === 'error') {
      return 'bg-red-900/20 border border-red-500/50 text-red-400';
    }
    if (msg.role === 'user') {
      return 'user-message';
    }
    return 'assistant-message';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{technology} - {mode} Mode</h3>
          <p className="text-xs text-gray-400">Session: {sessionId}</p>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Error occurred</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 chat-container space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`message-bubble ${getMessageStyle(msg)} max-w-[90%]`}>
              {msg.role === 'error' && (
                <div className="flex items-center gap-2 mb-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-semibold">Error</span>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              {msg.metadata && msg.metadata.providers && (
                <div className="mt-2 text-xs opacity-70">
                  Required: Add at least one API key from the list above
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="message-bubble assistant-message flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#2a2a2a]">
        {error && (
          <div className="mb-2 p-2 bg-red-900/20 border border-red-500/50 rounded text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Status: {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} |
          Database: {process.env.DATABASE_URL ? 'Configured' : 'Not configured'} |
          AI Providers: Check environment variables
        </p>
      </div>
    </div>
  );
}