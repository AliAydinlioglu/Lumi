"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, RoundedBox, Text, Float, MeshTransmissionMaterial, Edges } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

function FlashcardMesh({ deckId }: { deckId?: number | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // N-Sided Card State
  const cards = useLiveQuery(() => {
    if (!deckId) return [];
    return db.cards.where({ deckId }).toArray();
  }, [deckId]);

  const [cardIndex, setCardIndex] = useState(0);
  const [sideIndex, setSideIndex] = useState(0);
  const [flipAngle, setFlipAngle] = useState(0); // target rotation around Y

  // Get current card and its sides
  const currentCard = cards?.[cardIndex];
  const sides = currentCard?.sides || ["No cards in this list", "Add some from the dictionary!"];
  
  // Parity determines if we are looking at the 'front' or 'back' of the 3D block
  const isFrontFacing = (Math.abs(flipAngle) / Math.PI) % 2 === 0;

  // The text for the face currently looking at the camera
  const currentFacingText = sides[sideIndex % sides.length];
  // The text for the hidden face (which will be revealed on the NEXT flip)
  const nextFacingText = sides[(sideIndex + 1) % sides.length];

  const handleFlip = () => {
    // Spin 180 degrees and advance to the next language side!
    setFlipAngle(prev => prev + Math.PI);
    setSideIndex(prev => prev + 1);
  };

  // Smoothly track the mouse AND the infinite flip
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Tilt the card significantly so the user can easily see the thick 3D edges
    const targetRotationX = -(state.pointer.y * Math.PI) / 4; 
    // Combine mouse tracking with the infinite flip angle!
    const targetRotationY = (state.pointer.x * Math.PI) / 4 + flipAngle; 

    // Smooth easing
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotationX, 0.08);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotationY, 0.08);
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <RoundedBox
          ref={meshRef}
          onClick={handleFlip}
          // The depth is set to 0.6, giving it a very thick, heavy block-like body. Made horizontal wide.
          args={[6, 3.5, 0.6]} 
          radius={0.2}
          smoothness={16} // High smoothness for perfect glass reflections
        >
          {/* 
            MeshTransmissionMaterial is the ultimate heavy glass shader.
            It captures the 3D scene behind it and physically refracts it through the volume.
          */}
          <MeshTransmissionMaterial
            backside // Renders the back face to create internal bounces
            samples={16} // High sample count for zero noise
            resolution={2048} // Extreme 2K resolution buffer to eliminate all pixelation
            thickness={0.5} // Reduced thickness so it distorts less and is easier to look through
            roughness={0} // 0 roughness means perfect, flawless crystal glass
            transmission={1} // 100% transparent
            ior={1.2} // Lower Index of Refraction means light bends less wildly
            chromaticAberration={0.02} // Very subtle color splitting
            distortion={0} 
            color="#ffffff" 
          />
          
          {/* Subtle outline to highlight the 3D edges without being overpowering */}
          <Edges 
            color="#000000" 
            transparent 
            opacity={0.15} 
            linewidth={1} 
          />
          
          {/* FRONT FACE TEXT */}
          <Text
            position={[0, 0, 0.31]} // On the front face
            fontSize={0.4}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {isFrontFacing ? currentFacingText : nextFacingText}
          </Text>

          {/* BACK FACE TEXT */}
          <Text
            position={[0, 0, -0.31]} // On the back face
            rotation={[0, Math.PI, 0]} // Flipped so it reads correctly when the block spins 180 deg
            fontSize={0.4}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {isFrontFacing ? nextFacingText : currentFacingText}
          </Text>
        </RoundedBox>
      </Float>
    </group>
  );
}

// We add some floating abstract 3D shapes behind the glass so the refraction has something to warp!
function BackgroundShapes() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -5]}>
      <mesh position={[-3, 2, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial color="#8a2be2" />
      </mesh>
      <mesh position={[3, -2, -2]}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>
      <mesh position={[0, -3, 1]}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshBasicMaterial color="#ff0080" />
      </mesh>
    </group>
  );
}

export default function Flashcard({ deckId }: { deckId?: number | null }) {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1} />
        
        {/* Abstract white lights so there is no recognizable "image" reflected on the card */}
        <Environment>
          <color attach="background" args={['#ffffff']} />
          <group rotation={[-Math.PI / 4, 0, 0]}>
            <mesh position={[0, 5, -10]} scale={[20, 20, 1]}>
              <planeGeometry />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        </Environment>
        
        {/* The shapes that sit behind the glass to be refracted */}
        <BackgroundShapes />
        
        {/* The heavy glass block */}
        <FlashcardMesh deckId={deckId} />
      </Canvas>
    </div>
  );
}
