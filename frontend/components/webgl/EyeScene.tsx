"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type EyeSceneProps = {
  action: null | "yes" | "no";
};

export default function EyeScene({ action }: EyeSceneProps) {
  return (
    <>
      <color attach="background" args={["#05050A"]} />
      <CyberEye action={action} />
    </>
  );
}

/* ==========================================================================
   ANATOMICAL CONSTANTS
   ========================================================================== */
const PI2          = Math.PI * 2;
const PUPIL_R      = 0.24;   // absolute pupil void radius
const IRIS_R       = 0.70;   // iris / sclera boundary
const EYE_W        = 1.30;   // almond half-width  (horizontal)
const EYE_H_TOP    = 0.50;   // almond half-height (upper eyelid – arched)
const EYE_H_BOT    = 0.36;   // almond half-height (lower eyelid – flatter)
const NUM_FIBERS   = 90;     // radial iris fiber strands
const RING_FREQ    = 14;     // concentric collarette ring count in iris

/* ==========================================================================
   COLOR PALETTE — cyan → aqua → deep blue
   ========================================================================== */
const C_CYAN  = new THREE.Color("#00FFFF");
const C_AQUA  = new THREE.Color("#00AAFF");
const C_BLUE  = new THREE.Color("#0055FF");
const C_ICE   = new THREE.Color("#CCFFFF"); // near-white accent

/** Maps normalised iris radius (0=inner, 1=outer) to a color. */
function irisColor(nR: number): THREE.Color {
  if (nR < 0.5) return C_CYAN.clone().lerp(C_AQUA, nR * 2.0);
  return C_AQUA.clone().lerp(C_BLUE, (nR - 0.5) * 2.0);
}

/**
 * Parametric almond eye-outline.
 * Upper eyelid is more arched; lower is flatter.
 * A subtle cos² pinch keeps the corners sharp.
 */
function almondXY(t: number): [number, number] {
  const cosT = Math.cos(t);
  const sinT = Math.sin(t);
  const pinch = 1.0 - 0.10 * cosT * cosT;          // slight corner pinch
  const h     = sinT > 0 ? EYE_H_TOP : EYE_H_BOT;
  return [EYE_W * cosT * pinch, h * sinT];
}

/* ==========================================================================
   CYBER EYE — visual rendering + all preserved interaction logic
   ========================================================================== */
