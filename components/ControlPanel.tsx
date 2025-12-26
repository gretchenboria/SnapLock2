import React from 'react';
import { TelemetryData } from '../types';
import { Activity, Database, Zap, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ControlPanelProps {
  telemetry: TelemetryData;
}

const TelemetryItem = ({ icon: Icon, label, value, unit, colorClass = "text-slate-200" }: { icon: any, label: string, value: string | number, unit?: string, colorClass?: string }) => (
  <div className="flex flex-col px-6 border-r border-slate-700/50 last:border-0 min-w-[140px]">
    <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
      <Icon size={12} />
      <span>{label}</span>
    </div>
    <div className={`text-2xl font-mono font-bold ${colorClass}`}>
      {value}
      {unit && <span className="text-sm text-slate-500 ml-1 font-sans font-normal">{unit}</span>}
    </div>
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({ telemetry }) => {
  return (
    <div className="h-24 bg-slate-900 border-t border-slate-700 flex items-center shrink-0 z-20 overflow-x-auto px-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-50"></div>
      
      <div className="flex items-center mr-8">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></div>
        <span className="text-xs font-bold text-emerald-500 tracking-wider">LIVE TELEMETRY</span>
      </div>

      <TelemetryItem 
        icon={Activity} 
        label="Sim Rate" 
        value={telemetry.fps} 
        unit="Hz" 
        colorClass={telemetry.fps > 55 ? "text-emerald-400" : "text-orange-400"}
      />
      <TelemetryItem 
        icon={Database} 
        label="Particles" 
        value={telemetry.particleCount} 
        colorClass="text-blue-400"
      />
      <TelemetryItem 
        icon={Zap} 
        label="Kinetic Energy" 
        value={telemetry.systemEnergy.toFixed(1)} 
        unit="kJ"
        colorClass="text-purple-400"
      />
       <TelemetryItem 
        icon={telemetry.isStable ? CheckCircle2 : AlertTriangle} 
        label="Stability" 
        value={telemetry.isStable ? "STABLE" : "UNSTABLE"} 
        colorClass={telemetry.isStable ? "text-slate-200" : "text-red-400"}
      />
    </div>
  );
};
