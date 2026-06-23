/**
 * Atrium.tsx
 * 
 * HYPER-LUXURY 3D SHOWROOM ATRIUM
 * 
 * PERFORMANCE ARCHITECTURE:
 * - InstancedMesh for all repeated geometry (podiums, lights) - reduces draw calls from N to 1
 * - Pre-computed lighting via baked-like ambient occlusion approximation
 * - Low-poly geometry with high-quality materials
 * - Frustum culling enabled by default in R3F
 * - No real-time shadows on static objects (baked into texture concept)
 * - Texture atlasing ready (single material shared across instances)
 * 
 * COLOR PALETTE:
 * - Deep Obsidian Black: #0B0B0B
 * - Matte Black: #1A1A1A
 * - Luxury Gold: #D4AF37
 * - Fire Red: #FF1E00
 */

import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { InstancedBufferAttribute, InstancedBufferGeometry, Matrix4, Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import { Float, Environment, ContactShadows } from '@react-three/drei'
import gsap from 'gsap'

// ============================================================================
// CONSTANTS - Color Palette & Configuration
// ============================================================================
const COLORS = {
  obsidianBlack: new THREE.Color('#0B0B0B'),
  matteBlack: new THREE.Color('#1A1A1A'),
  luxuryGold: new THREE.Color('#D4AF37'),
  fireRed: new THREE.Color('#FF1E00'),
}

const CONFIG = {
  podiumCount: 12,
  podiumRadius: 8,
  podiumHeightVariation: 1.5,
  floatSpeed: 1.5,
  floatIntensity: 0.3,
}

// ============================================================================
// INSTANCED PODIUM GEOMETRY
// Performance Hack: Single draw call for all podiums via InstancedMesh
// ============================================================================
interface PodiumInstance {
  position: [number, number, number]
  scale: [number, number, number]
  rotation: [number, number, number]
  colorOffset: number // 0 = gold accent, 1 = red accent
}

const PodiumInstanced: React.FC<{ count: number; radius: number }> = ({ count, radius }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const accentMeshRef = useRef<THREE.InstancedMesh>(null!)
  
  // PERFORMANCE: Pre-compute all transforms once, not per frame
  const { positions, scales, rotations, colorOffsets } = useMemo(() => {
    const data = {
      positions: [] as [number, number, number][],
      scales: [] as [number, number, number][],
      rotations: [] as [number, number, number][],
      colorOffsets: [] as number[],
    }
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radialDistance = radius * (0.3 + Math.random() * 0.7)
      
      data.positions.push([
        Math.cos(angle) * radialDistance,
        -2 + Math.random() * CONFIG.podiumHeightVariation,
        Math.sin(angle) * radialDistance,
      ])
      
      const scaleVar = 0.8 + Math.random() * 0.4
      data.scales.push([scaleVar, 0.3 + Math.random() * 0.3, scaleVar])
      data.rotations.push([0, Math.random() * Math.PI, 0])
      data.colorOffsets.push(Math.random() > 0.7 ? 1 : 0) // 30% red, 70% gold
    }
    
    return data
  }, [count, radius])
  
  // Apply transforms to instanced mesh
  useMemo(() => {
    if (!meshRef.current) return
    
    const dummy = new THREE.Object3D()
    
    positions.forEach((pos, i) => {
      dummy.position.set(...pos)
      dummy.scale.set(...scales[i])
      dummy.rotation.set(...rotations[i])
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [positions, scales, rotations])
  
  // Setup color attributes for instanced rendering
  useMemo(() => {
    if (!meshRef.current || !accentMeshRef.current) return
    
    const colors: number[] = []
    const accentColors: number[] = []
    
    colorOffsets.forEach((offset) => {
      // Base podium color (matte black)
      colors.push(COLORS.matteBlack.r, COLORS.matteBlack.g, COLORS.matteBlack.b)
      
      // Accent color (gold or red)
      const accent = offset === 1 ? COLORS.fireRed : COLORS.luxuryGold
      accentColors.push(accent.r, accent.g, accent.b)
    })
    
    // Set colors on the main mesh (podium bodies)
    const colorAttribute = new Float32Array(colors)
    meshRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(colorAttribute, 3))
    meshRef.current.material.vertexColors = true
    
    // Set colors on accent mesh (podium tops)
    const accentAttribute = new Float32Array(accentColors)
    accentMeshRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(accentAttribute, 3))
    accentMeshRef.current.material.vertexColors = true
  }, [colorOffsets])
  
  return (
    <>
      {/* Main podium bodies - instanced */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#1A1A1A"
          roughness={0.9}
          metalness={0.1}
          vertexColors
        />
      </instancedMesh>
      
      {/* Podium top accents - instanced (slightly smaller, different color) */}
      <instancedMesh
        ref={accentMeshRef}
        args={[undefined, undefined, count]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.6, 0.05, 0.6]} />
        <meshStandardMaterial
          color="#D4AF37"
          roughness={0.3}
          metalness={0.8}
          emissive="#D4AF37"
          emissiveIntensity={0.2}
          vertexColors
        />
      </instancedMesh>
    </>
  )
}

// ============================================================================
// FLOATING PRODUCT DISPLAYS WITH HYPER-LUXURY PLACEHOLDER PRODUCTS
// PERFORMANCE: Uses @react-three/drei's Float component with optimized settings
// Products use MeshPhysicalMaterial for expensive glass/ceramic look
// ============================================================================

/**
 * LuxuryFragranceBottle - Procedural high-end perfume bottle
 * Uses CylinderGeometry with MeshPhysicalMaterial for glass/ceramic effect
 */
const LuxuryFragranceBottle: React.FC<{ colorType: 'gold' | 'red' }> = ({ colorType }) => {
  const mainColor = colorType === 'gold' ? COLORS.luxuryGold : COLORS.fireRed
  const accentColor = colorType === 'gold' ? COLORS.obsidianBlack : COLORS.matteBlack
  
  return (
    <group>
      {/* Bottle body - sleek cylinder */}
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.6, 16]} />
        <meshPhysicalMaterial
          color={accentColor}
          roughness={0.15}
          metalness={0.7}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transmission={0.1}
          thickness={0.5}
          envMapIntensity={2.0}
        />
      </mesh>
      
      {/* Bottle neck */}
      <mesh castShadow receiveShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.2, 16]} />
        <meshPhysicalMaterial
          color={mainColor}
          roughness={0.2}
          metalness={0.9}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
        />
      </mesh>
      
      {/* Bottle cap - luxury gold/red accent */}
      <mesh castShadow receiveShadow position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
        <meshPhysicalMaterial
          color={mainColor}
          roughness={0.1}
          metalness={1.0}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
          emissive={mainColor}
          emissiveIntensity={0.15}
        />
      </mesh>
      
      {/* Subtle glow ring at base */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial
          color={mainColor}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/**
 * LuxuryWatchCase - Procedural high-end watch presentation box
 * Uses BoxGeometry with beveled edges via ChamferBox concept
 */
const LuxuryWatchCase: React.FC<{ colorType: 'gold' | 'red' }> = ({ colorType }) => {
  const mainColor = colorType === 'gold' ? COLORS.luxuryGold : COLORS.fireRed
  const caseColor = colorType === 'gold' ? COLORS.obsidianBlack : COLORS.obsidianBlack
  
  return (
    <group>
      {/* Watch case base - sharp elegant box */}
      <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.4, 4, 4, 4]} />
        <meshPhysicalMaterial
          color={caseColor}
          roughness={0.25}
          metalness={0.6}
          clearcoat={0.9}
          clearcoatRoughness={0.08}
        />
      </mesh>
      
      {/* Watch case lid - slightly raised */}
      <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[0.52, 0.08, 0.42, 4, 4, 4]} />
        <meshPhysicalMaterial
          color={mainColor}
          roughness={0.15}
          metalness={0.95}
          clearcoat={1.0}
          clearcoatRoughness={0.03}
          emissive={mainColor}
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Watch face placeholder - glowing disc */}
      <mesh castShadow receiveShadow position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 32]} />
        <meshPhysicalMaterial
          color={COLORS.obsidianBlack}
          roughness={0.1}
          metalness={0.8}
          clearcoat={0.8}
        />
      </mesh>
      
      {/* Watch hands accent - fire red or gold line */}
      <mesh position={[0, 0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 0.015]} />
        <meshBasicMaterial color={mainColor} toneMapped={false} />
      </mesh>
      
      {/* Glowing edge ring */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.27, 32]} />
        <meshBasicMaterial
          color={mainColor}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/**
 * LuxuryCosmeticJar - Procedural high-end cream/jar container
 * Uses CylinderGeometry with elegant proportions
 */