function CyberEye({ action }: { action: EyeSceneProps["action"] }) {
  const groupRef = useRef<THREE.Group>(null);

  const { camera } = useThree();
  const mouse       = useRef(new THREE.Vector2(0, 0));
  const target      = useRef(new THREE.Vector2(0, 0));
  const cameraStart = useRef(new THREE.Vector3(0, 0, 4.5));
  const blinkRef    = useRef({ value: 0, nextBlink: 3 });
  const cameraZRef  = useRef(4.5);

  /* -------------------------------------------------------------------------
     EYE STRUCTURE — static positions baked into buffers at mount time.
     Two conceptual layers live inside a single Points object:
       A. Iris fill: dense random scatter modulated by fiber & ring patterns.
       B. Radial fibers: explicit strand particles for the fibrous iris texture.
       C. Limbal ring: bright boundary where iris meets the (dark) sclera.
       D. Pupil edge: vivid cyan ring just outside the void.
       E. Almond boundary: defines the eyelid outline (the actual eye shape).
       F. Eyelid depth: 2 inner-scaled echoes of the almond for volume.
       G. Sclera scatter: very faint particles between iris and almond.
     ----------------------------------------------------------------------- */
  const eyeData = useMemo(() => {
    /* accumulator arrays */
    const px: number[] = [], py: number[] = [], pz: number[] = [];
    const cr: number[] = [], cg: number[] = [], cb: number[] = [];
    const alpha: number[] = [];
    const seed:  number[] = [];  // per-particle shimmer phase
    const size:  number[] = [];  // CSS-pixel base size

    const push = (
      x: number, y: number, z: number,
      c: THREE.Color, a: number, sz: number
    ) => {
      px.push(x); py.push(y); pz.push(z);
      cr.push(c.r); cg.push(c.g); cb.push(c.b);
      alpha.push(a);
      seed.push(Math.random() * PI2);
      size.push(sz);
    };

    /* ------------------------------------------------------------------
       A. IRIS RADIAL FIBERS
       90 strands × 30 particles each = 2 700 particles.
       Every 3rd strand is bright, creating the alternating-density
       look of real iris crypts.
       ------------------------------------------------------------------ */
    const PER_FIBER = 30;
    for (let f = 0; f < NUM_FIBERS; f++) {
      const fAngle  = (PI2 * f) / NUM_FIBERS;
      const bright  = f % 3 === 0 ? 1.0 : f % 3 === 1 ? 0.55 : 0.25;

      for (let p = 0; p < PER_FIBER; p++) {
        const t   = p / (PER_FIBER - 1);
        const r   = PUPIL_R + t * (IRIS_R - PUPIL_R);
        const jit = (Math.random() - 0.5) * 0.022; // slight angular jitter
        const a   = fAngle + jit;
        const nR  = t;                              // 0=near pupil, 1=iris edge
        const col = irisColor(nR);
        const fa  = bright * (0.20 + 0.40 * (1.0 - nR)); // brighter near centre
        push(
          r * Math.cos(a),
          r * Math.sin(a),
          (Math.random() - 0.5) * 0.025,
          col, fa, 0.85
        );
      }
    }

    /* ------------------------------------------------------------------
       B. IRIS DENSE FILL
       5 500 random particles in the iris annulus.
       Alpha modulated by fiber alignment and concentric ring position,
       producing the characteristic iris texture.
       ------------------------------------------------------------------ */
    const FILL = 5500;
    for (let i = 0; i < FILL; i++) {
      // Uniform-area sampling: sqrt gives even density over disk area
      const r     = PUPIL_R + Math.sqrt(Math.random()) * (IRIS_R - PUPIL_R);
      const angle = Math.random() * PI2;
      const nR    = (r - PUPIL_R) / (IRIS_R - PUPIL_R);

      // Fiber alignment: how close is this particle to a fiber angle?
      const fiberId   = (angle / PI2) * NUM_FIBERS;
      const fiberFrac = Math.abs(fiberId - Math.round(fiberId)); // 0=on fiber
      const fiberMod  = Math.pow(Math.max(0.0, 1.0 - fiberFrac * 3.2), 2.8);

      // Concentric ring modulation (collarette zones)
      const ringMod = Math.pow(Math.max(0.0, Math.sin(nR * Math.PI * RING_FREQ)), 2.0);

      const ba  = 0.03 + fiberMod * 0.22 + ringMod * 0.10;
      const col = irisColor(nR);
      push(
        r * Math.cos(angle),
        r * Math.sin(angle),
        (Math.random() - 0.5) * 0.028,
        col, ba, 0.65
      );
    }

    /* ------------------------------------------------------------------
       C. LIMBAL RING — bright concentric band at the iris edge
       This is the most visually prominent ring of a real eye.
       ------------------------------------------------------------------ */
    for (let i = 0; i < 550; i++) {
      const angle = Math.random() * PI2;
      const r     = IRIS_R - 0.04 + Math.random() * 0.055;
      push(
        r * Math.cos(angle),
        r * Math.sin(angle),
        0.012 + Math.random() * 0.008,
        C_CYAN, 0.55 + Math.random() * 0.35, 1.10
      );
    }

    /* ------------------------------------------------------------------
       D. PUPIL EDGE RING — sharp bright ring right at the void boundary
       ------------------------------------------------------------------ */
    const PUPIL_PTS = 440;
    for (let i = 0; i < PUPIL_PTS; i++) {
      const angle = (PI2 * i) / PUPIL_PTS;
      const r     = PUPIL_R + Math.random() * 0.022;
      push(
        r * Math.cos(angle),
        r * Math.sin(angle),
        0.018,
        C_ICE.clone().lerp(C_CYAN, 0.6),
        0.80 + Math.random() * 0.18,
        1.30
      );
    }

    /* ------------------------------------------------------------------
       E. ALMOND BOUNDARY — dense eyelid outline defining the eye shape
       1 100 evenly spaced particles along the parametric almond curve.
       ------------------------------------------------------------------ */
    const ALMOND_PTS = 1100;
    for (let i = 0; i < ALMOND_PTS; i++) {
      const t  = (i / ALMOND_PTS) * PI2;
      const [x, y] = almondXY(t);
      // Corners (t≈0 or π) get extra brightness — they're the most visible
      const corner = Math.abs(Math.cos(t));
      const a  = 0.50 + corner * 0.42;
      const c  = C_CYAN.clone().lerp(C_ICE, corner * 0.45);
      push(x, y, 0.040 + Math.random() * 0.012, c, a, 1.0 + corner * 0.35);
    }

    /* ------------------------------------------------------------------
       F. EYELID THICKNESS — two inner concentric almond echoes
       Gives the boundary visual depth and softness.
       ------------------------------------------------------------------ */
    for (let layer = 1; layer <= 2; layer++) {
      const scale  = 1.0 - layer * 0.055;
      const aBase  = 0.30 - layer * 0.09;
      const STEPS  = 420;
      for (let i = 0; i < STEPS; i++) {
        const t  = (i / STEPS) * PI2;
        const [bx, by] = almondXY(t);
        push(
          bx * scale,
          by * scale,
          0.038 - layer * 0.01,
          C_BLUE, aBase * (0.5 + Math.random() * 0.5), 0.75
        );
      }
    }

    /* ------------------------------------------------------------------
       G. SCLERA SCATTER — extremely faint between iris and almond
       ------------------------------------------------------------------ */
    for (let i = 0; i < 320; i++) {
      const angle = Math.random() * PI2;
      const cosA  = Math.cos(angle);
      const sinA  = Math.sin(angle);
      const h     = sinA > 0 ? EYE_H_TOP : EYE_H_BOT;
      // Maximum r at this angle (ellipse boundary)
      const maxR  = 1.0 / Math.sqrt(
        (cosA * cosA) / (EYE_W * EYE_W) + (sinA * sinA) / (h * h)
      );
      const span = Math.max(0, maxR * 0.92 - IRIS_R);
      if (span < 0.01) continue;
      const r = IRIS_R + Math.random() * span;
      push(
        r * cosA, r * sinA,
        0.005 + Math.random() * 0.01,
        C_BLUE.clone().lerp(C_AQUA, 0.25),
        0.025 + Math.random() * 0.04, 0.65
      );
    }

    /* ---- Pack into typed arrays ---- */
    const N = px.length;
    const positions  = new Float32Array(N * 3);
    const aColorBuf  = new Float32Array(N * 3);
    const aAlphaBuf  = new Float32Array(alpha);
    const aSeedBuf   = new Float32Array(seed);
    const aSizeBuf   = new Float32Array(size);

    for (let i = 0; i < N; i++) {
      positions[i * 3]     = px[i];
      positions[i * 3 + 1] = py[i];
      positions[i * 3 + 2] = pz[i];
      aColorBuf[i * 3]     = cr[i];
      aColorBuf[i * 3 + 1] = cg[i];
      aColorBuf[i * 3 + 2] = cb[i];
    }

    return { N, positions, aColor: aColorBuf, aAlpha: aAlphaBuf, aSeed: aSeedBuf, aSize: aSizeBuf };
  }, []);

  /* -------------------------------------------------------------------------
     ROTATING APERTURE RINGS — simulates the mechanical iris of a camera lens.
     Positions computed in vertex shader so rings spin independently.
     Three segmented (cog-wheel) rings at different radii and speeds.
     ----------------------------------------------------------------------- */
  const ringData = useMemo(() => {
    const angles:    number[] = [];
    const radii:     number[] = [];
    const rotSpeeds: number[] = [];
    const cr: number[] = [], cg: number[] = [], cb: number[] = [];
    const alphas:    number[] = [];
    const sizes:     number[] = [];

    const push = (
      a: number, r: number, rs: number,
      c: THREE.Color, ba: number, sz: number
    ) => {
      angles.push(a); radii.push(r); rotSpeeds.push(rs);
      cr.push(c.r); cg.push(c.g); cb.push(c.b);
      alphas.push(ba); sizes.push(sz);
    };

    // [radius, rotSpeed rad/s, numSegments, ptsPerSeg, color, alpha, size]
    const configs: [number, number, number, number, THREE.Color, number, number][] = [
      [0.29, +1.55, 6, 22, C_CYAN,  0.88, 1.7],
      [0.40, -1.00, 8, 18, C_AQUA,  0.68, 1.4],
      [0.53, +0.65, 8, 16, C_BLUE,  0.52, 1.2],
    ];

    configs.forEach(([r, rs, segs, pps, col, ba, sz]) => {
      const gapFrac = 0.60; // each segment spans 60% of its sector
      for (let seg = 0; seg < segs; seg++) {
        const segStart = (PI2 * seg) / segs;
        const segSpan  = (PI2 / segs) * gapFrac;
        for (let p = 0; p < pps; p++) {
          push(segStart + (segSpan * p) / pps, r, rs, col, ba, sz);
        }
        // Bright node at segment boundary (LED pad)
        push(segStart, r, rs, C_ICE, 1.0, sz * 2.8);
      }
    });

    const N = angles.length;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      positions[i * 3]     = radii[i] * Math.cos(angles[i]);
      positions[i * 3 + 1] = radii[i] * Math.sin(angles[i]);
      positions[i * 3 + 2] = 0.03;
    }
    const aColor = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      aColor[i * 3] = cr[i]; aColor[i * 3 + 1] = cg[i]; aColor[i * 3 + 2] = cb[i];
    }
    return {
      N,
      positions,
      aAngle:    new Float32Array(angles),
      aRadius:   new Float32Array(radii),
      aRotSpeed: new Float32Array(rotSpeeds),
      aColor,
      aAlpha:    new Float32Array(alphas),
      aSize:     new Float32Array(sizes),
    };
  }, []);

  /* ---- Shared uniforms ---- */
  const uniforms = useMemo(
    () => ({
      uTime:       { value: 0 },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
    }),
    []
  );

  /* ---- Mouse tracking (PRESERVED EXACTLY) ---- */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  /* ---- Per-frame: all interaction logic preserved verbatim ---- */
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    uniforms.uTime.value = t;

    /* Mouse tracking (PRESERVED EXACTLY) */
    target.current.lerp(mouse.current, 0.08);
    if (groupRef.current) {
      groupRef.current.rotation.y = target.current.x * 0.12;
      groupRef.current.rotation.x = -target.current.y * 0.08;
    }

    /* Blink timer (PRESERVED EXACTLY) */
    blinkRef.current.nextBlink -= delta;
    if (blinkRef.current.nextBlink <= 0) {
      blinkRef.current.value     = 1;
      blinkRef.current.nextBlink = 3 + Math.random() * 4;
    }
    blinkRef.current.value = THREE.MathUtils.damp(blinkRef.current.value, 0, 8, delta);

    /* Action overrides (PRESERVED EXACTLY) */
    let lidTarget = blinkRef.current.value;
    if (action === "no") lidTarget = 1.0;
    if (groupRef.current) {
      groupRef.current.scale.y = THREE.MathUtils.lerp(1.0, 0.0, lidTarget);
    }

    /* Camera dive / yes (PRESERVED EXACTLY) */
    if (action === "yes") {
      cameraZRef.current = THREE.MathUtils.damp(cameraZRef.current, -2, 1.2, delta);
      camera.position.z  = cameraZRef.current;
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.copy(cameraStart.current);
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <CyberGlowBackdrop uniforms={uniforms} />

      <group ref={groupRef}>

        {/* ── Static eye anatomy ── */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position"  args={[eyeData.positions, 3]} count={eyeData.N} />
            <bufferAttribute attach="attributes-aColor"    args={[eyeData.aColor,    3]} count={eyeData.N} />
            <bufferAttribute attach="attributes-aAlpha"    args={[eyeData.aAlpha,    1]} count={eyeData.N} />
            <bufferAttribute attach="attributes-aSeed"     args={[eyeData.aSeed,     1]} count={eyeData.N} />
            <bufferAttribute attach="attributes-aSize"     args={[eyeData.aSize,     1]} count={eyeData.N} />
          </bufferGeometry>
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={eyeVert}
            fragmentShader={sharedFrag}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* ── Rotating aperture rings ── */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position"  args={[ringData.positions, 3]} count={ringData.N} />
            <bufferAttribute attach="attributes-aAngle"    args={[ringData.aAngle,    1]} count={ringData.N} />
            <bufferAttribute attach="attributes-aRadius"   args={[ringData.aRadius,   1]} count={ringData.N} />
            <bufferAttribute attach="attributes-aRotSpeed" args={[ringData.aRotSpeed, 1]} count={ringData.N} />
            <bufferAttribute attach="attributes-aColor"    args={[ringData.aColor,    3]} count={ringData.N} />
            <bufferAttribute attach="attributes-aAlpha"    args={[ringData.aAlpha,    1]} count={ringData.N} />
            <bufferAttribute attach="attributes-aSize"     args={[ringData.aSize,     1]} count={ringData.N} />
          </bufferGeometry>
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={ringVert}
            fragmentShader={sharedFrag}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>

      </group>
    </>
  );
}

