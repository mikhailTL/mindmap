import React from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/* The real Onshape export, MindMap-Patch-colored.glb.
 *
 * Three things this file has to get right, all learned the hard way in the
 * original viewer:
 *
 *  1. Every changing prop goes through a ref and the effect runs once. When
 *     onSelect was a dependency, an inline arrow at the call site changed its
 *     identity on every render and tore down and rebuilt the entire scene —
 *     at ~60 fps inside a live view. That is the flicker.
 *  2. The part studio laid the three bodies out side by side, so their X
 *     offsets are baked into the vertices: dropped in as-is you get a 172 mm
 *     row, not a stack. Recentre each named node's GEOMETRY in local space —
 *     Box3.setFromObject is world space and the rig is tipped, which silently
 *     swaps Y and Z.
 *  3. setSize(w, h, false) leaves the canvas at its intrinsic pixel width,
 *     which grows the host, which fires the ResizeObserver, which grows it
 *     again. Pin the CSS size to 100% and the loop cannot start.
 */

const NAME_TO_PART = { AdhesiveBase: 'base', SensorBoard: 'pcb', ElectronicsPod: 'pod' }
const STACK = { base: 0, pcb: 4.5, pod: 8.25 }        // millimetres

export function PatchCAD({ src, exploded = false, selected = null, onSelect, className }) {
  const host = React.useRef(null)
  const [state, setState] = React.useState('loading')
  const props = React.useRef({ exploded, selected })
  props.current = { exploded, selected }
  const onSelectRef = React.useRef(onSelect)
  onSelectRef.current = onSelect

  React.useEffect(() => {
    const el = host.current
    if (!el) return
    if (!window.WebGLRenderingContext) { setState('unsupported'); return }

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch { setState('unsupported'); return }

    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    const canvas = renderer.domElement
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.touchAction = 'none'
    canvas.style.cursor = 'grab'
    el.appendChild(canvas)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 500)
    camera.position.set(62, 44, 80)

    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(40, 70, 50); scene.add(key)
    const rim = new THREE.DirectionalLight(new THREE.Color('#0f6b62'), 1.1); rim.position.set(-60, -20, -40); scene.add(rim)
    const fill = new THREE.DirectionalLight(new THREE.Color('#c9d8d4'), 1.0); fill.position.set(-40, 30, 60); scene.add(fill)

    const rig = new THREE.Group()
    rig.rotation.x = -Math.PI / 2          // CAD +Z (thickness) becomes world up
    scene.add(rig)

    const groups = {}
    const disposables = []

    new GLTFLoader().load(src, gltf => {
      // The file declares four scenes: the real assembly plus one single-node
      // scene per part. A node may only have one parent, so building the extra
      // scenes reparents the parts out of gltf.scene — ElectronicsPod silently
      // went missing and the render came back with two layers instead of three.
      // Collect by name across every scene instead of trusting gltf.scene.
      const found = {}
      for (const sc of [gltf.scene, ...(gltf.scenes || [])]) {
        sc?.traverse(o => {
          const part = NAME_TO_PART[o.name]
          if (part && o.isMesh && !found[part]) found[part] = o
        })
      }
      for (const part in found) {
        const mesh = found[part]
        mesh.geometry.computeBoundingBox()
        const bb = mesh.geometry.boundingBox
        // Local space, so the tipped rig cannot swap the axes under us.
        mesh.geometry.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2,
                                -(bb.min.z + bb.max.z) / 2)
        mesh.userData.partId = part
        disposables.push(mesh.geometry, mesh.material)   // the GLB's materials are already correct
        // The node carries the stack translation and so does the group; keeping
        // both doubled every offset and buried the board inside the shell.
        mesh.position.set(0, 0, 0)
        const g = new THREE.Group()
        g.add(mesh)
        g.userData.home = STACK[part]
        g.position.z = STACK[part]
        rig.add(g)
        groups[part] = g
      }
      setState(Object.keys(groups).length ? 'ready' : 'error')
    }, undefined, () => setState('error'))

    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.minDistance = 55
    controls.maxDistance = 240
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotate = !reduce
    controls.autoRotateSpeed = 0.5
    // Stop auto-rotating the moment a human takes over. It is their object now.
    controls.addEventListener('start', () => { controls.autoRotate = false; canvas.style.cursor = 'grabbing' })
    controls.addEventListener('end', () => { canvas.style.cursor = 'grab' })

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(el)

    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2()
    let down = null
    const onDown = e => { down = { x: e.clientX, y: e.clientY } }
    const onUp = e => {
      if (!down) return
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null
      if (moved > 5) return             // a drag is an orbit, not a click
      const r = canvas.getBoundingClientRect()
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ptr, camera)
      const hit = ray.intersectObject(rig, true).find(h => h.object.userData.partId)
      const id = hit ? hit.object.userData.partId : null
      onSelectRef.current?.(id === props.current.selected ? null : id)
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)

    const clock = new THREE.Clock()
    let raf = 0, logged = false
    const tick = () => {
      const dt = Math.min(0.05, clock.getDelta())
      const { exploded: ex, selected: sel } = props.current
      for (const part in groups) {
        const g = groups[part]
        const spread = ex ? { base: -16, pcb: 2, pod: 24 }[part] : 0
        const wantZ = g.userData.home + spread
        g.position.z += (wantZ - g.position.z) * Math.min(1, dt * 5)
        const wantOpacity = !sel || sel === part ? 1 : 0.12
        g.traverse(o => {
          if (!o.isMesh) return
          o.material.transparent = wantOpacity < 1
          o.material.opacity += (wantOpacity - o.material.opacity) * Math.min(1, dt * 8)
        })
      }
      const wantDist = ex ? 168 : 124
      controls.target.y += ((ex ? 2 : 1) - controls.target.y) * Math.min(1, dt * 3)
      const offset = camera.position.clone().sub(controls.target)
      const d = offset.length()
      camera.position.copy(controls.target).add(offset.setLength(d + (wantDist - d) * Math.min(1, dt * 3)))
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(safe)
    }
    // A throw inside the loop cancels the loop — the object silently freezes
    // and every control stops working. Log once and keep drawing.
    const safe = () => {
      try { tick() } catch (err) {
        if (!logged) { logged = true; console.error('[PatchCAD] render error — continuing', err) }
        raf = requestAnimationFrame(safe)
      }
    }
    raf = requestAnimationFrame(safe)

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      disposables.forEach(d => d?.dispose?.())   // the original leaked all of this
      renderer.dispose()
      if (canvas.parentNode === el) el.removeChild(canvas)
    }
  }, [src])

  return (
    <div className="relative h-full w-full">
      <div ref={host} className={className} style={{ height: '100%', width: '100%' }}/>
      {state !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 grid place-content-center px-6 text-center">
          <p className="font-mono text-label uppercase tracking-[0.12em] text-ink-3">
            {state === 'loading' ? 'Loading the model…'
              : state === 'unsupported' ? 'This browser cannot draw 3D. The diagram beside it carries the same information.'
              : 'The model did not load. The diagram beside it carries the same information.'}
          </p>
        </div>
      )}
    </div>
  )
}
