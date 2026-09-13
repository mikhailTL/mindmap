import React from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

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

export function PatchCAD({ src, exploded = false, selected = null, onSelect, scrollSpin = false, className }) {
  const host = React.useRef(null)
  const [state, setState] = React.useState('loading')
  const props = React.useRef({ exploded, selected })
  props.current = { exploded, selected }
  /* How far the model has travelled through the viewport, 0 at the bottom edge
     and 1 at the top. Written by a listener and read by the draw loop, never
     by React — a state update per scroll event would re-run the effect that
     builds the scene. */
  const spin = React.useRef(0)
  const dragged = React.useRef(false)
  React.useEffect(() => {
    if (!scrollSpin) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = host.current
    if (!el) return
    const read = () => {
      const r = el.getBoundingClientRect()
      const span = innerHeight + r.height
      spin.current = Math.max(0, Math.min(1, (innerHeight - r.top) / span))
      el.dataset.spin = spin.current.toFixed(3)
    }
    read()
    addEventListener('scroll', read, { passive: true })
    addEventListener('resize', read)
    return () => { removeEventListener('scroll', read); removeEventListener('resize', read) }
  }, [scrollSpin])
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

    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    const canvas = renderer.domElement
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    // 'none' let OrbitControls own every touch, so a vertical swipe over the
    // canvas froze the page. pan-y gives scrolling back and keeps the drag.
    canvas.style.touchAction = 'pan-y'
    canvas.style.cursor = 'grab'
    // A bare <canvas> reaches a screen reader as an unlabelled graphic. This
    // one carries the assembly, so it is named, and the name follows what is
    // currently on screen rather than describing a fixed picture.
    canvas.setAttribute('role', 'img')
    canvas.setAttribute('tabindex', '0')
    el.appendChild(canvas)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 600)
    camera.position.set(62, 44, 80)

    // A neutral studio environment does the lighting, so the parts keep the
    // exact colours the CAD assigns them. The earlier rig used a teal rim and a
    // grey-green fill, which tinted every surface — that is recolouring the
    // model, not lighting it.
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = envRT.texture
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(38, 64, 48); scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-48, 24, 56); scene.add(fill)

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
        // Clone so the isolate fade never writes opacity back into a material the
        // GLB may share between parts. Colour, metalness and roughness are the
        // file's own — nothing here overrides them.
        mesh.material = mesh.material.clone()
        mesh.material.side = THREE.FrontSide
        disposables.push(mesh.geometry, mesh.material)
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
    controls.minDistance = 60
    controls.maxDistance = 260
    controls.enableZoom = false
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    // Scroll drives the rotation on the hardware page, so the idle spin would
    // fight it. One or the other, never both.
    controls.autoRotate = !reduce && !scrollSpin
    controls.autoRotateSpeed = 0.5
    // Stop auto-rotating the moment a human takes over. It is their object now.
    // Once a human turns it, it is theirs — scroll stops driving it.
    controls.addEventListener('start', () => {
      controls.autoRotate = false; dragged.current = true; canvas.style.cursor = 'grabbing' })
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
        const mine = sel === part
        const spread = ex ? { base: -16, pcb: 2, pod: 24 }[part] : 0
        /* Isolating a layer used to fade the other two to 12% opacity and leave
           them exactly where they were. Measured against a pixel diff that
           changed 2.4% of the frame — technically working, and indistinguishable
           from a dead button. The selected layer now comes to the centre and the
           others leave entirely. */
        const wantZ = sel ? (mine ? 0 : g.userData.home * 2.2) : g.userData.home + spread
        g.position.z += (wantZ - g.position.z) * Math.min(1, dt * 5)
        const wantOpacity = !sel || mine ? 1 : 0
        g.traverse(o => {
          if (!o.isMesh) return
          o.material.transparent = wantOpacity < 1
          o.material.depthWrite = wantOpacity > 0.9
          o.material.opacity += (wantOpacity - o.material.opacity) * Math.min(1, dt * 8)
          // A mesh at 1% opacity still costs a draw call and still tints what is
          // behind it. Below the threshold it is gone, not faint.
          o.visible = o.material.opacity > 0.015
        })
      }
      // Isolated, one layer alone needs less room than the whole stack.
      const wantDistSel = sel ? 96 : null
      /* The object turns because you scrolled past it, not on a timer.
         A bounded sweep, not a free spin: a full revolution lands the model at
         whatever angle the scroll position happens to give, and most of those
         angles are flat-on and unflattering. This runs three-quarter view to
         three-quarter view the other way, so it is always readable. */
      if (scrollSpin && !dragged.current) {
        const t = spin.current
        const wantY = -0.85 + t * 1.7           // about 97 degrees, centred on front
        const wantX = 0.02 + (t - 0.5) * 0.30   // tips down as it rises
        rig.rotation.y += (wantY - rig.rotation.y) * Math.min(1, dt * 5)
        rig.rotation.x += (wantX - rig.rotation.x) * Math.min(1, dt * 5)
      }
      const wantDist = wantDistSel ?? (ex ? 172 : 118)
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
      envRT.texture.dispose(); pmrem.dispose()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      disposables.forEach(d => d?.dispose?.())   // the original leaked all of this
      renderer.dispose()
      if (canvas.parentNode === el) el.removeChild(canvas)
    }
  }, [src])

  /* Kept out of the draw loop: this is a DOM attribute, not a frame. */
  React.useEffect(() => {
    const c = host.current?.querySelector('canvas')
    if (!c) return
    const name = { pod:'the printed shell', pcb:'the circuit board', base:'the sensor face' }[selected]
    c.setAttribute('aria-label', name
      ? `CAD model of the patch, showing ${name} alone. Drag to turn it.`
      : exploded
        ? 'CAD model of the patch, pulled apart into its three layers. Drag to turn it.'
        : 'CAD model of the patch, assembled. Drag to turn it.')
  }, [selected, exploded, state])

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