/* ==========================================================================
   GLOW BACKDROP — deep cyan elliptical pulse behind the eye
   ========================================================================== */
function CyberGlowBackdrop({
  uniforms,
}: {
  uniforms: { uTime: { value: number }; uPixelRatio: { value: number } };
}) {
  const { viewport } = useThree();
  return (
    <mesh position={[0, 0, -2.5]}>
      <planeGeometry args={[viewport.width * 2.5, viewport.height * 2.5]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={glowVert}
        fragmentShader={glowFrag}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* ==========================================================================
   SHADERS
   ========================================================================== */

/* --------------------------------------------------------------------------
   Static eye structure vertex shader.
   Positions are pre-baked; only alpha is animated (shimmer).
   Size attenuation lets particles grow dramatically during the "yes" dive.
   -------------------------------------------------------------------------- */
const eyeVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute vec3  aColor;
  attribute float aAlpha;
  attribute float aSeed;   /* random phase per particle for individual shimmer */
  attribute float aSize;   /* CSS-pixel base size                              */

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    float dist   = max(-mvPos.z, 0.01);

    /* Size attenuation: particles scale up as camera dives (yes action) */
    gl_PointSize = aSize * uPixelRatio * (4.5 / dist);

    gl_Position = projectionMatrix * mvPos;

    /* Gentle per-particle shimmer */
    float shimmer = 0.86 + 0.14 * sin(uTime * 2.6 + aSeed);
    vColor = aColor;
    vAlpha = aAlpha * shimmer;
  }
`;

/* --------------------------------------------------------------------------
   Rotating aperture ring vertex shader.
   Position is computed on the GPU each frame from (angle+rotSpeed*t, radius)
   so each ring spins independently at zero CPU cost.
   A scanner sweep brightens particles as it passes, like a laser-alignment beam.
   -------------------------------------------------------------------------- */
const ringVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute float aAngle;
  attribute float aRadius;
  attribute float aRotSpeed;
  attribute vec3  aColor;
  attribute float aAlpha;
  attribute float aSize;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float angle = aAngle + aRotSpeed * uTime;

    vec3 pos = vec3(aRadius * cos(angle), aRadius * sin(angle), 0.03);
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float dist = max(-mvPos.z, 0.01);

    gl_PointSize = aSize * uPixelRatio * (4.5 / dist);
    gl_Position  = projectionMatrix * mvPos;

    /* Dual scanner sweeps — active processor look */
    float sweep1  = mod(uTime * 2.2, 6.28318);
    float sweep2  = mod(-uTime * 1.0 + 3.14159, 6.28318);
    float diff1   = abs(mod(angle - sweep1 + 3.14159, 6.28318) - 3.14159);
    float diff2   = abs(mod(angle - sweep2 + 3.14159, 6.28318) - 3.14159);
    float scan    = max(smoothstep(0.18, 0.0, diff1) * 0.70,
                        smoothstep(0.25, 0.0, diff2) * 0.35);

    vColor = aColor;
    vAlpha = min(1.0, aAlpha + scan);
  }
`;

/* --------------------------------------------------------------------------
   Shared fragment shader — both Points objects use this.
   Discard outside radius=0.5 so every sprite is a crisp, perfect circle.
   Hard core + near-zero halo = sharp fine-dust look, not a blob.
   -------------------------------------------------------------------------- */
const sharedFrag = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    /* Perfect circle — discard the square corners */
    vec2  coord = gl_PointCoord - 0.5;
    float d     = length(coord);
    if (d > 0.5) discard;

    /* Hard-edged core, razor-thin softening at boundary */
    float core  = smoothstep(0.5, 0.04, d);
    float alpha = core * vAlpha;

    /* White boost at the exact centre for the lit-LED look */
    vec3  col   = vColor + vec3(1.0) * pow(core, 5.0) * 0.50;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* --------------------------------------------------------------------------
   Backdrop glow — deep elliptical cyan wash behind the eye
   -------------------------------------------------------------------------- */
const glowVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFrag = /* glsl */ `
  uniform float uTime;
  varying vec2  vUv;

  void main() {
    vec2  uv    = vUv - 0.5;
    /* Almond-shaped glow: slightly wider than tall to match the eye */
    float d     = length(uv * vec2(0.95, 1.40));
    float pulse = 0.50 + 0.50 * sin(uTime * 0.50);
    float glow  = smoothstep(0.44, 0.0, d) * 0.28 * pulse;

    vec3 inner  = vec3(0.00, 0.60, 1.00);   /* bright aqua at centre */
    vec3 outer  = vec3(0.00, 0.03, 0.10);   /* near black at edge    */
    gl_FragColor = vec4(mix(outer, inner, glow), glow);
  }
`;
