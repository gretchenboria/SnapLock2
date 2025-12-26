import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';

interface PromptModalProps {
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  loading: boolean;
}

const EXAMPLE_PROMPTS = [
  "A warehouse floor with 50 falling cardboard boxes and a few heavy metal spheres.",
  "Zero gravity environment with floating colorful capsules bumping into each other.",
  "A bowling alley setup with 10 pins and a heavy ball rolling towards them."
];

export const PromptModal: React.FC<PromptModalProps> = ({ onClose, onSubmit, loading }) => {
  const [prompt, setPrompt] = useState("");

  if (loading) return null; // Handled by App overlay

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-lg">
                <Sparkles className="text-blue-400" size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Generate Physics Scene</h2>
                <p className="text-sm text-slate-400">Powered by Gemini 3.0</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Describe the scene you want to simulate
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none mb-4"
            placeholder="e.g., A chaotic room with 100 bouncing red rubber balls..."
          />

          <div className="mb-6">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Examples</span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(p)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-full border border-slate-700 transition-colors text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {!process.env.API_KEY && (
             <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3 flex items-start gap-3 mb-4">
                <AlertCircle className="text-red-400 shrink-0" size={20} />
                <div className="text-sm text-red-200">
                    <p className="font-semibold">Missing API Key</p>
                    <p className="opacity-80">This feature requires a Gemini API Key in the environment.</p>
                </div>
             </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(prompt)}
              disabled={!prompt.trim() || !process.env.API_KEY}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Generate Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};