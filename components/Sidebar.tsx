import React, { useState, useRef } from 'react';
import { PhysicsParams, AssetGroup, JointConfig } from '../types';
import { Layers, Wind, Sun, Settings2, Box, Bot, Circle, Cylinder, UploadCloud, Container, Truck, Sliders } from 'lucide-react';

interface SidebarProps {
  config: PhysicsParams;
  onAddAsset?: (asset: Partial<AssetGroup>) => void;
  onUpdateAsset?: (id: string, updates: Partial<AssetGroup>) => void;
}

const ASSET_LIBRARY = [
  {
    category: 'Robots (Kinematic)',
    items: [
      { name: 'Franka Panda', modelId: 'franka_panda', icon: Bot, color: '#ffffff', dimensions: { x: 0.5, y: 1.2, z: 0.5 }, mass: 50, rigidBodyType: 'KINEMATIC' },
      { name: 'UR5 Arm', modelId: 'ur5_arm', icon: Bot, color: '#3b82f6', dimensions: { x: 0.5, y: 1.2, z: 0.5 }, mass: 40, rigidBodyType: 'KINEMATIC' },
      { name: 'Spot (Quadruped)', modelId: 'spot_dog', icon: Bot, color: '#eab308', dimensions: { x: 0.4, y: 0.6, z: 1.0 }, mass: 30, rigidBodyType: 'KINEMATIC' },
      { name: 'Drone', modelId: 'quadcopter_drone', icon: Bot, color: '#6366f1', dimensions: { x: 0.5, y: 0.3, z: 0.5 }, mass: 2, rigidBodyType: 'DYNAMIC' },
    ]
  },
  {
    category: 'Industrial Objects',
    items: [
      { name: 'Cardboard Box', modelId: 'cardboard_box', icon: Box, color: '#d4b483', dimensions: { x: 0.6, y: 0.4, z: 0.6 }, mass: 2, rigidBodyType: 'DYNAMIC' },
      { name: 'Metal Barrel', modelId: 'metal_barrel', icon: Cylinder, color: '#2563eb', dimensions: { x: 0.6, y: 1.0, z: 0.6 }, mass: 20, rigidBodyType: 'DYNAMIC' },
      { name: 'Conveyor', modelId: 'conveyor_belt', icon: Truck, color: '#334155', dimensions: { x: 1.0, y: 0.5, z: 3.0 }, mass: 1000, rigidBodyType: 'STATIC' },
    ]
  },
  {
    category: 'Primitives',
    items: [
      { name: 'Cube', shape: 'CUBE', icon: Box, color: '#ef4444', dimensions: { x: 1, y: 1, z: 1 }, mass: 1, rigidBodyType: 'DYNAMIC' },
      { name: 'Sphere', shape: 'SPHERE', icon: Circle, color: '#3b82f6', dimensions: { x: 0.5, y: 0, z: 0 }, mass: 1, rigidBodyType: 'DYNAMIC' },
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ config, onAddAsset, onUpdateAsset }) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'library'>('library');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const simRateHz = Math.round(1 / (config.simulation.timeStep || 1/60));

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    
    // Default 4DOF joints for a generic arm upload
    const defaultJoints: JointConfig[] = [
        { name: 'Base', axis: 'y', value: 0, min: -180, max: 180 },
        { name: 'Shoulder', axis: 'x', value: 0, min: -90, max: 90 },
        { name: 'Elbow', axis: 'x', value: 0, min: -90, max: 90 },
        { name: 'Gripper', axis: 'z', value: 0, min: 0, max: 60 },
    ];

    onAddAsset?.({
      name: file.name.replace('.glb', '').replace('.gltf', ''),
      shape: 'MODEL',
      color: '#ffffff',
      modelUrl: objectUrl,
      dimensions: { x: 1, y: 1, z: 1 },
      mass: 5,
      rigidBodyType: 'KINEMATIC',
      spawnPosition: { x: 0, y: 0, z: 0 },
      joints: defaultJoints
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveTab('inspector');
  };

  const selectedAsset = config.assetGroups.find(g => g.id === selectedAssetId);

  const updateJoint = (assetId: string, jointIndex: number, newValue: number) => {
    if (!onUpdateAsset || !selectedAsset || !selectedAsset.joints) return;
    const newJoints = [...selectedAsset.joints];
    newJoints[jointIndex] = { ...newJoints[jointIndex], value: newValue };
    onUpdateAsset(assetId, { joints: newJoints });
  };

  const updateJointName = (assetId: string, jointIndex: number, newName: string) => {
    if (!onUpdateAsset || !selectedAsset || !selectedAsset.joints) return;
    const newJoints = [...selectedAsset.joints];
    newJoints[jointIndex] = { ...newJoints[jointIndex], name: newName };
    onUpdateAsset(assetId, { joints: newJoints });
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col overflow-hidden shrink-0 z-10">
      <div className="flex border-b border-slate-800">
        <button onClick={() => setActiveTab('library')} className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'library' ? 'text-blue-400 border-blue-500 bg-slate-800/50' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
          ASSETS
        </button>
        <button onClick={() => setActiveTab('inspector')} className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'inspector' ? 'text-blue-400 border-blue-500 bg-slate-800/50' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
          INSPECTOR
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'library' ? (
          <div className="p-4 space-y-6">
            <div className="bg-slate-800/50 rounded-xl border border-dashed border-slate-600 p-4 text-center hover:bg-slate-800 hover:border-blue-500 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} className="hidden" accept=".glb,.gltf" onChange={handleFileUpload}/>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-700 group-hover:bg-blue-600/20 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                        <UploadCloud size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-300">UPLOAD GLB</span>
                </div>
            </div>

            <div className="h-px bg-slate-800" />

            {ASSET_LIBRARY.map((category) => (
              <div key={category.category}>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{category.category}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {category.items.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => onAddAsset?.({
                        name: item.name,
                        shape: (item as any).shape || 'MODEL',
                        modelId: (item as any).modelId,
                        color: item.color,
                        dimensions: item.dimensions,
                        mass: (item as any).mass,
                        rigidBodyType: (item as any).rigidBodyType as any,
                        spawnPosition: { x: 0, y: 2, z: 0 },
                        // Add default joints if it's a robot
                        joints: category.category.includes('Robot') ? [
                            { name: 'Root', axis: 'y', value: 0, min: -180, max: 180 },
                            { name: 'Arm_1', axis: 'x', value: 0, min: -90, max: 90 },
                            { name: 'Arm_2', axis: 'x', value: 0, min: -90, max: 90 },
                        ] : undefined
                      })}
                      className="flex flex-col items-start gap-2 p-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all hover:border-blue-500/50 group text-left"
                    >
                      <div className="w-full aspect-video bg-slate-900 rounded flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                        <item.icon size={20} />
                      </div>
                      <div>
                          <div className="text-xs font-bold text-slate-300 group-hover:text-white">{item.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{(item as any).rigidBodyType || 'DYNAMIC'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">SCENE CONFIG</h2>
               <div className="space-y-2">
                {config.assetGroups.map((group) => (
                  <div 
                    key={group.id} 
                    onClick={() => setSelectedAssetId(group.id)}
                    className={`bg-slate-800/50 rounded-lg p-2 border cursor-pointer transition-colors group ${selectedAssetId === group.id ? 'border-blue-500 bg-slate-800' : 'border-slate-700/50 hover:border-blue-500/30'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }}></div>
                      <span className="font-bold text-xs text-slate-200">{group.name}</span>
                      <span className="ml-auto text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">{group.rigidBodyType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedAsset && selectedAsset.joints && (
                <div className="p-4 border-b border-slate-800 bg-slate-800/20">
                    <h2 className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4">
                        <Sliders size={12} /> JOINT CONTROLS
                    </h2>
                    <div className="space-y-4">
                        {selectedAsset.joints.map((joint, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <input 
                                        type="text" 
                                        value={joint.name}
                                        onChange={(e) => updateJointName(selectedAsset.id, idx, e.target.value)}
                                        className="bg-transparent border-none text-slate-400 w-24 focus:text-white outline-none"
                                        title="Node Name (matches GLB)"
                                    />
                                    <span className="font-mono text-blue-300">{joint.value}°</span>
                                </div>
                                <input 
                                    type="range"
                                    min={joint.min}
                                    max={joint.max}
                                    value={joint.value}
                                    onChange={(e) => updateJoint(selectedAsset.id, idx, parseInt(e.target.value))}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between text-[8px] text-slate-600 font-mono">
                                    <span>{joint.min}°</span>
                                    <span className="uppercase">{joint.axis}-AXIS</span>
                                    <span>{joint.max}°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-2 bg-blue-900/20 rounded border border-blue-900/50 text-[10px] text-blue-200">
                        Tip: Open browser console to see exact Node Names of your model to map controls correctly.
                    </div>
                </div>
            )}

            <div className="p-4 border-b border-slate-800">
              <h2 className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                <Settings2 size={12} /> GLOBAL PARAMS
              </h2>
              
              <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center bg-slate-800 p-2 rounded">
                      <span className="text-slate-400">Timestep</span>
                      <div className="text-right">
                          <div className="font-mono text-emerald-400 font-bold">{simRateHz} Hz</div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};