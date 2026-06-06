/**
 * GlobeHero v6 — Massive planet with 800+ surface points, 600 internal particles,
 * multi-layer emerald aura, pulsing glow, verde-tierra + verde-esmeralda palette,
 * orbital rings, auto-rotation
 */
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function genPoints() {
  const pts = []
  const regions = [
    // Latin America — heavy coverage
    { latMin: 15, latMax: 32, lonMin: -118, lonMax: -87, n: 60 },
    { latMin: 7, latMax: 18, lonMin: -92, lonMax: -77, n: 50 },
    { latMin: 8, latMax: 22, lonMin: -85, lonMax: -60, n: 40 },
    { latMin: 0, latMax: 12, lonMin: -80, lonMax: -60, n: 55 },
    { latMin: -18, latMax: 2, lonMin: -82, lonMax: -68, n: 45 },
    { latMin: -33, latMax: 5, lonMin: -74, lonMax: -35, n: 100 },
    { latMin: -25, latMax: -10, lonMin: -68, lonMax: -55, n: 40 },
    { latMin: -55, latMax: -22, lonMin: -73, lonMax: -53, n: 55 },
    { latMin: 12, latMax: 14, lonMin: -88, lonMax: -83, n: 30 },
    // Africa
    { latMin: -5, latMax: 15, lonMin: -10, lonMax: 40, n: 50 },
    { latMin: -35, latMax: -5, lonMin: 15, lonMax: 50, n: 35 },
    // Asia
    { latMin: 5, latMax: 30, lonMin: 70, lonMax: 100, n: 40 },
    { latMin: 20, latMax: 45, lonMin: 100, lonMax: 130, n: 35 },
    // Europe
    { latMin: 35, latMax: 55, lonMin: -10, lonMax: 30, n: 30 },
    // Scattered global
    { latMin: -60, latMax: 60, lonMin: -180, lonMax: 180, n: 100 },
    // Extra tropical belt (more density)
    { latMin: -20, latMax: 20, lonMin: -180, lonMax: 180, n: 60 },
  ]
  const s = (i) => ((i * 9301 + 49297) % 233280) / 233280
  let idx = 0
  for (const r of regions) {
    for (let i = 0; i < r.n; i++) {
      pts.push({
        lat: r.latMin + s(idx++) * (r.latMax - r.latMin),
        lon: r.lonMin + s(idx++) * (r.lonMax - r.lonMin),
      })
    }
  }
  return pts
}

function ll2v(lat, lon, r = 1.02) {
  const p = (90 - lat) * Math.PI / 180, t = (lon + 180) * Math.PI / 180
  return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t))
}

/* Dense internal particle cloud — 600 points */
function InternalParticles() {
  const ref = useRef()
  const { geo, sizes } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const positions = []
    const sizeArr = []
    for (let i = 0; i < 600; i++) {
      const r = 0.15 + Math.random() * 0.75
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
      sizeArr.push(0.008 + Math.random() * 0.018)
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return { geo: g, sizes: sizeArr }
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.12
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.08) * 0.12
    }
  })

  return (
    <group ref={ref}>
      {/* Bright green layer */}
      <points geometry={geo}>
        <pointsMaterial color="#6ee7b7" size={0.018} sizeAttenuation transparent opacity={0.8} />
      </points>
      {/* Warm emerald glow layer */}
      <points geometry={geo}>
        <pointsMaterial color="#34d399" size={0.035} sizeAttenuation transparent opacity={0.2} />
      </points>
    </group>
  )
}

/* Deep internal glow particles — verde tierra */
function DeepParticles() {
  const ref = useRef()
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const positions = []
    for (let i = 0; i < 150; i++) {
      const r = 0.4 + Math.random() * 0.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return g
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = -clock.getElapsedTime() * 0.08
      ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.06) * 0.08
    }
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#166534" size={0.025} sizeAttenuation transparent opacity={0.5} />
    </points>
  )
}

function Scene() {
  const gRef = useRef(), pRef = useRef()
  useFrame((_, d) => {
    if (gRef.current) gRef.current.rotation.y += d * 0.06
    if (pRef.current) pRef.current.rotation.y += d * 0.06
  })
  const pts = useMemo(() => genPoints(), [])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = []; pts.forEach(({ lat, lon }) => { const v = ll2v(lat, lon); p.push(v.x, v.y, v.z) })
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
    return g
  }, [pts])

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={1.6} color="#34d399" />
      <pointLight position={[-3, 2, -3]} intensity={0.9} color="#10b981" />
      <directionalLight position={[-3, 5, -3]} intensity={0.5} />
      <pointLight position={[0, -3, 3]} intensity={0.4} color="#6ee7b7" />
      {/* Extra light for verde tierra */}
      <pointLight position={[2, -2, -4]} intensity={0.3} color="#166534" />

      {/* 6-Layer massive glow aura — verde esmeralda */}
      <mesh>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.015} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.65, 32, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.35, 32, 32]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.18, 32, 32]} />
        <meshBasicMaterial color="#059669" transparent opacity={0.14} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.08, 32, 32]} />
        <meshBasicMaterial color="#6ee7b7" transparent opacity={0.18} side={THREE.BackSide} />
      </mesh>

      {/* Planet globe — verde tierra base */}
      <mesh ref={gRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#14532d"
          emissive="#166534"
          emissiveIntensity={0.4}
          roughness={0.5}
          metalness={0.15}
        />
      </mesh>

      {/* Internal particles — 600 bright + 150 deep */}
      <InternalParticles />
      <DeepParticles />

      {/* Farm points — main green layer (BIG) */}
      <points ref={pRef} geometry={geo}>
        <pointsMaterial color="#34d399" size={0.05} sizeAttenuation transparent opacity={0.95} />
      </points>
      {/* White glow layer */}
      <points geometry={geo}>
        <pointsMaterial color="#ffffff" size={0.028} sizeAttenuation transparent opacity={0.6} />
      </points>
      {/* Outer green halo per point */}
      <points geometry={geo}>
        <pointsMaterial color="#10b981" size={0.08} sizeAttenuation transparent opacity={0.2} />
      </points>
      {/* Extra dense emerald shimmer */}
      <points geometry={geo}>
        <pointsMaterial color="#6ee7b7" size={0.12} sizeAttenuation transparent opacity={0.06} />
      </points>

      {/* Triple orbital rings */}
      <mesh rotation={[Math.PI / 2.2, 0.15, 0]}>
        <ringGeometry args={[1.22, 1.25, 128]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2.6, -0.3, 0.2]}>
        <ringGeometry args={[1.35, 1.37, 128]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 1.8, 0.5, -0.1]}>
        <ringGeometry args={[1.45, 1.46, 128]} />
        <meshBasicMaterial color="#6ee7b7" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4}
        minPolarAngle={Math.PI / 3} maxPolarAngle={(2 * Math.PI) / 3} />
    </>
  )
}

export default function GlobeHero() {
  return (
    <Canvas camera={{ position: [0, 0, 3.0], fov: 45 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}>
      <Scene />
    </Canvas>
  )
}