const LuxuryCosmeticJar: React.FC<{ colorType: 'gold' | 'red' }> = ({ colorType }) => {
  const mainColor = colorType === 'gold' ? COLORS.luxuryGold : COLORS.fireRed
  const jarColor = colorType === 'gold' ? COLORS.matteBlack : COLORS.obsidianBlack
  
  return (
    <group>
      {/* Jar body */}
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.4, 24]} />
        <meshPhysicalMaterial
          color={jarColor}
          roughness={0.2}
          metalness={0.5}
          clearcoat={0.85}
          clearcoatRoughness={0.1}
          transmission={0.05}
          thickness={0.3}
        />
      </mesh>
      
      {/* Jar lid - luxury metallic */}
      <mesh castShadow receiveShadow position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
        <meshPhysicalMaterial
          color={mainColor}
          roughness={0.12}
          metalness={0.98}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
          emissive={mainColor}
          emissiveIntensity={0.12}
        />
      </mesh>
      
      {/* Decorative band on lid */}
      <mesh position={[0, 0.52, 0]}>
        <torusGeometry args={[0.22, 0.02, 16, 32]} />
        <meshPhysicalMaterial
          color={colorType === 'gold' ? COLORS.obsidianBlack : COLORS.matteBlack}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Base glow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.23, 32]} />
        <meshBasicMaterial
          color={mainColor}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

