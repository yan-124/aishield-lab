import React, { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ============================================================
   AIShield Lab — ShieldyModel Component (v5 rewrite)
   - 修复鬼影问题：使用条件渲染替代透明度过渡
   - 修复遮挡问题：调整模型位置避免脚部被截断
   - 模型2体积减小5%
   - GLB加载失败时降级显示CSS盾牌
   ============================================================ */

/* ── GLB Loader (v6 — themed color injection for white materials) ── */
// Theme palette removed — model colors preserved as designed
// const THEME_COLORS = [...]

function isPureWhite(color: any): boolean {
  if (!color) return true // default white
  const hex = color.getHex()
  // Check if RGB channels are all near-maximum (>= 0xF0 per channel)
  const r = (hex >> 16) & 0xFF
  const g = (hex >> 8) & 0xFF
  const b = hex & 0xFF
  return r >= 0xF0 && g >= 0xF0 && b >= 0xF0
}

function loadGLB(url: string, scaleMultiplier: number = 1.0): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader()
      loader.load(
        url,
        (gltf) => {
          const scene = gltf.scene.clone(true)
          let meshIdx = 0
          // Fix materials: kill emissive, inject themed colors for white/no-texture materials
          scene.traverse((child: any) => {
            if (child.isMesh && child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material]
              mats.forEach((mat: any) => {
                if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial) {
                  // Step 1: ALWAYS kill emissive — no exceptions
                  if (mat.emissive) {
                    mat.emissive.setHex(0x000000)
                  }
                  mat.emissiveIntensity = 0
                  if (mat.emissiveMap) {
                    mat.emissiveMap = null
                  }

                  // Step 2: Preserve original colors — do NOT inject themed colors
                  // The model designer intended white/silver colors, don't override them
                  const hasBaseTexture = !!mat.map
                  if (!hasBaseTexture) {
                    // No texture — keep original baseColor (white/silver)
                    // Previously injected purple colors here, removed to match design intent
                  }
                  // Has texture — preserve texture and baseColor, no changes needed

                  // Step 3: Enhance surface definition for better visual quality
                  mat.roughness = Math.max(0.35, Math.min(0.8, (mat.roughness ?? 0.6)))
                  mat.metalness = Math.max(0.05, Math.min(0.35, (mat.metalness ?? 0.15)))
                }
              })
              meshIdx++
            }
          })
          // Auto-center & scale (应用额外的缩放因子)
          const box = new THREE.Box3().setFromObject(scene)
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z) || 1
          const baseScale = 1.45 / maxDim
          scene.scale.setScalar(baseScale * scaleMultiplier)
          const box2 = new THREE.Box3().setFromObject(scene)
          const center = box2.getCenter(new THREE.Vector3())
          // 向上偏移0.25，避免脚部被底部遮挡
          scene.position.set(-center.x, -center.y - 0.42 + 0.25, -center.z)
          resolve(scene)
        },
        undefined,
        (err) => {
          console.error('[ShieldyModel] GLB load failed:', url, err)
          reject(new Error('GLB load failed: ' + url))
        }
      )
    }).catch(reject)
  })
}

