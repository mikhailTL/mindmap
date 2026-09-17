# MindMap — DESIGN INTENT — NOT AS-BUILT

Revision DI-03 · 15 September 2026 · millimetres

**Status: a detailed presentation model with unresolved requirements. This is not a fully compliant production design, an as-built record, a manufacturing release, or evidence of sensor performance.** The supplied specification is the dimensional starting point. No MindMap engineering CAD, schematic, approved BOM, netlist, tolerance stack, or prototype measurements were available. The missing baseline prevents the requested exact agreement and an honest claim that the moulded model is thinner than the prototype.

## Current presentation update

The on-arm configuration now uses a closed anatomical mesh with hand, wrist, forearm, elbow and an upper-arm segment, adapted from the MakeHuman CC0 base mesh. The local contact region is fitted to the existing R42 adhesive surface. The original 178 physical body entries are retained. The neutral deboss is restored; the supplied logo is engraved above it in the same shell body. This is generic context anatomy, not a patient scan or anthropometric validation. Context body 181 is a mesh, not a B-rep; the old cylindrical context solid is excluded from this release.

The new `exploded/` assets provide seven CAD-derived flat SVG layer sheets and a reusable CSS 3D stack, plus a projected technical drawing. The physical CAD explode keeps its assembly order; the animation now includes the neutral logo engraving. The drawing's source dimensions, palette contrast measurements, constraint resolution and seven applied audit answers are in that folder.

Arm source: [MakeHuman base mesh](https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/3dobjs/base.obj), with [CC0 asset licence](https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md). The source mesh and licence are included.


The requested glow reversal removes both added branding bodies and their emissive materials. The full anatomical arm and CAD-derived exploded drawing remain in this release. The supplied 81 × 42 px logo is traced as a capsule border, rounded inner path and circular endpoint, then engraved 0.25 mm deep above the wordmark at nominal width 11.5 mm. Nominal walls are drafted 3°. This is a raster-derived fit; an original vector was not supplied.

## Ten self-audit answers

1. **NOT SATISFIED:** global 1.5°/3° draft and tool release are unverified; the service port and bent acoustic channel need a resolved tool scheme.
2. **PARTIAL:** the principal closure follows one continuous perimeter form feature; the door interface and pre-weld director remain separate design features.
3. **FAIL, literal wording:** red/IR cones overlap 0.326 mm³ outside tissue; each emitter/photodiode pair overlaps 0.000 mm³ there, but optical crosstalk is unproven.
4. **PASS, internal consistency:** annotation names resolve to the 183-entry model registry/BOM; agreement with the engineering BOM cannot be checked.
5. **UNVERIFIED:** a C2 spline construction gives a broad smooth highlight; G2 joins and the specified R1.2-to-R2.8 blend law have not been certified.
6. **PASS, geometry:** flex inner radius is 3.225 mm, with a 0.15 mm stack; its board assembly moves rigidly, preserving the bend in every saved state.
7. **FAIL:** the provisional antenna volume intersects 38 body entries, including about 477.3 mm³ of the battery; it is also not an exact antenna offset.
8. **PARTIAL:** all staged lifts are Z-only and bonded groups stay together; true assembly order and the literal per-part 0.22× offset rule are unverified.
9. **UNVERIFIABLE:** the engineering baseline is absent; all assigned dimensions and known deviations are listed below, including the larger vendor XIAO envelope.
10. **LABELS:** the required label is present in every supplied render, the model title blocks, review pages, viewer, and generated first/last animation frames.

These results are intentionally not an all-pass checklist. A valid solid is not proof of mouldability, curvature continuity, electrical correctness, or clinical performance.

## Dimensional agreement and divergence list (§10.9)

