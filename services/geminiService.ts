import { GoogleGenAI, Type } from "@google/genai";
import { PhysicsParams } from "../types";

// Schema definition for Structured Output
const assetGroupSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    count: { type: Type.INTEGER, description: "Number of objects. For robots, usually 1." },
    shape: { type: Type.STRING, enum: ["CUBE", "SPHERE", "CYLINDER", "CAPSULE", "MODEL"] },
    modelId: { 
      type: Type.STRING, 
      description: "MUST be one of: 'franka_panda', 'ur5_arm', 'kuka_kr5', 'spot_dog', 'quadcopter_drone', 'warehouse_bot', 'conveyor_belt', 'metal_barrel', 'shipping_crate', 'wooden_pallet', 'cardboard_box'. Use 'cube' or 'sphere' if no model fits." 
    },
    color: { type: Type.STRING, description: "Hex color code" },
    spawnMode: { type: Type.STRING, enum: ["GRID", "RANDOM", "CIRCLE", "SINGLE"] },
    scale: { type: Type.NUMBER },
    rigidBodyType: { type: Type.STRING, enum: ["DYNAMIC", "KINEMATIC", "STATIC"] },
    mass: { type: Type.NUMBER },
    friction: { type: Type.NUMBER },
    restitution: { type: Type.NUMBER },
    linearDamping: { type: Type.NUMBER },
    angularDamping: { type: Type.NUMBER },
    dimensions: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER },
        z: { type: Type.NUMBER }
      }
    },
    spawnPosition: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER },
        z: { type: Type.NUMBER }
      }
    }
  },
  required: ["id", "name", "count", "shape", "color", "spawnMode", "rigidBodyType", "mass", "spawnPosition"]
};

const physicsParamsSchema = {
  type: Type.OBJECT,
  properties: {
    gravity: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER },
        z: { type: Type.NUMBER }
      }
    },
    simulation: {
      type: Type.OBJECT,
      properties: {
        timeStep: { type: Type.NUMBER },
        substeps: { type: Type.INTEGER }
      },
      required: ["timeStep"]
    },
    assetGroups: {
      type: Type.ARRAY,
      items: assetGroupSchema
    },
    scene: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        environment: {
          type: Type.OBJECT,
          properties: {
            floorColor: { type: Type.STRING },
            ambientLightIntensity: { type: Type.NUMBER },
            directionalLightIntensity: { type: Type.NUMBER }
          }
        }
      }
    }
  },
  required: ["gravity", "simulation", "assetGroups", "scene"]
};

const FALLBACK_SCENE: PhysicsParams = {
  gravity: { x: 0, y: -9.81, z: 0 },
  simulation: { timeStep: 1/120, substeps: 4 },
  assetGroups: [
    {
      id: 'fallback_1',
      name: 'Safety Cube',
      count: 5,
      shape: 'CUBE',
      color: '#ef4444',
      spawnMode: 'RANDOM',
      scale: 1,
      rigidBodyType: 'DYNAMIC',
      mass: 1,
      friction: 0.5,
      restitution: 0.7,
      linearDamping: 0.1,
      angularDamping: 0.1,
      dimensions: { x: 1, y: 1, z: 1 },
      spawnPosition: { x: 0, y: 5, z: 0 }
    }
  ],
  scene: {
    id: 'fallback',
    name: 'Fallback Scene',
    description: 'AI Generation failed. This is a fallback scene.',
    environment: {
      floorColor: '#1e293b',
      ambientLightIntensity: 0.5,
      directionalLightIntensity: 1.0
    }
  }
};

export const generateSceneConfig = async (prompt: string): Promise<PhysicsParams> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key missing. Returning fallback scene.");
    return FALLBACK_SCENE;
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `
    You are SnapLock, an expert physics simulation engine for ML training data generation.
    Your goal is to build scenes for robotics training using a specific library of 3D assets.

    LIBRARY INVENTORY (Use these IDs in 'modelId' when shape='MODEL'):
    - ROBOTS: 'franka_panda' (Arm), 'ur5_arm' (Arm), 'kuka_kr5' (Industrial), 'spot_dog' (Quadruped), 'quadcopter_drone' (UAV), 'warehouse_bot' (AMR).
    - INDUSTRIAL: 'conveyor_belt' (Static), 'metal_barrel' (Dynamic), 'shipping_crate' (Dynamic), 'wooden_pallet' (Dynamic).
    - OBJECTS: 'cardboard_box', 'metal_cube', 'foam_block'.

    RULES:
    1. ROBOT SETUP: Robots should usually be 'KINEMATIC' (controlled) or 'DYNAMIC' (if testing physics).
    2. CONVEYORS/FLOORS: Must be 'STATIC'.
    3. MANIPULATION OBJECTS: Must be 'DYNAMIC' with appropriate mass (e.g., box=1kg, barrel=50kg).
    4. COORDINATES: Y-UP. Floor is at Y=0. Spawn objects slightly above Y=0.
    5. UNITS: Meters.
    6. PHYSICS: 
       - High precision timestep (120Hz = 0.00833).
       - Friction: Metal=0.4, Rubber=0.8, Ice=0.05.
    
    SCENE LOGIC:
    - If user asks for "Robot picking up boxes", spawn a 'franka_panda' or 'ur5_arm' and several 'cardboard_box' assets.
    - If user asks for "Drone crash", spawn 'quadcopter_drone' high up with Dynamic body type.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: physicsParamsSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text) as PhysicsParams;
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return fallback instead of throwing to prevent app crash
    return FALLBACK_SCENE;
  }
};