/* ── Model with idle animation ── */
export function AnimatedModel({ model }: { model: THREE.Group }) {
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

/* ── Single model with smooth fade-in then lock opaque ── */
function SingleModel({ model }: { model: THREE.Group }) {
  const groupRef = useRef<THREE.Group>(null!)
  const tRef = useRef(0)
  const fadeInDone = useRef(false)
  
  useFrame((_, delta) => {
    if (!groupRef.current) return
    
    // Fade-in animation: only run until opacity reaches ~0.98, then lock opaque
    if (!fadeInDone.current) {
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial
          if (mat.userData?.targetOpacity !== undefined) {
            const current = mat.opacity ?? 0
            const target = mat.userData.targetOpacity
            if (Math.abs(current - target) < 0.02) {
              // Close enough — lock to opaque
              mat.opacity = 1
              mat.transparent = false
              mat.needsUpdate = true
              delete mat.userData.targetOpacity
            } else {
              mat.opacity = THREE.MathUtils.lerp(current, target, 0.08)
              mat.needsUpdate = true
            }
          }
        }
      })
      // Check if all materials reached their target
      let allDone = true
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if ((child.material as THREE.MeshStandardMaterial).userData?.targetOpacity !== undefined) {
            allDone = false
          }
        }
      })
      if (allDone) fadeInDone.current = true
    }
    
    // Idle animation
    tRef.current += delta * 0.5
    groupRef.current.rotation.y = Math.sin(tRef.current) * 0.25
    groupRef.current.position.y = Math.sin(tRef.current * 1.5) * 0.04
  })
  
  // Set up fade-in targets when model changes
  useEffect(() => {
    fadeInDone.current = false
    if (model) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial
          mat.userData.targetOpacity = mat.opacity || 1
          mat.transparent = true
          mat.opacity = 0
          mat.needsUpdate = true
        }
      })
    }
  }, [model])
  
  return <group ref={groupRef}><primitive object={model} /></group>
}

/* ── Floating particles ── */
function Particles({ count = 30 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 2.5
      a[i * 3 + 1] = Math.random() * 2.5 - 0.5
      a[i * 3 + 2] = (Math.random() - 0.5) * 2
    }
    return a
  }, [count])

  useFrame(({ clock }) => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3] + Math.sin(t * 0.3 + i) * 0.04,
        positions[i * 3 + 1] + ((t * (0.15 + i % 3 * 0.1) + i) % 2.5) - 0.8,
        positions[i * 3 + 2] + Math.cos(t * 0.2 + i) * 0.04
      )
      dummy.scale.setScalar(0.016 + Math.sin(t * 2 + i) * 0.007)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#38BDF8" transparent opacity={0.3} depthWrite={false} />
    </instancedMesh>
  )
}

/* ── Scene lighting ── */
export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.4} color="#e8eeff" />
      <hemisphereLight intensity={0.3} color="#99ccff" groundColor="#0a0a15" />
      <directionalLight position={[0, 6, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-4, 3, 3]} intensity={0.5} color="#60b8ff" />
      <directionalLight position={[3, 2, -2]} intensity={0.35} color="#a78bfa" />
      <pointLight position={[2, 1.5, -2]} intensity={0.6} color="#38BDF8" distance={6} />
      <pointLight position={[0, -1, 1.5]} intensity={0.2} color="#ffffff" distance={5} />
      <pointLight position={[-2, 0, 2]} intensity={0.3} color="#f472b6" distance={4} />
    </>
  )
}

/* ── Camera + GL options ── */
export const CAM = { position: [0, 0.38, 2.8] as [number, number, number], fov: 46 }
export const GL_OPTS = { antialias: true, alpha: true, toneMapping: 4, outputColorSpace: 'srgb' as const }

