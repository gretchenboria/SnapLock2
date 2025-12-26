import React, { useMemo, ReactNode, Component } from 'react';
import { RigidBody, CuboidCollider, CylinderCollider, BallCollider, CapsuleCollider } from '@react-three/rapier';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AssetGroup, ViewMode, JointConfig } from '../types';
import * as THREE from 'three';

interface AssetRendererProps {
  group: AssetGroup;
  viewMode: ViewMode;
}

interface ModelErrorBoundaryProps {
  fallback: ReactNode;
  children?: ReactNode;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) { return { hasError: true }; }
  
  componentDidCatch(error: any) { console.error(`Failed to load model:`, error); }
  
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

const MODEL_LIBRARY: Record<string, string> = {
  // ROBOTS
  'franka_panda': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
  'ur5_arm': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb', 
  'kuka_kr5': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/RobotExpressive/RobotExpressive.glb', 
  'spot_dog': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
  'quadcopter_drone': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/Soldier.glb',
  'warehouse_bot': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/PrimaryIonDrive.glb',
  // INDUSTRIAL & WAREHOUSE
  'conveyor_belt': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/BoxAnimated/BoxAnimated.glb',
  'metal_barrel': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
  'shipping_crate': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/BoxAnimated/BoxAnimated.glb',
  'wooden_pallet': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/BoxAnimated/BoxAnimated.glb',
  // OBJECTS
  'cardboard_box': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/BoxAnimated/BoxAnimated.glb',
  'metal_cube': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/BoxAnimated/BoxAnimated.glb',
  // FALLBACK
  'default': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/BoxAnimated/BoxAnimated.glb'
};

const ModelInstance = ({ url, scale, color, joints, groupId }: { url: string; scale: number; color: string, joints?: JointConfig[], groupId: string }) => {
  const { scene } = useGLTF(url);
  
  const clonedScene = useMemo(() => {
    const s = scene.clone();
    s.traverse((child) => {
        if ((child as any).isMesh) {
            (child as any).castShadow = true;
            (child as any).receiveShadow = true;
            (child as any).userData.groupId = groupId; // Tag for recording
            if ((child as any).material) {
               (child as any).material = (child as any).material.clone();
               (child as any).material.color.set(color);
            }
        }
    });
    return s;
  }, [scene, color, groupId]);

  useFrame(() => {
    if (joints && joints.length > 0) {
      joints.forEach(joint => {
        const node = clonedScene.getObjectByName(joint.name);
        if (node) {
          const rad = THREE.MathUtils.degToRad(joint.value);
          if (joint.axis === 'x') node.rotation.x = rad;
          if (joint.axis === 'y') node.rotation.y = rad;
          if (joint.axis === 'z') node.rotation.z = rad;
        }
      });
    }
  });
  
  return <primitive object={clonedScene} scale={scale} />;
};

const FallbackModel = ({ color, dimensions, groupId }: { color: string, dimensions: any, groupId: string }) => (
  <mesh userData={{ groupId }}>
    <boxGeometry args={[dimensions.x, dimensions.y, dimensions.z]} />
    <meshStandardMaterial color={color} opacity={0.5} transparent />
    <lineSegments>
       <edgesGeometry args={[new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z)]} />
       <lineBasicMaterial color="red" />
    </lineSegments>
  </mesh>
);