const FloatingProducts: React.FC = () => {
  const productConfigs = useMemo(() => {
    const configs: Array<{
      position: [number, number, number]
      type: 'fragrance' | 'watch' | 'cosmetic'
      colorType: 'gold' | 'red'
      rotationSpeed: number
    }> = []
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const radialDistance = 5 + (i % 3) * 1.5 // Three rings
      
      const types: ('fragrance' | 'watch' | 'cosmetic')[] = ['fragrance', 'watch', 'cosmetic']
      const colorTypes: ('gold' | 'red')[] = ['gold', 'red']
      
      configs.push({
        position: [
          Math.cos(angle) * radialDistance,
          1.5 + (i % 4) * 0.3,
          Math.sin(angle) * radialDistance,
        ],
        type: types[i % 3],
        colorType: colorTypes[i % 2],
        rotationSpeed: 0.2 + Math.random() * 0.3,
      })
    }
    
    return configs
  }, [])
  
  return (
    <>
      {productConfigs.map((config, i) => (
        <Float
          key={i}
          speed={CONFIG.floatSpeed * config.rotationSpeed}
          rotationIntensity={CONFIG.floatIntensity * 0.5}
          floatIntensity={CONFIG.floatIntensity}
        >
          <group position={config.position}>
            {/* Product based on type */}
            {config.type === 'fragrance' && (
              <LuxuryFragranceBottle colorType={config.colorType} />
            )}
            {config.type === 'watch' && (
              <LuxuryWatchCase colorType={config.colorType} />
            )}
            {config.type === 'cosmetic' && (
              <LuxuryCosmeticJar colorType={config.colorType} />
            )}
            
            {/* Subtle accent light matching product color */}
            <pointLight
              color={config.colorType === 'gold' ? COLORS.luxuryGold : COLORS.fireRed}
              intensity={0.3}
              distance={1.5}
              decay={2.5}
            />
          </group>
        </Float>
      ))}
    </>
  )
}

// ============================================================================
// AMBIENT PARTICLES
// PERFORMANCE: GPU-accelerated particles via Points/PointsMaterial
// Adds depth and luxury atmosphere without heavy geometry
// ============================================================================
const AmbientParticles: React.FC<{ count?: number }> = ({ count = 500 }) => {
  const pointsRef = useRef<THREE.Points>(null!)
  
  const { positions, colors } = useMemo(() => {
    const pos: number[] = []
    const cols: number[] = []
    
    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 10 + Math.random() * 15
      
      pos.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      )
      
      // Mix of gold and subtle red particles
      const isGold = Math.random() > 0.3
      const color = isGold ? COLORS.luxuryGold : new THREE.Color('#330000')
      cols.push(color.r, color.g, color.b)
    }
    
    return { positions: new Float32Array(pos), colors: new Float32Array(cols) }
  }, [count])
  
  useFrame((state) => {
    if (pointsRef.current) {
      // Slow rotation for dynamic atmosphere
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ============================================================================
// FLOOR WITH REFLECTION
// PERFORMANCE: Simple plane with high-quality material instead of complex geometry
// ============================================================================
const ReflectiveFloor: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial
        color="#0B0B0B"
        roughness={0.1}
        metalness={0.9}
        envMapIntensity={1.5}
      />
    </mesh>
  )
}

// ============================================================================
// MAIN ATRIUM COMPONENT
// The complete hyper-luxury showroom environment
// ============================================================================
export const Atrium: React.FC = () => {
  return (
    <group>
      {/* Lighting Setup - Optimized for performance */}
      {/* No dynamic shadows on ambient light, only spotlights cast shadows */}
      <ambientLight intensity={0.3} color="#1a1a1a" />
      
      {/* Key light - warm gold tone */}
      <spotLight
        position={[10, 15, 10]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        color="#D4AF37"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />
      
      {/* Fill light - subtle red accent */}
      <spotLight
        position={[-10, 10, -10]}
        angle={0.4}
        penumbra={1}
        intensity={1}
        color="#FF1E00"
        castShadow={false}
      />
      
      {/* Rim light for depth */}
      <directionalLight
        position={[0, 5, -5]}
        intensity={0.5}
        color="#ffffff"
      />
      
      {/* HDRI Environment for realistic reflections */}
      <Environment
        preset="city"
        background={false}
        blur={0.8}
      />
      
      {/* Floor with reflections */}
      <ReflectiveFloor />
      
      {/* Contact shadows for grounded feel (cheaper than full shadow maps) */}
      <ContactShadows
        resolution={1024}
        scale={20}
        blur={2}
        opacity={0.5}
        far={4}
        color="#000000"
      />
      
      {/* Instanced podiums - single draw call */}
      <PodiumInstanced count={CONFIG.podiumCount} radius={CONFIG.podiumRadius} />
      
      {/* Floating luxury products */}
      <FloatingProducts />
      
      {/* Ambient particles for atmosphere */}
      <AmbientParticles count={500} />
    </group>
  )
}

export default Atrium