/* ── CSS盾牌降级组件 ── */
function FallbackShield({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className ?? ''}`} style={{ width: '100%', height: '100%' }}>
      <div style={{
        width: '120px', height: '144px',
        background: 'linear-gradient(135deg, #A78BFA 0%, #60A5FA 50%, #22D3EE 100%)',
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 70%, 50% 100%, 0% 70%, 0% 25%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        filter: 'drop-shadow(0 0 30px rgba(139,92,246,0.4))',
      }}>
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
    </div>
  )
}

/* ── Standalone card — used by HeroSection ── */
export function ShieldyModelCard({
  modelUrl,
  className,
}: {
  modelUrl: string
  className?: string
}) {
  const [model, setModel] = useState<THREE.Group | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError(false)
    setModel(null)
    loadGLB(modelUrl).then(m => {
      if (!cancelled) setModel(m)
    }).catch((err) => {
      console.error('[ShieldyModel] Failed to load model card:', modelUrl, err)
      if (!cancelled) setError(true)
    })
    return () => { cancelled = true }
  }, [modelUrl])

  if (error) return <FallbackShield className={className} />

  return (
    <Canvas camera={CAM} gl={GL_OPTS} dpr={[1, 2]} className={className}
      style={{ width: '100%', height: '100%', outline: 'none', border: 'none', display: 'block', mixBlendMode: 'normal', transition: 'opacity 0.5s ease' }}
      onCreated={(state) => {
        state.gl.setClearColor(0x000000, 0)
        const cvs = state.gl.domElement
        if (cvs) {
          cvs.style.background = 'transparent'
        }
      }}>
      <SceneLighting />
      {model && <><SingleModel model={model} /><Particles count={25} /></>}
    </Canvas>
  )
}

/* ── Main multi-variant component (standalone with Canvas) ── */
const MODEL_URLS = [
  'https://aiseclearn.oss-cn-beijing.aliyuncs.com/shieldy-d.glb',
  'https://aiseclearn.oss-cn-beijing.aliyuncs.com/shieldy-e.glb',
  'https://aiseclearn.oss-cn-beijing.aliyuncs.com/shieldy-f.glb',
]

// 模型缩放配置：第二个模型减小5%
const MODEL_SCALE_MULTIPLIERS = [1.0, 0.95, 1.0]

export function ShieldyScene() {
  const [model, setModel] = useState<THREE.Group | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => setHasError(true), 15000)
    loadGLB(MODEL_URLS[0], MODEL_SCALE_MULTIPLIERS[0]).then(m => {
      clearTimeout(timeoutId)
      setModel(m)
    }).catch((err) => {
      console.error('[ShieldyModel] Failed to load scene model:', MODEL_URLS[0], err)
      clearTimeout(timeoutId)
      setHasError(true)
    })
  }, [])

  if (hasError) return <FallbackShield />
  if (!model) return <><SceneLighting /></>

  return (
    <group>
      <SingleModel model={model} />
      <Particles count={30} />
    </group>
  )
}

/* ── Multi-model switching component with preloading ── */
function MultiModelSwitcher() {
  const [models, setModels] = useState<(THREE.Group | null)[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  // transition state removed

  useEffect(() => {
    MODEL_URLS.forEach((url, idx) => {
      loadGLB(url, MODEL_SCALE_MULTIPLIERS[idx]).then(m => {
        setModels(prev => {
          const next = [...prev]
          next[idx] = m
          return next
        })
      }).catch((err) => {
        console.error('[ShieldyModel] MultiModelSwitcher failed to load:', url, err)
        setModels(prev => {
          const next = [...prev]
          next[idx] = null
          return next
        })
      })
    })
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % MODEL_URLS.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  const currentModel = models[currentIdx]
  if (!currentModel) return <><SceneLighting /></>

  return (
    <group>
      <SingleModel model={currentModel} />
      <Particles count={30} />
    </group>
  )
}

/* ── Error Boundary ── */
class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('ShieldyModel error:', error, info)
  }
  render() {
    if (this.state.hasError) return this.props.fallback as React.ReactElement
    return this.props.children as React.ReactElement
  }
}

/* ── Default export for React.lazy ── */
export default function ShieldyModel({ modelUrl, className }: { modelUrl?: string; className?: string } = {}) {
  if (modelUrl) {
    return <ShieldyModelCard modelUrl={modelUrl} className={className} />
  }

  return (
    <Canvas camera={CAM} gl={GL_OPTS} dpr={[1, 2]} className={className}
      style={{ width: '100%', height: '100%', outline: 'none', border: 'none', display: 'block', mixBlendMode: 'normal', transition: 'opacity 0.5s ease' }}
      onCreated={(state) => {
        state.gl.setClearColor(0x000000, 0)
        const cvs = state.gl.domElement
        if (cvs) {
          cvs.style.background = 'transparent'
        }
      }}>
      <SceneLighting />
      <ErrorBoundary fallback={<FallbackShield />}>
        <MultiModelSwitcher />
      </ErrorBoundary>
    </Canvas>
  )
}