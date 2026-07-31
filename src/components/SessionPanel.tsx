'use client';

import { useState } from 'react';

interface SessionPanelProps {
  sessionId: string;
  technology: string;
  mode: string;
}

export function SessionPanel({ sessionId, technology, mode }: SessionPanelProps) {
  const [progress] = useState(0);

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-4">
      <h3 className="font-semibold mb-4">Session Info</h3>

      <div className="space-y-3 text-sm">
        <div>
          <span className="text-gray-400">Technology:</span>
          <div className="font-medium">{technology}</div>
        </div>

        <div>
          <span className="text-gray-400">Mode:</span>
          <div className="font-medium">{mode}</div>
        </div>

        <div>
          <span className="text-gray-400">Progress:</span>
          <div className="mt-1">
            <div className="w-full bg-[#2a2a2a] rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">{progress}% Complete</div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#2a2a2a]">
          <h4 className="text-gray-400 mb-2">Session Features</h4>
          <ul className="space-y-1 text-xs">
            <li>• Continuous learning support</li>
            <li>• Progress tracking</li>
            <li>• Multi-provider AI fallback</li>
            <li>• Production scenarios</li>
          </ul>
        </div>
      </div>
    </div>
  );
}