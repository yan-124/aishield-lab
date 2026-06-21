import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ============================================================
   AIShield Lab — ShieldyModel Component
   Supports multiple GLB variants with material enhancement
   ============================================================ */

/* ── GLB Loader ── */
function loadGLB(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader()
      loader.load(
        url,
        (gltf) => {
          const scene = gltf.scene.clone(true)
          scene.traverse((child: any) => {
            if (child.isMesh && child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material]
              mats.forEach((mat: any) => {
                if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial) {
                  mat.roughness = Math.max(0.15, (mat.roughness ?? 0.7) - 0.25)
                  mat.metalness = Math.min(0.55, (mat.metalness ?? 0.1) + 0.2)
                  if (mat.color) {
                    const c = mat.color
                    const boost = 1.15
                    c.r = Math.min(1, c.r * boost)
                    c.g = Math.min(1, c.g * boost)
                    c.b = Math.min(1, c.b * boost)
                  }
                }
              })
            }
          })
          const box = new THREE.Box3().setFromObject(scene)
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z) || 1
          scene.scale.setScalar(1.45 / maxDim)
          const box2 = new THREE.Box3().setFromObject(scene)
          const center = box2.getCenter(new THREE.Vector3())
          scene.position.set(-center.x, -center.y - 0.12, -center.z)
          resolve(scene)
        },
        undefined,
        () => reject(new Error(`GLB load failed: ${url}`))
      )
    }).catch(reject)
  })
}

/* ── Idle animation ── */
function AnimatedModel({ model }: { model: THREE.Group }) {
  const groupRef = useRef<THREE.Group>(null!)
  const tRef = useRef(0)
  useFrame((_, delta) => {
    if (!groupRef.current) return
    tRef.current += delta * 0.5
    groupRef.current.rotation.y = Math.sin(tRef.current) * 0.25
    groupRef.current.position.y = Math.sin(tRef.current * 1.5) * 0.04
  })
  return <group ref={groupRef}><primitive object={model} /></group>
}

/* ── Scene decorations ── */
function GlowRing() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((_, d) => { if (ref.current) { ref.current.rotation.z += d * 0.2; ref.current.rotation.x += d * 0.1 } })
  return (
    <mesh ref={ref} position={[0, -0.2, -0.4]}>
      <torusGeometry args={[0.7, 0.006, 16, 64]} />
      <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={0.5} transparent opacity={0.18} depthWrite={false} />
    </mesh>
  )
}

function Particles({ count = 35 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) { a[i*3] = (Math.random()-0.5)*2.5; a[i*3+1] = Math.random()*2.5-0.5; a[i*3+2] = (Math.random()-0.5)*2 }
    return a
  }, [count])

  useFrame(({ clock }) => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      dummy.position.set(positions[i*3]+Math.sin(t*0.3+i)*0.04, positions[i*3+1]+((t*(0.15+i%3*0.1)+i)%2.5)-0.8, positions[i*3+2]+Math.cos(t*0.2+i)*0.04)
      dummy.scale.setScalar(0.016 + Math.sin(t*2+i)*0.007)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
    <sphereGeometry args={[1,6,6]} />
    <meshBasicMaterial color="#38BDF8" transparent opacity={0.3} depthWrite={false} />
  </instancedMesh>
}

function LoadingSpinner() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(() => { if (ref.current) ref.current.rotation.z -= 0.04 })
  return (
    <mesh ref={ref}>
      <torusGeometry args={[0.3, 0.035, 16, 48]} />
      <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={0.5} transparent opacity={0.35} />
    </mesh>
  )
}

export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.75} color="#e8eeff" />
      <hemisphereLight intensity={0.55} color="#99ccff" groundColor="#0a0a15" />
      <directionalLight position={[0, 6, 5]} intensity={3.5} color="#ffffff" />
      <directionalLight position={[-4, 3, 3]} intensity={1.2} color="#60b8ff" />
      <directionalLight position={[3, 2, -2]} intensity={0.8} color="#a78bfa" />
      <pointLight position={[2, 1.5, -2]} intensity={1.2} color="#38BDF8" distance={6} />
      <pointLight position={[0, -1, 1.5]} intensity={0.5} color="#ffffff" distance={5} />
      <pointLight position={[-2, 0, 2]} intensity={0.6} color="#f472b6" distance={4} />
    </>
  )
}

/* ── Camera + GL options (reusable) ── */
export const CAM = { position: [0, 0.2, 2.8] as [number, number, number], fov: 46 }
export const GL_OPTS = { antialias: true, alpha: true, toneMapping: 4, outputColorSpace: 'srgb' as const }

/* ── Standalone card — used by HeroSection ── */
export function ShieldyModelCard({
  modelUrl,
  className,
}: {
  modelUrl: string
  className?: string
}) {
  const [model, setModel] = useState<THREE.Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    loadGLB(modelUrl).then(m => {
      if (!cancelled) { setModel(m); setLoading(false) }
    }).catch(() => {
      if (!cancelled) { setError(true); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [modelUrl])

  // 模型加载失败时返回null，不渲染残环
  if (error) return null

  return (
    <Canvas camera={CAM} gl={GL_OPTS} dpr={[1, 2]} className={className}
      style={{ background: 'transparent', width: '100%', height: '100%' }}>
      <SceneLighting />
      {loading ? <LoadingSpinner /> : <><GlowRing /><Particles count={35} /><AnimatedModel model={model!} /></>}
    </Canvas>
  )
}

/* ── Main multi-variant component (renders inside parent Canvas) ── */
const MODEL_URLS = ['https://aiseclearn.oss-cn-beijing.aliyuncs.com/shieldy-b.glb', 'https://aiseclearn.oss-cn-beijing.aliyuncs.com/shieldy-d.glb']

export default function ShieldyModel() {
  const [models, setModels] = useState<THREE.Group[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all(MODEL_URLS.map(loadGLB)).then(loaded => {
      setModels(loaded)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Auto-switch every 5 seconds
  useEffect(() => {
    if (models.length < 2) return
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % models.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [models.length])

  if (loading || models.length === 0) {
    return <><SceneLighting /><GlowRing /><Particles count={40} /><LoadingSpinner /></>
  }

  const model = models[activeIndex]

  if (!model) {
    return (
      <>
        <SceneLighting />
        <GlowRing />
        <Particles count={20} />
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[0.4, 0.045, 16, 48]} />
          <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={0.8} transparent opacity={0.5} />
        </mesh>
      </>
    )
  }

  return (
    <>
      <SceneLighting />
      <GlowRing />
      <Particles count={35} />
      <AnimatedModel key={`model-${activeIndex}`} model={model} />
    </>
  )
}
