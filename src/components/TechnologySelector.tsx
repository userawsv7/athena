'use client';

import { useState } from 'react';

interface TechnologySelectorProps {
  onStartSession: (technology: string) => void;
}

const technologies = [
  'Kubernetes',
  'Docker',
  'Terraform',
  'AWS',
  'Python',
  'Go',
  'React',
  'PostgreSQL',
  'Redis',
  'Kafka',
];

export function TechnologySelector({ onStartSession }: TechnologySelectorProps) {
  const [customTech, setCustomTech] = useState('');

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Select Technology</h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {technologies.map((tech) => (
          <button
            key={tech}
            onClick={() => onStartSession(tech)}
            className="p-4 rounded-lg border border-[#2a2a2a] hover:border-blue-500 transition-all hover:bg-blue-500/10"
          >
            {tech}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Or enter custom technology"
          value={customTech}
          onChange={(e) => setCustomTech(e.target.value)}
          className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && customTech) {
              onStartSession(customTech);
            }
          }}
        />
        <button
          onClick={() => customTech && onStartSession(customTech)}
          disabled={!customTech}
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Session
        </button>
      </div>
    </div>
  );
}