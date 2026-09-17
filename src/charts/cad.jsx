import React from 'react'

/* The DI-03 patch assembly, public/di/models/mindmap.glb.
 *
 * DESIGN INTENT — NOT AS-BUILT. Nothing here was measured from hardware.
 *
 * Six things this file has to get right, all learned the hard way:
 *
 *  1. Every changing prop goes through a ref and the effect runs once. When
 *     onSelect was a dependency, an inline arrow at the call site changed its
 *     identity on every render and tore down and rebuilt the entire scene —
 *     at ~60 fps inside a live view. That is the flicker.
 *  2. Recentre in LOCAL space. Box3.setFromObject reads world space and the
 *     rig is tipped, which silently swaps Y and Z. The box is taken while the
 *     assembly still hangs off nothing, so its world matrix IS its local one.
 *  3. setSize(w, h, false) leaves the canvas at its intrinsic pixel width,
 *     which grows the host, which fires the ResizeObserver, which grows it
 *     again. Pin the CSS size to 100% and the loop cannot start.
 *  4. Collect meshes across every scene, not just gltf.scene. A node may only
 *     have one parent, so a file that declares per-part scenes reparents the
 *     parts out of gltf.scene and whole layers go missing.
 *  5. touchAction 'none' let OrbitControls own every touch, so a vertical
 *     swipe over the canvas froze the page. pan-y gives scrolling back.
 *  6. A throw inside the draw loop cancels the loop — the object freezes and
 *     every control stops working. The loop is wrapped so one throw cannot.
 *
 * The file is EXT_meshopt_compression + KHR_mesh_quantization, so the loader
 * needs MeshoptDecoder or the load fails with no error anyone sees.
 *
 * three, the loaders and the 1 MB model are all imported inside the effect,
 * and the effect only arms once the container is near the viewport. On a
 * phone that is ~1.6 MB that never downloads for a reader who scrolls past.
 */

/* The 178 meshes are a flat list with no grouping nodes, so the seven layers
   exist in the names and nowhere else. These patterns are the whole mapping;
   `skin` is last because it is the remainder, and every name in both files
   lands in exactly one bucket. Order runs skin-side outwards, which is the
   order the explode separates them in. */
export const PATCH_LAYERS = [
  { id:'adhesive', match:/^Medical PU adhesive/,           label:'the medical adhesive base' },
  { id:'skin',     match:null,                              label:'the skin-side shell' },
  { id:'thermal',  match:/^(Thermal foam|NTC 0603|Copper skin pad|Conductive epoxy)/,
                                                            label:'the thermal isolation pocket' },
  { id:'pcb',      match:/^(Flex-rigid PCB|PCB |I2C |EDA guard|Polyimide flex|Flex copper|Passive |MAX30102|OPA2333|XIAO|LSM6DS3TR|PDM microphone)/,
                                                            label:'the flex-rigid board' },
  { id:'light',    match:/status (light|LED)/i,             label:'the status light guide' },
  { id:'battery',  match:/^(Conformal LiPo|LiPo |Pogo )/,   label:'the battery and charge contacts' },
  { id:'shell',    match:/^(Shell rigid core|PP port door)/, label:'the outer shell' },
]

/* The on-arm file carries one extra mesh. It is scenery: it never separates,
   it cannot be picked, and it is left out of the box the framing is built
   from, so the arm runs out of shot instead of shrinking the patch. */
const CONTEXT = { id:'arm', match:/^Anatomical arm/ }

/* The three-layer drawing this viewer grew up beside names its layers pod /
   pcb / base. Those are names on a drawing, not in this CAD, so a caller
   passing them is translated rather than ignored — otherwise pressing one of
   those toggles isolates nothing and reads as a dead control. */
const ALIAS = { pod:'shell', base:'adhesive', pcb:'pcb' }

const ORDER = Object.fromEntries(PATCH_LAYERS.map((l, i) => [l.id, i]))
const LABEL = Object.fromEntries(PATCH_LAYERS.map(l => [l.id, l.label]))

