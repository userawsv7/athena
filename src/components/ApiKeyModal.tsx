'use client';

import { useState, useEffect } from 'react';
import { X, Key, AlertCircle, CheckCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keys: Record<string, string>) => void;
}

const API_PROVIDERS = [
  { name: 'GROQ_API_KEY', displayName: 'Groq', description: 'Fast inference, free tier available', url: 'https://console.groq.com/keys' },
  { name: 'GEMINI_API_KEY', displayName: 'Google Gemini', description: 'Google AI, free tier available', url: 'https://makersuite.google.com/app/apikey' },
  { name: 'HF_API_KEY', displayName: 'Hugging Face', description: 'Open source models, free tier', url: 'https://huggingface.co/settings/tokens' },
  { name: 'OPENROUTER_API_KEY', displayName: 'OpenRouter', description: 'Multiple models, free credits', url: 'https://openrouter.ai/keys' },
  { name: 'MISTRAL_API_KEY', displayName: 'Mistral AI', description: 'European AI, free tier', url: 'https://console.mistral.ai/api-keys' },
  { name: 'COHERE_API_KEY', displayName: 'Cohere', description: 'Enterprise AI, free tier', url: 'https://dashboard.cohere.ai/api-keys' },
  { name: 'DEEPINFRA_API_KEY', displayName: 'DeepInfra', description: 'Open source hosting, free credits', url: 'https://deepinfra.com/dash/api_keys' },
  { name: 'CEREBRAS_API_KEY', displayName: 'Cerebras', description: 'Fast inference, free tier', url: 'https://cloud.cerebras.ai/platform' },
  { name: 'SAMBANOVA_API_KEY', displayName: 'SambaNova', description: 'Enterprise AI, free tier', url: 'https://cloud.sambanova.ai/apis' },
  { name: 'FIREWORKS_API_KEY', displayName: 'Fireworks AI', description: 'Fast inference, free tier', url: 'https://fireworks.ai/account/api-keys' },
  { name: 'REPLICATE_API_KEY', displayName: 'Replicate', description: 'ML models, free credits', url: 'https://replicate.com/account/api-tokens' },
  { name: 'CLOUDFLARE_AI_API_KEY', displayName: 'Cloudflare AI', description: 'Edge AI, free tier', url: 'https://dash.cloudflare.com/profile/api-tokens' },
];

export function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');

  // Load saved keys from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedKeys = localStorage.getItem('athenaApiKeys');
      if (savedKeys) {
        const parsed = JSON.parse(savedKeys);
        setApiKeys(parsed);
        // Pre-select keys that have values
        const withValues = new Set(Object.keys(parsed).filter(k => parsed[k]));
        setSelectedKeys(withValues);
      }
    }
  }, [isOpen]);

  const handleKeyChange = (providerName: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [providerName]: value
    }));

    // Auto-select when key is entered
    if (value.trim()) {
      setSelectedKeys(prev => new Set([...prev, providerName]));
    } else {
      setSelectedKeys(prev => {
        const next = new Set(prev);
        next.delete(providerName);
        return next;
      });
    }
    setError('');
  };

  const toggleProvider = (providerName: string) => {
    const newSelected = new Set(selectedKeys);
    if (newSelected.has(providerName)) {
      newSelected.delete(providerName);
    } else {
      newSelected.add(providerName);
    }
    setSelectedKeys(newSelected);
    setError('');
  };

  const handleSave = () => {
    // Get only the selected keys with values
    const keysToSave: Record<string, string> = {};
    selectedKeys.forEach(key => {
      if (apiKeys[key] && apiKeys[key].trim()) {
        keysToSave[key] = apiKeys[key].trim();
      }
    });

    if (Object.keys(keysToSave).length < 2) {
      setError('Please provide at least 2 API keys for redundancy');
      return;
    }

    // Save to localStorage
    localStorage.setItem('athenaApiKeys', JSON.stringify(keysToSave));
    onSave(keysToSave);
    onClose();
  };

  const selectedCount = Array.from(selectedKeys).filter(k => apiKeys[k] && apiKeys[k].trim()).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Key className="w-6 h-6" />
              Configure AI Provider API Keys
            </h2>
            <p className="text-gray-400 mt-1">Enter your API keys below. Minimum 2 required for redundancy.</p>
          </div>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
          <p className="text-blue-400 text-sm">
            💡 <strong>Tip:</strong> All listed providers offer free tiers. Get your API keys from the links provided.
            Selected: <strong>{selectedCount}</strong> / 12 providers
          </p>
        </div>

        <div className="grid gap-4">
          {API_PROVIDERS.map((provider) => {
            const isSelected = selectedKeys.has(provider.name);
            const hasValue = apiKeys[provider.name] && apiKeys[provider.name].trim();

            return (
              <div
                key={provider.name}
                className={`p-4 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleProvider(provider.name)}
                    className="mt-1 w-4 h-4 accent-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {provider.displayName}
                          <code className="text-xs bg-[#2a2a2a] px-2 py-0.5 rounded font-mono text-gray-400">
                            {provider.name}
                          </code>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{provider.description}</p>
                        <a
                          href={provider.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                        >
                          Get API key →
                        </a>
                      </div>
                      {hasValue && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {isSelected && (
                      <div className="mt-3">
                        <input
                          type="password"
                          value={apiKeys[provider.name] || ''}
                          onChange={(e) => handleKeyChange(provider.name, e.target.value)}
                          placeholder={`Enter your ${provider.name}`}
                          className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Keys are stored locally in your browser and never sent to our servers.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedCount < 2}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save API Keys ({selectedCount} selected)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}