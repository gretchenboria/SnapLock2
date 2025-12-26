export interface Vector3Data {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions {
  x: number;
  y: number;
  z: number;
}

export type ShapeType = 'CUBE' | 'SPHERE' | 'CYLINDER' | 'CAPSULE' | 'MODEL';
export type SpawnMode = 'GRID' | 'RANDOM' | 'CIRCLE' | 'SINGLE';
export type RigidBodyType = 'DYNAMIC' | 'KINEMATIC' | 'STATIC';

export interface JointConfig {
  name: string;      // The name of the node in the GLB file (e.g., "Base", "Arm_01")
  axis: 'x' | 'y' | 'z';
  value: number;     // Current rotation in degrees
  min: number;       // Min rotation
  max: number;       // Max rotation
}

export interface AssetGroup {
  id: string;
  name: string;
  count: number;
  shape: ShapeType;
  modelId?: string; // NEW: Specific ID for the Model Library (e.g., 'ur5_arm')
  modelUrl?: string; // Fallback for custom uploads
  color: string;
  spawnMode: SpawnMode;
  scale: number;
  rigidBodyType: RigidBodyType;
  mass: number;
  friction: number;
  restitution: number;
  linearDamping: number;
  angularDamping: number;
  dimensions: Dimensions; 
  spawnPosition: Vector3Data;
  joints?: JointConfig[]; // 4DOF Joint Configuration
}

export interface SceneEnvironment {
  floorColor: string;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
}

export interface SimulationSettings {
  timeStep: number;
  substeps: number;
}

export interface SceneMeta {
  id: string;
  name: string;
  description: string;
  environment: SceneEnvironment;
}

export interface PhysicsParams {
  gravity: Vector3Data;
  simulation: SimulationSettings;
  assetGroups: AssetGroup[];
  scene: SceneMeta;
}

export enum ViewMode {
  RGB = 'RGB',
  WIREFRAME = 'WIREFRAME',
  DEPTH = 'DEPTH',
  LIDAR = 'LIDAR'
}

export interface TelemetryData {
  fps: number;
  particleCount: number;
  systemEnergy: number;
  collisions: number;
  isStable: boolean;
}

export interface BoundingBox2D {
  x: number;      // Top Left X
  y: number;      // Top Left Y
  width: number;
  height: number;
  label: string;
  classId: number;
}

export interface RecordedFrame {
  frameId: number;
  timestamp: number;
  objects: BoundingBox2D[];
  camera: {
    position: Vector3Data;
    target: Vector3Data;
  }
}

export interface RecordedSession {
  frames: RecordedFrame[];
  videoBlob: Blob | null;
  startTime: string;
  endTime: string;
  params: PhysicsParams;
  resolution: { width: number, height: number };
}