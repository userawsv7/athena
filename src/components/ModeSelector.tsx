'use client';

interface ModeSelectorProps {
  selectedMode: string;
  onModeSelect: (mode: any) => void;
}

const modes = [
  { id: 'learning', label: 'Learning Mode', icon: '📚' },
  { id: 'troubleshooting', label: 'Troubleshooting Mode', icon: '🔧' },
  { id: 'incident', label: 'Incident Simulation', icon: '🚨' },
  { id: 'interview', label: 'Interview Mode', icon: '🎯' },
  { id: 'code_review', label: 'Code Review', icon: '👁️' },
  { id: 'architecture', label: 'Architecture Review', icon: '🏗️' },
];

export function ModeSelector({ selectedMode, onModeSelect }: ModeSelectorProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">Select Mode</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeSelect(mode.id)}
            className={`p-4 rounded-lg border transition-all ${
              selectedMode === mode.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-[#2a2a2a] hover:border-[#4a4a4a]'
            }`}
          >
            <div className="text-2xl mb-2">{mode.icon}</div>
            <div className="text-sm font-medium">{mode.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}