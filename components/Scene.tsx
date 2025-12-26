import React, { forwardRef, useImperativeHandle, useEffect, useRef, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { OrbitControls, Environment, Grid, Stats } from '@react-three/drei';
import { PhysicsParams, ViewMode, TelemetryData, RecordedFrame, AssetGroup, BoundingBox2D } from '../types';
import { AssetRenderer } from './AssetRenderer';
import * as THREE from 'three';

interface SceneProps {
  config: PhysicsParams;
  isPlaying: boolean;
  viewMode: ViewMode;
  onTelemetryUpdate: (data: TelemetryData) => void;
  isRecording: boolean;
  onRecordingData: (frames: RecordedFrame[], videoBlob: Blob, width: number, height: number) => void;
}

// Recorder component that lives inside the Canvas context to access GL and Camera
const Recorder = ({ isRecording, onStop, config, frameDataRef }: { 
    isRecording: boolean, 
    onStop: (blob: Blob, width: number, height: number) => void, 
    config: PhysicsParams,
    frameDataRef: React.MutableRefObject<RecordedFrame[]>
}) => {
    const { gl, scene, camera } = useThree();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const recordingSizeRef = useRef({ width: 0, height: 0 });

    useEffect(() => {
        if (isRecording) {
            chunksRef.current = [];
            frameDataRef.current = [];
            
            // Capture the drawing buffer dimensions (Physical Pixels)
            // This ensures BBoxes match the video regardless of Screen DPI
            const width = gl.domElement.width;
            const height = gl.domElement.height;
            recordingSizeRef.current = { width, height };

            const stream = gl.domElement.captureStream(30); // 30 FPS
            const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') 
                ? 'video/webm; codecs=vp9' 
                : 'video/webm';
            
            const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
            
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                onStop(blob, recordingSizeRef.current.width, recordingSizeRef.current.height);
            };
            
            recorder.start();
            mediaRecorderRef.current = recorder;
        } else {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        }
    }, [isRecording, gl]);

    // Frame-by-frame data capture
    useFrame(() => {
        if (!isRecording) return;

        const width = gl.domElement.width;
        const height = gl.domElement.height;
        const widthHalf = width / 2;
        const heightHalf = height / 2;
        const frameObjects: BoundingBox2D[] = [];
        
        // Helper to project 3D point to 2D screen space (Pixels)
        const toScreen = (v: THREE.Vector3) => {
            v.project(camera);
            return {
                x: (v.x * widthHalf) + widthHalf,
                y: -(v.y * heightHalf) + heightHalf
            };
        };

        // Reuse Box3 to reduce GC
        const box3 = new THREE.Box3();
        const corners = new Array(8).fill(0).map(() => new THREE.Vector3());

        scene.traverse((obj) => {
             // Look for meshes tagged by AssetRenderer
             if (obj.userData && obj.userData.groupId) {
                 const group = config.assetGroups.find(g => g.id === obj.userData.groupId);
                 if (group) {
                    // Calculate precise Bounding Box from the visual mesh
                    // This handles rotations and custom GLB shapes automatically
                    box3.setFromObject(obj);

                    if (box3.isEmpty()) return;

                    // Get the 8 corners of the World AABB? 
                    // No, setFromObject returns an Axis-Aligned Box in World Space.
                    // This is "loose" if the object is rotated diagonally, but much faster and standard for weak supervision.
                    // For tighter boxes on rotated objects, we'd need Oriented Bounding Boxes (OBB),
                    // but Three.js OBB isn't standard in the core traversal yet. 
                    // World AABB is a safe over-estimation that guarantees inclusion.
                    
                    // Optimization: Just project the min/max of the world AABB?
                    // No, because in perspective view, the screen-space box of a world-space box isn't just the projection of min/max.
                    // We must project all 8 corners of the World AABB.

                    corners[0].set(box3.min.x, box3.min.y, box3.min.z);
                    corners[1].set(box3.min.x, box3.min.y, box3.max.z);
                    corners[2].set(box3.min.x, box3.max.y, box3.min.z);
                    corners[3].set(box3.min.x, box3.max.y, box3.max.z);
                    corners[4].set(box3.max.x, box3.min.y, box3.min.z);
                    corners[5].set(box3.max.x, box3.min.y, box3.max.z);
                    corners[6].set(box3.max.x, box3.max.y, box3.min.z);
                    corners[7].set(box3.max.x, box3.max.y, box3.max.z);

                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    
                    // Project all corners
                    let visiblePoints = 0;
                    corners.forEach(c => {
                        const s = toScreen(c);
                        if (s.x >= 0 && s.x <= width && s.y >= 0 && s.y <= height) visiblePoints++;
                        if (minX > s.x) minX = s.x;
                        if (minY > s.y) minY = s.y;
                        if (maxX < s.x) maxX = s.x;
                        if (maxY < s.y) maxY = s.y;
                    });
                    
                    // Simple visibility check: if box is completely off-screen, skip
                    // Or if behind camera (z check needed in projection, but standard project() handles direction somewhat)
                    // We clamp to screen dims
                    const clampedMinX = Math.max(0, minX);
                    const clampedMinY = Math.max(0, minY);
                    const clampedMaxX = Math.min(width, maxX);
                    const clampedMaxY = Math.min(height, maxY);

                    // Check if valid area and at least partially on screen
                    if (clampedMaxX > clampedMinX && clampedMaxY > clampedMinY) {
                         // Check distance from camera to avoid occluded/far objects?
                         // For now, we capture everything in frustum.
                        frameObjects.push({
                            x: clampedMinX,
                            y: clampedMinY,
                            width: clampedMaxX - clampedMinX,
                            height: clampedMaxY - clampedMinY,
                            label: group.name,
                            classId: config.assetGroups.indexOf(group) + 1 // 1-based index
                        });
                    }
                 }
             }
        });

        frameDataRef.current.push({
            frameId: frameDataRef.current.length,
            timestamp: Date.now(),
            objects: frameObjects,
            camera: {
                position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
                target: { x: 0, y: 0, z: 0 }
            }
        });
    });

    return null;
}