/* GLTFLoader runs every node name through sanitizeNodeName, which turns each
   space into an underscore so the name can be used in an animation binding
   path. Match against the name the file actually carries, or "PCB copper layer
   L1" arrives as "PCB_copper_layer_L1", five of the seven patterns miss, and
   the whole assembly collapses into two buckets. */
function bucket(name) {
  const n = name.replace(/_/g, ' ')
  if (CONTEXT.match.test(n)) return CONTEXT.id
  for (const l of PATCH_LAYERS) if (l.match && l.match.test(n)) return l.id
  return 'skin'
}

/* glTF is metres; the rig is scaled by 1000 so one world unit is one
   millimetre and every distance below can be read as a real dimension. */
const MM = 0.001
/* The gap the explode opens between neighbouring layers, in millimetres.
   Centred on the board, so the stack grows both ways and stays in frame. 13
   and not 9 because the shell's own dome is 17 mm tall: a gap smaller than the
   tallest part leaves the layers still interpenetrating. */
const SPREAD = 13

export function PatchCAD({ src, exploded = false, selected = null, onSelect, scrollSpin = false, className }) {
  const host = React.useRef(null)
  const [state, setState] = React.useState('loading')
  const layer = ALIAS[selected] ?? selected
  const props = React.useRef({ exploded, layer })
  props.current = { exploded, layer }
  /* How far the model has travelled through the viewport, 0 at the bottom edge
     and 1 at the top. Written by a listener and read by the draw loop, never
     by React — a state update per scroll event would re-run the effect that
     builds the scene. */
  const spin = React.useRef(0)
  const dragged = React.useRef(false)
  const onSelectRef = React.useRef(onSelect)
  onSelectRef.current = onSelect

  /* Nothing is fetched until the viewer is one screen away. rootMargin, not a
     plain intersection, so the model is decoding while the reader is still
     scrolling towards it and is up by the time it arrives. */
  const [near, setNear] = React.useState(false)
  React.useEffect(() => {
    const el = host.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { setNear(true); return }
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { setNear(true); io.disconnect() }
    }, { rootMargin: '100% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

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

  React.useEffect(() => {
    const el = host.current
    if (!el || !near) return
    if (!window.WebGLRenderingContext) { setState('unsupported'); return }

    let dead = false
    let teardown = () => {}

    ;(async () => {
      const [THREE, { GLTFLoader }, { OrbitControls }, { RoomEnvironment }, { MeshoptDecoder }] =
        await Promise.all([
          import('three'),
          import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('three/examples/jsm/controls/OrbitControls.js'),
          import('three/examples/jsm/environments/RoomEnvironment.js'),
          import('three/examples/jsm/libs/meshopt_decoder.module.js'),
        ])
      if (dead) return

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
      canvas.style.touchAction = 'pan-y'
      canvas.style.cursor = 'grab'
      // A bare <canvas> reaches a screen reader as an unlabelled graphic. This
      // one carries the assembly, so it is named, and the name follows what is
      // currently on screen rather than describing a fixed picture.
      canvas.setAttribute('role', 'img')
      canvas.setAttribute('tabindex', '0')
      canvas.setAttribute('aria-label', 'Design-intent CAD model of the patch. Drag to turn it.')
      el.appendChild(canvas)

      const scene = new THREE.Scene()
      /* Near is 10 and not 0.5 because the parts are foils and platings a few
         hundredths of a millimetre apart: four copper layers inside a 0.8 mm
         board. A near plane close to the eye spends the depth buffer on empty
         space in front of the model and the layers z-fight. */
      const camera = new THREE.PerspectiveCamera(30, 1, 10, 900)
      camera.position.set(72, 112, 148)

      // A neutral studio environment does the lighting, so the parts keep the
      // exact colours the CAD assigns them — carbon black PC/ABS, ENIG gold,
      // aluminised laminate. A tinted rig recolours the model rather than
      // lighting it, and these 22 materials are the whole legend.
      const pmrem = new THREE.PMREMGenerator(renderer)
      pmrem.compileEquirectangularShader()
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
      scene.environment = envRT.texture
      const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(60, 120, 90); scene.add(key)
      const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-90, 40, 70); scene.add(fill)

      /* Two nested frames on purpose. The scroll sweep turns `spinner`; `rig`
         holds the fixed CAD-to-world correction. Driving both from one node
         meant the sweep wrote over the correction and laid the patch flat. */
      const spinner = new THREE.Group()
      scene.add(spinner)
      const rig = new THREE.Group()
      rig.rotation.x = -Math.PI / 2          // CAD +Z (thickness) becomes world up
      rig.scale.setScalar(1 / MM)            // metres in the file, millimetres on screen
      spinner.add(rig)
      /* Built detached and only hung off the rig once it is measured and
         centred. attach() preserves WORLD transform, so attaching a part into
         a group that already sits under the scaled, tipped rig makes three
         quietly undo the rig for that part. Under a detached parent at
         identity there is nothing to undo. */
      const centred = new THREE.Group()

      const groups = {}
      const disposables = []
      /* Radii, not distances. A portrait container is narrower than the 30°
         vertical field, so the distance that frames the patch depends on the
         aspect and has to be recomputed as the box resizes — fixing it at load
         clipped the assembly off both edges of a 390 px column. */
      const fit = { base: 40, open: 70, solo: 30 }
      const need = r => r / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
                             * Math.min(1, camera.aspect))

      const controls = new OrbitControls(camera, canvas)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.enablePan = false
      controls.enableZoom = false
      controls.minDistance = 90
      controls.maxDistance = 340
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      // Scroll drives the rotation on the hardware page, so the idle spin would
      // fight it. One or the other, never both.
      controls.autoRotate = !reduce && !scrollSpin
      controls.autoRotateSpeed = 0.5
      // Once a human turns it, it is theirs — scroll stops driving it.
      controls.addEventListener('start', () => {
        controls.autoRotate = false; dragged.current = true; canvas.style.cursor = 'grabbing' })
      controls.addEventListener('end', () => { canvas.style.cursor = 'grab' })

      const loader = new GLTFLoader()
      loader.setMeshoptDecoder(MeshoptDecoder)
      loader.load(src, gltf => {
        if (dead) return
        const meshes = []
        for (const sc of [gltf.scene, ...(gltf.scenes || [])]) {
          sc?.updateMatrixWorld(true)
          sc?.traverse(o => { if (o.isMesh && !meshes.includes(o)) meshes.push(o) })
        }

        const mats = new Map()
        for (const mesh of meshes) {
          const id = bucket(mesh.name)
          const g = groups[id] || (groups[id] = (() => {
            const grp = new THREE.Group()
            grp.userData.spread = id === CONTEXT.id ? 0 : (ORDER[id] - 3) * SPREAD * MM
            centred.add(grp)
            return grp
          })())
          // attach, not add: it bakes the node chain the file declares into the
          // mesh, so reparenting cannot move a part that sits under a parent.
          g.attach(mesh)
          mesh.userData.layerId = id
          /* One clone per layer per material rather than one per mesh. The
             isolate fade writes opacity, and the 22 materials are shared across
             178 meshes, so writing the original would fade unrelated layers —
             but 178 clones is 178 shader programs for no gain. */
          const swap = m => {
            const k = id + '|' + m.uuid
            let c = mats.get(k)
            if (!c) { c = m.clone(); c.side = THREE.FrontSide; mats.set(k, c); disposables.push(c) }
            return c
          }
          mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material)
          disposables.push(mesh.geometry)
        }

        if (!meshes.length) { setState('error'); return }

        /* Local space by construction: the box is measured while `centred`
           still hangs off nothing, so each matrixWorld is relative to it and
           the tip that rig applies cannot get into the numbers. */
        centred.updateMatrixWorld(true)
        const box = new THREE.Box3(), part = new THREE.Box3()
        for (const mesh of meshes) {
          if (mesh.userData.layerId === CONTEXT.id) continue
          mesh.geometry.computeBoundingBox()
          part.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld)
          box.union(part)
        }
        const mid = box.getCenter(new THREE.Vector3())
        centred.position.copy(mid).negate()
        const size = box.getSize(new THREE.Vector3())

        /* Framing comes off the measured envelope, so a re-export at another
           size still fills the frame. The factors are under 1 because the
           radius bounds a sphere and the patch is a flat lozenge — 45 x 67 mm
           across and 22 mm deep — so fitting the sphere honestly leaves a third
           of the frame as air. Exploded, the stack really is that deep, which
           is why that factor is nearly 1. */
        const radius = size.length() / 2 / MM
        fit.base = radius * 0.82
        fit.open = new THREE.Vector3(size.x / MM, size.y / MM,
          size.z / MM + 6 * SPREAD).length() / 2 * 0.95
        fit.solo = radius * 0.62
        /* OrbitControls clamps the camera distance inside update(), so these
           bound what the draw loop asks for as well as what a drag can do.
           The ceiling is generous because a tall narrow column pushes the
           camera much further back than a wide one. */
        controls.minDistance = need(fit.solo) * 0.6
        controls.maxDistance = need(fit.open) * 6
        rig.add(centred)
        setState('ready')
      }, undefined, () => { if (!dead) setState('error') })

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
        const hit = ray.intersectObject(spinner, true)
          .find(h => h.object.visible && h.object.userData.layerId
                  && h.object.userData.layerId !== CONTEXT.id)
        const id = hit ? hit.object.userData.layerId : null
        onSelectRef.current?.(id === props.current.layer ? null : id)
      }
      canvas.addEventListener('pointerdown', onDown)
      canvas.addEventListener('pointerup', onUp)

      const clock = new THREE.Clock()
      let raf = 0, logged = false
      const tick = () => {
        const dt = Math.min(0.05, clock.getDelta())
        const { exploded: ex, layer: sel } = props.current
        const isolating = sel && groups[sel]
        for (const id in groups) {
          const g = groups[id]
          const mine = id === sel
          /* Isolating a layer used to fade the rest to 12% opacity and leave
             them exactly where they were. Measured against a pixel diff that
             changed 2.4% of the frame — technically working, and
             indistinguishable from a dead button. The chosen layer now comes to
             the centre and the others leave entirely. */
          const wantZ = isolating ? (mine ? 0 : g.userData.spread * 2.6)
            : ex ? g.userData.spread : 0
          g.position.z += (wantZ - g.position.z) * Math.min(1, dt * 5)
          const wantOpacity = !isolating || mine ? 1 : 0
          g.traverse(o => {
            if (!o.isMesh) return
            for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
              m.transparent = wantOpacity < 1
              m.depthWrite = wantOpacity > 0.9
              m.opacity += (wantOpacity - m.opacity) * Math.min(1, dt * 8)
              // A mesh at 1% opacity still costs a draw call and still tints what
              // is behind it. Below the threshold it is gone, not faint.
              o.visible = m.opacity > 0.015
            }
          })
        }
        /* The object turns because you scrolled past it, not on a timer.
           A bounded sweep, not a free spin: a full revolution lands the model at
           whatever angle the scroll position happens to give, and most of those
           angles are edge-on to a 2 mm-thick lozenge. This runs three-quarter
           view to three-quarter view the other way, so it is always readable. */
        if (scrollSpin && !dragged.current) {
          const t = spin.current
          const wantY = -0.75 + t * 1.5
          const wantX = -0.18 + (t - 0.5) * 0.36
          spinner.rotation.y += (wantY - spinner.rotation.y) * Math.min(1, dt * 5)
          spinner.rotation.x += (wantX - spinner.rotation.x) * Math.min(1, dt * 5)
        }
        // Isolated, one layer alone needs less room than the whole stack.
        const wantDist = need(isolating ? fit.solo : ex ? fit.open : fit.base)
        const offset = camera.position.clone().sub(controls.target)
        const d = offset.length()
        camera.position.copy(controls.target)
          .add(offset.setLength(d + (wantDist - d) * Math.min(1, dt * 3)))
        controls.update()
        renderer.render(scene, camera)
        raf = requestAnimationFrame(safe)
      }
      const safe = () => {
        try { tick() } catch (err) {
          if (!logged) { logged = true; console.error('[PatchCAD] render error — continuing', err) }
          raf = requestAnimationFrame(safe)
        }
      }
      raf = requestAnimationFrame(safe)

      teardown = () => {
        cancelAnimationFrame(raf); ro.disconnect(); controls.dispose()
        envRT.texture.dispose(); pmrem.dispose()
        canvas.removeEventListener('pointerdown', onDown)
        canvas.removeEventListener('pointerup', onUp)
        disposables.forEach(d => d?.dispose?.())   // the original leaked all of this
        renderer.dispose()
        if (canvas.parentNode === el) el.removeChild(canvas)
      }
    })().catch(err => {
      if (dead) return
      console.error('[PatchCAD] could not build the viewer', err)
      setState('error')
    })

    return () => { dead = true; teardown() }
  }, [src, near])

  /* Kept out of the draw loop: this is a DOM attribute, not a frame. The
     canvas exists before the model does, so the name has to track the failure
     states too — otherwise a blank canvas announces itself as an assembly. */
  React.useEffect(() => {
    const c = host.current?.querySelector('canvas')
    if (!c) return
    const name = LABEL[layer]
    c.setAttribute('aria-label',
      state !== 'ready' ? 'The design-intent CAD model of the patch is not on screen.'
      : name ? `Design-intent CAD model of the patch, showing ${name} alone. Drag to turn it.`
      : exploded
        ? `Design-intent CAD model of the patch, pulled apart into its ${PATCH_LAYERS.length} layers. Drag to turn it.`
        : 'Design-intent CAD model of the patch, assembled. Drag to turn it.')
  }, [layer, exploded, state])

  return (
    <div className="relative h-full w-full">
      <div ref={host} className={className} style={{ height: '100%', width: '100%' }}/>
      {/* The stamp every DI-03 asset carries. It sits on the canvas rather than
          in the caption because the canvas is the part that gets screenshotted
          out of the page and passed around on its own. */}
      <span className="pointer-events-none absolute left-3 top-3 font-mono text-fine uppercase tracking-[0.1em] text-ink-3">
        Design intent — not as-built
      </span>
      {state !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 grid place-content-center justify-items-center gap-4 px-6 text-center">
          {/* A drawn stand-in, not an empty box: seven sheets in the order the
              model stacks them, fading back so the stack reads as depth rather
              than as seven identical rings. The frame says what is coming even
              when nothing arrives. */}
          <svg viewBox="0 0 132 140" aria-hidden="true"
            className={`h-32 w-auto text-rule ${state === 'loading' ? 'animate-pulse' : ''}`}>
            {PATCH_LAYERS.map((l, i) => (
              <path key={l.id} transform={`translate(${i * 4} ${116 - i * 19})`}
                d="M20 6 h52 a10 7 0 0 1 0 14 h-52 a10 7 0 0 1 0 -14 z"
                fill="none" stroke="currentColor" strokeWidth="1.5"
                opacity={state === 'error' ? 0.4 : 0.34 + i * 0.1}/>
            ))}
          </svg>
          <p className="font-mono text-tick text-ink-3">
            {state === 'loading' ? 'Loading the model…'
              : state === 'unsupported' ? 'This browser cannot draw 3D, so the seven-layer assembly cannot be shown here.'
              : 'The model did not load, so the seven-layer assembly cannot be shown here.'}
          </p>
        </div>
      )}
    </div>
  )
}