| Feature | Specified baseline | This model | Explanation / disposition |
|---|---:|---:|---|
| Optical centre | X 0, Y −8.0 | X 0, Y −8.0 | Fixed to supplied datum coordinates. |
| Electrode spacing | 28.0 | 28.0 | Centres assigned to X ±14, Y 0; orientation of datum B was not supplied. |
| Skin curvature | R42 | R42 generating surface, spline approximation | Central surface follows the cylindrical equation; fit/join proof remains open. |
| MAX30102 complete outline | 5.6 × 3.3 × 1.55 | 5.6 × 3.3 × 1.55 | Housing, lands, dies and cover are separate; the local long direction is Y. |
| MAX30102 die pitch | “Correct pitch” | Assumed LED centres X ±0.32, Y −9.6; PD centre X 0, Y −6.4 | Exact die-placement drawing was not obtained. This is a modelling assumption, not a manufacturer dimension. |
| MAX30102 sensitive area | Datasheet | 1.38 × 0.98 | Package outline and sensitive-area dimensions are source-backed; die location is not. |
| XIAO PCB substrate | 21.0 × 17.5 nominal | Vendor board about 20.955 × 17.780 | The vendor geometry is retained at its native scale. It was not resized to hide disagreement. |
| XIAO complete vendor model | 21.0 × 17.5 × 3.5 | 22.482 × 17.780 × 4.460 | Includes protruding USB geometry and underside extents. This differs from the prompt and is not attributed to moulding. |
| Sense-specific parts | Same as engineering model | LSM6DS3TR-C 2.5 × 3.0 × 0.83; mic placement assumed | The downloaded STEP is the base-module v15 model, despite the Sense resource link. Sense placement needs the correct vendor revision. |
| Opaque web | ≥1.6 | 1.600002 minimum, 2° taper | Base width enlarged to 1.68032 so draft does not reduce the tip below 1.6. |
| Window crown | 0.3 proud; R60 | 0.3 proud; R60 spherical crown | Clear inserts are separate from the carrier. The complete internal optical bond is not modelled. |
| Shell footprint | Not supplied | 42 × 64 | Assigned for this layout; no prototype comparison is possible. |
| Shell centre height | Not supplied | 14.6 above the central skin datum | This is centre height, not the Z extent of the curved envelope. No 1.5–2 mm reduction is claimed. |
| Printed prototype thickness | Not supplied | Unknown | Cannot state a thickness difference or manufacturing reduction honestly. |
| Rigid / flex / mask | 0.8 / 0.15 / 0.025 | 0.8 / 0.15 / 0.025 | Nominal geometry; fabrication tolerances are not specified. |
| Flex bend | R≥3.0 | R3.3 centreline; R3.225 inner face | Arches above the rigid island; no bend change during the explode. |
| Battery active pouch | 20 × 30 × 3.5, R44 | 20 × 30 × 3.5, R44 | Parametric custom-cell intent; flange extends to about 22 × 32. No supplier drawing or swell allowance. |
| Perimeter blend | R1.2 at ends to R2.8 at mid-span | Fitted spline profile | The specified variable-radius law is not constructed or certified; no manufacturing justification is claimed. |
| Antenna clearance | Exact 5 mm offset | Provisional Ø13.6 × 11 envelope | Not an exact offset; location/antenna identity needs the correct source data. Fails clearance. |
| Logo engraving | Newly supplied raster | 11.5 × 6.684 nominal; 0.25 deep, centre X 0 / Y 5.4 | Added shell feature per user request; fitted from 81 × 42 px reference, nominal 3° cut-wall draft. |
| Explode offsets | 0.22× each part’s longest dimension | Cumulative Z lifts by subassembly | Preserves soldered/bonded groups; does not satisfy a literal independent offset for every body. |

No further differences from the unseen engineering model can be enumerated. Any assertion that this list is a complete as-built comparison would be unsupported.

## Fidelity and process exceptions

