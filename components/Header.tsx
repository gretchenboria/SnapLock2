import React from 'react';
import { Play, Pause, RotateCcw, Download, Box, Layers, Eye, Trash2, Skull, Database, Circle, StopCircle, ArrowRight } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  onOpenPrompt: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onClear: () => void;
  onExport: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isRecording: boolean;
  onToggleRecord: () => void;
  chaosMode: boolean;
  onToggleChaos: () => void;
  datasetMode: boolean;
  onToggleDatasetMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenPrompt, isPlaying, onTogglePlay, onReset, onClear, onExport, viewMode, setViewMode,
  isRecording, onToggleRecord, chaosMode, onToggleChaos, datasetMode, onToggleDatasetMode
}) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 z-20 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-2 rounded-lg shadow-blue-900/50 shadow-lg">
          <Box className="w-6 h-6 text-white" />
        </div>
        <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">
            SnapLock
            </h1>
            <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase -mt-1">Pipeline V2</div>
        </div>
      </div>

      {/* Guided Workflow Bar */}
      <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-xl">
        
        {/* Step 1: Config */}
        <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">1. Config</span>
            <button 
            onClick={onOpenPrompt}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700"
            >
            Generate
            </button>
            <button 
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            title="Reset Scene"
            >
            <RotateCcw size={16} />
            </button>
        </div>

        <div className="text-slate-700"><ArrowRight size={12} /></div>

        {/* Step 2: Simulate & Record */}
        <div className="flex items-center gap-2 px-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isRecording ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
                2. Capture
            </span>
            <button 
                onClick={onTogglePlay}
                className={`p-1.5 rounded-lg transition-colors ${isPlaying ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                title={isPlaying ? "Pause" : "Simulate"}
            >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            
            <button
                onClick={onToggleRecord}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isRecording 
                    ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-red-500/50 hover:text-red-400'
                }`}
            >
                {isRecording ? <StopCircle size={16} /> : <Circle size={16} />}
                {isRecording ? "STOP REC" : "RECORD"}
            </button>
        </div>

        <div className="text-slate-700"><ArrowRight size={12} /></div>

        {/* Step 3: Export */}
        <div className="flex items-center gap-2 px-2">
             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">3. Export</span>
             <button 
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-blue-900/20"
             >
                <Download size={14} />
                WIZARD
             </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button onClick={() => setViewMode(ViewMode.RGB)} className={`px-2 py-1 text-xs font-bold rounded ${viewMode === ViewMode.RGB ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>RGB</button>
            <button onClick={() => setViewMode(ViewMode.DEPTH)} className={`px-2 py-1 text-xs font-bold rounded ${viewMode === ViewMode.DEPTH ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>DEPTH</button>
            <button onClick={() => setViewMode(ViewMode.LIDAR)} className={`px-2 py-1 text-xs font-bold rounded ${viewMode === ViewMode.LIDAR ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>LIDAR</button>
            <button onClick={() => setViewMode(ViewMode.WIREFRAME)} className={`px-2 py-1 text-xs font-bold rounded ${viewMode === ViewMode.WIREFRAME ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>WIRE</button>
        </div>
      </div>
    </header>
  );
};