import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Scene } from './components/Scene';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { PromptModal } from './components/PromptModal';
import { ExportWizard } from './components/ExportWizard';
import { PhysicsParams, ViewMode, TelemetryData, AssetGroup, RecordedSession, RecordedFrame } from './types';
import { generateSceneConfig } from './services/geminiService';

const DEFAULT_SCENE: PhysicsParams = {
  gravity: { x: 0, y: -9.81, z: 0 },
  simulation: {
    timeStep: 1 / 120, 
    substeps: 4
  },
  assetGroups: [
    {
      id: 'default_robot',
      name: 'Franka Panda',
      count: 1,
      shape: 'MODEL',
      modelId: 'franka_panda',
      color: '#ffffff',
      spawnMode: 'SINGLE',
      scale: 1,
      rigidBodyType: 'KINEMATIC',
      mass: 50,
      friction: 0.8,
      restitution: 0.1,
      linearDamping: 0.5,
      angularDamping: 0.5,
      dimensions: { x: 0.5, y: 1.5, z: 0.5 },
      spawnPosition: { x: 0, y: 0.1, z: 0 },
      joints: [
        { name: 'panda_link1', axis: 'y', value: 0, min: -180, max: 180 },
        { name: 'panda_link3', axis: 'x', value: 0, min: -90, max: 90 },
        { name: 'panda_link5', axis: 'x', value: 0, min: -90, max: 90 }
      ]
    }
  ],
  scene: {
    id: 'demo',
    name: 'Robot Workcell',
    description: 'Standard industrial configuration.',
    environment: {
      floorColor: '#0f172a',
      ambientLightIntensity: 0.7,
      directionalLightIntensity: 2.0
    }
  }
};

const App: React.FC = () => {
  const [physicsParams, setPhysicsParams] = useState<PhysicsParams>(DEFAULT_SCENE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.RGB);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sceneKey, setSceneKey] = useState(0); 
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    fps: 0, particleCount: 0, systemEnergy: 0, collisions: 0, isStable: true
  });

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<string>("");
  const [recordedSession, setRecordedSession] = useState<RecordedSession | null>(null);
  const [isExportWizardOpen, setIsExportWizardOpen] = useState(false);

  const [chaosMode, setChaosMode] = useState(false);
  const [datasetMode, setDatasetMode] = useState(false);

  const sceneRef = useRef<any>(null);

  // DATASET MODE: Auto-generation loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (datasetMode) {
        interval = setInterval(() => {
            setPhysicsParams(prev => {
                const newGroups = prev.assetGroups.map(g => ({
                    ...g,
                    color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
                    spawnPosition: {
                        x: g.spawnPosition.x + (Math.random() - 0.5) * 0.2,
                        y: g.spawnPosition.y,
                        z: g.spawnPosition.z + (Math.random() - 0.5) * 0.2
                    }
                }));
                return { ...prev, assetGroups: newGroups };
            });
            setSceneKey(k => k + 1);
        }, 15000);
    }
    return () => clearInterval(interval);
  }, [datasetMode]);

  const handleGenerateScene = async (prompt: string) => {
    setIsLoading(true);
    try {
      const newConfig = await generateSceneConfig(prompt);
      setPhysicsParams(newConfig);
      setIsModalOpen(false);
      setIsPlaying(false); 
      setSceneKey(prev => prev + 1); 
    } catch (error) {
      console.error("Failed to generate scene:", error);
      alert("Failed to generate scene. Check API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAsset = (template: Partial<AssetGroup>) => {
    const newAsset: AssetGroup = {
      id: `manual_${Date.now()}`,
      name: template.name || 'New Object',
      count: 1,
      shape: template.shape || 'CUBE',
      modelId: template.modelId,
      modelUrl: template.modelUrl,
      color: template.color || '#ef4444',
      spawnMode: 'SINGLE',
      scale: template.scale || 1,
      rigidBodyType: template.rigidBodyType || 'DYNAMIC',
      mass: template.mass || 1,
      friction: template.friction || 0.5,
      restitution: template.restitution || 0.5,
      linearDamping: 0.1,
      angularDamping: 0.1,
      dimensions: template.dimensions || { x: 1, y: 1, z: 1 },
      spawnPosition: template.spawnPosition || { x: 0, y: 2, z: 0 },
      joints: template.joints
    };

    setPhysicsParams(prev => ({
      ...prev,
      assetGroups: [...prev.assetGroups, newAsset]
    }));
  };

  const handleUpdateAsset = (id: string, updates: Partial<AssetGroup>) => {
      setPhysicsParams(prev => ({
          ...prev,
          assetGroups: prev.assetGroups.map(g => g.id === id ? { ...g, ...updates } : g)
      }));
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setRecordingStartTime(new Date().toISOString());
      setIsPlaying(true);
      setIsRecording(true);
    } else {
      setIsRecording(false);
      // Wait for the Scene to call onRecordingData with the final blob
      setIsPlaying(false);
    }
  };

  const handleRecordingData = (frames: RecordedFrame[], videoBlob: Blob, width: number, height: number) => {
    setRecordedSession({
      frames,
      videoBlob,
      startTime: recordingStartTime,
      endTime: new Date().toISOString(),
      params: physicsParams,
      resolution: { width, height }
    });
    setIsExportWizardOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30">
      <Header 
        onOpenPrompt={() => setIsModalOpen(true)}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onReset={() => setSceneKey(k => k + 1)}
        onClear={() => { setPhysicsParams({...DEFAULT_SCENE, assetGroups: []}); setSceneKey(k => k + 1); }}
        onExport={() => setIsExportWizardOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isRecording={isRecording}
        onToggleRecord={toggleRecording}
        chaosMode={chaosMode}
        onToggleChaos={() => setChaosMode(!chaosMode)}
        datasetMode={datasetMode}
        onToggleDatasetMode={() => setDatasetMode(!datasetMode)}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          config={physicsParams} 
          onAddAsset={handleAddAsset}
          onUpdateAsset={handleUpdateAsset}
        />
        
        <div className="flex-1 relative bg-black">
          {datasetMode && (
              <div className="absolute top-4 left-4 z-10 bg-purple-900/80 backdrop-blur text-purple-100 px-3 py-1 rounded-full text-xs border border-purple-500 font-mono animate-pulse">
                  DATASET MODE: GENERATING VARIATIONS
              </div>
          )}
          {isRecording && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-red-900/80 backdrop-blur text-red-100 px-3 py-1 rounded-full text-xs border border-red-500 font-mono">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                  REC 00:0{Math.floor(Date.now() / 1000) % 10}
              </div>
          )}
          
          <Scene 
            key={sceneKey}
            ref={sceneRef}
            config={physicsParams}
            isPlaying={isPlaying}
            viewMode={viewMode}
            onTelemetryUpdate={setTelemetry}
            isRecording={isRecording}
            onRecordingData={handleRecordingData}
          />
          
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                <h2 className="text-2xl font-bold text-white mb-2">Architecting Scene</h2>
                <p className="text-sm text-blue-400 font-mono">GEMINI 3.0 // ANALYZING PROMPT</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ControlPanel telemetry={telemetry} />
      
      {isModalOpen && (
        <PromptModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleGenerateScene}
          loading={isLoading}
        />
      )}

      {isExportWizardOpen && recordedSession && (
        <ExportWizard 
          session={recordedSession} 
          onClose={() => setIsExportWizardOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;