- **Electrical architecture:** copper pours, four layers, I²C routes, vias and a guard ring are real 3D bodies, but their connectivity, widths, return paths, isolation and guard drive are illustrative. They are not imported from a MindMap netlist and must not be presented as verified ECAD. SDA and SCL are single-ended I²C signals; visually paired routing does not make them a differential pair.
- **Parts source:** Seeed's STEP supplies 84 source bodies. The model retains generic vendor-body identifiers when their component identity is not established. Individual QSPI/MCU/antenna identities and complete Sense placement have not been reconstructed to datasheet certainty. Passive values, exact MPNs, placements, battery supplier, pogo spring rate and LED/light-guide coupling are unresolved.
- **Optics:** the two emitter-to-detector cone intersections above Z = −0.3 are zero in the simplified geometry. Red and IR emission envelopes overlap each other, which is not itself detector crosstalk but violates the prompt's literal all-cones condition. The cones are not refracted through the glass/PC interfaces and do not model scattering, reflections, skin motion or leakage along the sensor's common cover glass. The full index-matched bond stack and no-air-gap requirement are not fulfilled.
- **Tooling:** the principal loft is a fitted B-spline solid. Complete draft analysis, G2 boundary proof, a mould opening study, realistic gates/ejector layout, shrinkage, tool venting and process simulation remain open. The gate and ejector witnesses are candidate geometry, not a moulder-approved arrangement. Not every requested witness or draft condition is represented.
- **Welding and overmoulding:** the energy director is shown in its pre-weld triangular form, including in closed configuration. Weld collapse is not simulated. Bonded TPE/LSR elements are grouped with their host parts; the CAD bodies remain separately identifiable for material assignment. The opaque rib is a separate identifiable body representing an intended moulded-in feature, not a tool-ready union.
- **Door and vents:** PP door/web/lands are represented as an insert assembly. Bonding and retention to PC/ABS need resolution. The acoustic bore, membrane and mesh are present, but its external-wall connection/tooling remains incomplete. The pressure port and ePTFE disc are represented; pressure response, sealing and environmental durability are untested.
- **Thermal stack:** skin pad, 0.1 mm epoxy and insulation pocket are separate bodies. The NTC's thermal transfer, precise interface contacts and response time are not demonstrated.
- **Materials:** requested roughness, nominal IOR and transmission are stored and used where supported by the RGB renderer. MT-11010 certification, Abbe-dependent spectral dispersion, full subsurface models, metal anisotropy and wavelength-dependent optical data are not validated. Fine bump texture is an appearance approximation, not tool texture geometry.
- **Rendering:** nine 3840 × 2160 stills (the seven configurations plus optical and logo details) are 16-bit PNG with half-float linear EXR partners. Path tracing uses 128 samples/pixel and Open Image Denoise. EXRs contain linear, denoised RGB with annotation. There is no reflective floor or gradient/sky background. Lighting approximates the requested studio arrangement; it is not a photometrically calibrated 4000 K setup.
- **Animation:** 12 seconds at 60 fps, 1280 × 720, H.264, with 720 encoded frames. It uses path-traced model geometry and easing. The changed logo region is ray-traced from the current CAD at the original cameras; unchanged neutral-frame pixels are retained with an eight-pixel seam blend outside the altered feature. The source also supports complete frame rendering. The final segment reassembles, sweeps the longitudinal section, and restores the closed frame to make the loop continuous. Moving cuts clip tessellated surfaces without caps; the two fixed section stills and saved USD states use capped CAD Boolean cuts. The animation is not 4K.
- **Annotation coverage:** seven separate annotation layers and an optical-detail layer identify selected major bodies. The complete body/BOM registry is searchable in the inspector. Individual leaders to every electronic and process feature are not supplied.
- **Viewer:** the browser file is self-contained and includes embedded geometry, controls, seven states and BOM inspection. Its bundle and data structure are checked. Live browser testing was blocked by this environment's local-URL policy, so phone/browser compatibility is not certified.

## Evidence and sources

- [Analog Devices MAX30102 datasheet](https://www.analog.com/media/en/technical-documentation/data-sheets/max30102.pdf): package outline, interface type and photodiode sensitive area.
- [Seeed XIAO nRF52840 documentation](https://wiki.seeedstudio.com/XIAO_BLE/): resources and hardware revision context.
- [Seeed vendor 3D archive](https://files.seeedstudio.com/wiki/XIAO-BLE/seeed-studio-xiao-nrf52840-3d-model.zip): source `XIAO-nRF52840 v15.step`, 84 source bodies; the archive does not establish a complete Sense-specific model.
- [Seeed PCB design archive](https://files.seeedstudio.com/wiki/XIAO-BLE/Seeed-Studio-XIAO-nRF52840V1.1-KiCad-Project-260105.zip): retrieved reference, not a MindMap carrier layout.
- [Texas Instruments OPA333/OPA2333 datasheet](https://www.ti.com/lit/ds/symlink/opa333.pdf): DGK VSSOP outline and formed-lead span.
- `model/geometric-audit.json`: CAD-kernel validity, cone intersections, antenna intersections, dimensions and flex radius.
- `model/MindMap.scene.json`: authoritative body names, assigned materials, configuration cameras and staged translations.

The missing engineering CAD, approved BOM/netlist, correct Sense mechanical revision, optical stack drawings and tool-release evidence are needed to close the remaining requirements. This package must not be used to imply that a working medical device or verified measurement system exists.