const AssetShape = ({ group }: { group: AssetGroup }) => {
  const userData = { groupId: group.id };

  switch (group.shape) {
    case 'MODEL':
      let url = group.modelUrl || MODEL_LIBRARY[group.modelId || 'default'] || MODEL_LIBRARY['default'];
      return (
        <ModelErrorBoundary fallback={<FallbackModel color={group.color} dimensions={group.dimensions} groupId={group.id} />}>
            <ModelInstance url={url} scale={group.scale} color={group.color} joints={group.joints} groupId={group.id} />
        </ModelErrorBoundary>
      );
    case 'CUBE':
      return (
        <>
          <boxGeometry args={[group.dimensions.x, group.dimensions.y, group.dimensions.z]} />
          <CuboidCollider args={[group.dimensions.x / 2, group.dimensions.y / 2, group.dimensions.z / 2]} />
        </>
      );
    case 'SPHERE':
      return (
        <>
          <sphereGeometry args={[group.dimensions.x, 32, 32]} />
          <BallCollider args={[group.dimensions.x]} />
        </>
      );
    case 'CYLINDER':
      return (
        <>
          <cylinderGeometry args={[group.dimensions.x, group.dimensions.x, group.dimensions.y, 32]} />
          <CylinderCollider args={[group.dimensions.y / 2, group.dimensions.x]} />
        </>
      );
    case 'CAPSULE':
       return (
        <>
           <capsuleGeometry args={[group.dimensions.x, group.dimensions.y, 4, 8]} />
           <CapsuleCollider args={[group.dimensions.y / 2, group.dimensions.x]} />
        </>
       )
    default:
      return (
         <>
          <boxGeometry args={[1, 1, 1]} />
          <CuboidCollider args={[0.5, 0.5, 0.5]} />
         </>
      );
  }
};

export const AssetRenderer: React.FC<AssetRendererProps> = ({ group, viewMode }) => {
  const instances = useMemo(() => {
    const items = [];
    for (let i = 0; i < group.count; i++) {
      let position = [group.spawnPosition.x, group.spawnPosition.y, group.spawnPosition.z];
      
      if (group.spawnMode === 'RANDOM') {
        position = [
          group.spawnPosition.x + (Math.random() - 0.5) * 8,
          group.spawnPosition.y + Math.random() * 4,
          group.spawnPosition.z + (Math.random() - 0.5) * 8
        ];
      } else if (group.spawnMode === 'GRID') {
        const size = Math.ceil(Math.sqrt(group.count));
        const spacing = Math.max(group.dimensions.x, group.dimensions.z) * 1.5;
        const x = (i % size) * spacing;
        const z = Math.floor(i / size) * spacing;
        position = [
            group.spawnPosition.x + x - (size * spacing) / 2, 
            group.spawnPosition.y, 
            group.spawnPosition.z + z - (size * spacing) / 2
        ];
      } else if (group.spawnMode === 'CIRCLE') {
         const angle = (i / group.count) * Math.PI * 2;
         const radius = 5;
         position = [
            group.spawnPosition.x + Math.cos(angle) * radius,
            group.spawnPosition.y,
            group.spawnPosition.z + Math.sin(angle) * radius
         ];
      }

      items.push({
        key: `${group.id}-${i}`,
        position: position as [number, number, number],
        rotation: [Math.random() * 0.1, Math.random() * Math.PI * 2, 0] as [number, number, number]
      });
    }
    return items;
  }, [group]);

  const materialProps = viewMode === ViewMode.WIREFRAME 
    ? { wireframe: true, color: group.color }
    : { color: group.color };

  const isLidar = viewMode === ViewMode.LIDAR;

  const colliderType = group.shape === 'MODEL' 
    ? (group.rigidBodyType === 'DYNAMIC' ? 'hull' : 'trimesh')
    : false;

  return (
    <>
      {instances.map((item) => (
        <RigidBody
          key={item.key}
          position={item.position}
          rotation={item.rotation}
          type={group.rigidBodyType === 'DYNAMIC' ? 'dynamic' : group.rigidBodyType === 'STATIC' ? 'fixed' : 'kinematicPosition'}
          colliders={colliderType} 
          mass={group.mass}
          friction={group.friction}
          restitution={group.restitution}
          linearDamping={group.linearDamping || 0}
          angularDamping={group.angularDamping || 0}
        >
          {group.shape !== 'MODEL' ? (
             <mesh castShadow receiveShadow userData={{ groupId: group.id }}>
                <AssetShape group={group} />
                {isLidar ? (
                    <pointsMaterial size={0.05} color={group.color} />
                ) : (
                    <meshStandardMaterial {...materialProps} roughness={0.3} metalness={0.1} />
                )}
             </mesh>
          ) : (
             <group>
                <AssetShape group={group} />
             </group>
          )}
        </RigidBody>
      ))}
    </>
  );
};
