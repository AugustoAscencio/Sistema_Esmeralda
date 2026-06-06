/**
 * ScoreSphere — Light theme, visible on white background
 */
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { getScoreColor } from '../../styles/theme'

function SphereScene({ score }) {
  const meshRef = useRef()
  const color = useMemo(() => getScoreColor(score), [score])
  const distort = score >= 75 ? 0.08 : score >= 55 ? 0.15 : score >= 35 ? 0.25 : 0.38
  const speed = score >= 75 ? 1 : score >= 55 ? 1.5 : score >= 35 ? 2.2 : 3
  const pulse = score >= 75 ? 0.003 : score >= 55 ? 0.006 : score >= 35 ? 0.012 : 0.018
  const progress = score / 100

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    meshRef.current.rotation.y = t * 0.25
    meshRef.current.rotation.x = Math.sin(t * 0.15) * 0.08
    meshRef.current.scale.setScalar(1 + Math.sin(t * 2.5) * pulse)
  })

  const ringGeo = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, 0.72, 0.72, 0, progress * Math.PI * 2, false)
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(64))
  }, [progress])

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[2, 2, 2]} intensity={1} color={color} />
      <pointLight position={[-2, -1, -2]} intensity={0.5} color="#ffffff" />
      <directionalLight position={[0, 3, 3]} intensity={0.6} />

      <mesh ref={meshRef}>
        <sphereGeometry args={[0.55, 48, 48]} />
        <MeshDistortMaterial color={color} emissive={color} emissiveIntensity={0.15}
          distort={distort} speed={speed} roughness={0.4} metalness={0.2} />
      </mesh>

      <line geometry={ringGeo} rotation={[-Math.PI / 2, 0, 0]}>
        <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.6} />
      </line>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.70, 0.72, 64]} />
        <meshBasicMaterial color="#e5e7eb" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

export default function ScoreSphere({ score = 0, size = 200 }) {
  const c = getScoreColor(score)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 1.8], fov: 45 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}>
        <SphereScene score={score} />
      </Canvas>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: size * 0.22 + 'px', fontWeight: 800, color: c, lineHeight: 1, textShadow: `0 0 12px ${c}44, 0 1px 2px rgba(0,0,0,0.15)` }}>{score}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: size * 0.08 + 'px', color: c, marginTop: '4px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>resiliencia</span>
      </div>
    </div>
  )
}