export const Scene = forwardRef<any, SceneProps>(({ config, isPlaying, viewMode, onTelemetryUpdate, isRecording, onRecordingData }, ref) => {
  const frameDataRef = useRef<RecordedFrame[]>([]);
  
  const handleRecordingStop = (blob: Blob, width: number, height: number) => {
    onRecordingData(frameDataRef.current, blob, width, height);
  };

  // Expose a handle to the parent component (App.tsx)
  useImperativeHandle(ref, () => ({
    captureSnapshot: () => console.log("Snapshot capture triggered")
  }));

  const isDebug = viewMode === ViewMode.WIREFRAME || viewMode === ViewMode.LIDAR;

  return (
    <div className="w-full h-full relative group">
      <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }} gl={{ preserveDrawingBuffer: true, antialias: true }}>
        <color attach="background" args={[viewMode === ViewMode.WIREFRAME ? '#000000' : '#0f172a']} />
        
        <Recorder 
            isRecording={isRecording} 
            onStop={handleRecordingStop} 
            config={config} 
            frameDataRef={frameDataRef}
        />

        <ambientLight intensity={config.scene.environment.ambientLightIntensity} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={config.scene.environment.directionalLightIntensity} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <Environment preset="city" />

        <Physics 
          gravity={[config.gravity.x, config.gravity.y, config.gravity.z]} 
          timeStep={config.simulation.timeStep || 1/60}
          paused={!isPlaying}
          debug={isDebug} 
        >
          <RigidBody type="fixed" position={[0, -1, 0]} restitution={0.2} friction={1}>
            <CuboidCollider args={[500, 1, 500]} /> 
          </RigidBody>

          <Suspense fallback={null}>
            {config.assetGroups.map((group) => (
                <AssetRenderer key={group.id} group={group} viewMode={viewMode} />
            ))}
          </Suspense>
        </Physics>

        <Grid 
            infiniteGrid 
            fadeDistance={50} 
            sectionColor="#475569" 
            cellColor="#1e293b" 
            position={[0, -0.01, 0]} 
        />
        
        <OrbitControls makeDefault />
        <Stats className="!left-auto !right-0 !top-12" />
      </Canvas>
      
      {/* Recording Overlay Inside Scene Container */}
      {isRecording && (
        <div className="absolute top-4 left-4 pointer-events-none">
            <div className="bg-red-900/80 backdrop-blur text-red-100 px-4 py-2 rounded-lg border border-red-500 font-mono text-xs shadow-lg flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                    <span className="font-bold">RECORDING BUFFER</span>
                </div>
                <div className="opacity-75">CAPTURING RAW FRAMES</div>
            </div>
        </div>
      )}
    </div>
  );
});

Scene.displayName = 'Scene';