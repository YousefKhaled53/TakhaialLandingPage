"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Global WebGL background: nebulas + layered starfield with mouse parallax.
 * Rendered fixed behind all content.
 */
export default function SpaceBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={["#05050A"]} />
        <Nebula />
        <StarLayer count={400} radius={8}  size={0.015} color="#8a8aff" depth={-2} />
        <StarLayer count={600} radius={12} size={0.022} color="#ffffff" depth={-4} />
        <StarLayer count={400} radius={16} size={0.03}  color="#b49bff" depth={-6} />
      </Canvas>
      {/* Gentle vignette to tie starfield into UI */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,10,0.6)_70%,rgba(5,5,10,0.95)_100%)]" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Nebula plane — smooth procedural clouds                                    */
/* -------------------------------------------------------------------------- */
function Nebula() {
  const ref = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color("#120a2e") },
      uColorB: { value: new THREE.Color("#3a1a66") },
      uColorC: { value: new THREE.Color("#6B4CE6") },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      uniforms.uMouse.value.x = (e.clientX / window.innerWidth) * 2 - 1;
      uniforms.uMouse.value.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [uniforms]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh ref={ref} position={[0, 0, -8]}>
      <planeGeometry args={[40, 28]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={nebulaVert}
        fragmentShader={nebulaFrag}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* -------------------------------------------------------------------------- */
/* Parallax star layer                                                         */
/* -------------------------------------------------------------------------- */
function StarLayer({
  count,
  radius,
  size,
  color,
  depth,
}: {
  count: number;
  radius: number;
  size: number;
  color: string;
  depth: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const parallax = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = radius * (0.3 + Math.random() * 0.7);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = depth + (Math.random() - 0.5) * 1.5;
    }
    return pos;
  }, [count, radius, depth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      parallax.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      parallax.current.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, delta) => {
    const p = parallax.current;
    // ease towards target (opposite of mouse for parallax)
    p.x = THREE.MathUtils.damp(p.x, -p.tx, 2.5, delta);
    p.y = THREE.MathUtils.damp(p.y, -p.ty, 2.5, delta);

    // layers farther back shift less
    const factor = 1 + Math.abs(depth) * 0.03;
    if (ref.current) {
      ref.current.position.x = p.x * 0.6 * factor;
      ref.current.position.y = p.y * 0.4 * factor;
      ref.current.rotation.z += delta * 0.005;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* -------------------------------------------------------------------------- */
/* Nebula shaders                                                              */
/* -------------------------------------------------------------------------- */
const nebulaVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;
  uniform vec2  uMouse;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 47583.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= 1.4;
    uv += uMouse * 0.05;

    float n = fbm(uv * 1.6 + vec2(uTime * 0.015, uTime * 0.01));
    float n2 = fbm(uv * 3.0 - vec2(uTime * 0.02, 0.0));

    vec3 col = mix(uColorA, uColorB, n);
    col = mix(col, uColorC * 0.6, pow(n2, 3.0));

    float vignette = smoothstep(1.3, 0.2, length(uv));
    col *= vignette * 0.7;

    gl_FragColor = vec4(col, 1.0);
  }
`;
