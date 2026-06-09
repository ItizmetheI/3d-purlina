import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, Environment, Float } from "@react-three/drei";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FluidSceneHandle {
  setScene: (scene: number, progress: number) => void;
}

// ─── Scene configs — MATRIX CORE: cold, electric, deep navy world ─────────────
// The fluid is crystal-clear dielectric — think: submerged GPU hardware, blue light
const SCENES = [
  // 0: Hero — dark world, small centered crystal orb
  { blobX: 0,    blobY: 0,   blobScale: 1.1,  blobColor: "#b8d4f8", envIntensity: 1.4, transmission: 0.98, thickness: 2.5, ior: 1.33, chrAb: 0.03, bgColor: "#020812" },
  // 1: Problem — blob left, grows, world slightly brighter
  { blobX: -3.2, blobY: 0.3, blobScale: 1.45, blobColor: "#93c5fd", envIntensity: 1.8, transmission: 0.96, thickness: 3.5, ior: 1.36, chrAb: 0.05, bgColor: "#020d1a" },
  // 2: Matrix Core — blob right, large, deep blue tint
  { blobX: 3.2,  blobY: 0,   blobScale: 1.85, blobColor: "#60a5fa", envIntensity: 2.2, transmission: 0.93, thickness: 4.5, ior: 1.40, chrAb: 0.07, bgColor: "#030f1e" },
  // 3: X Series — blob left, vivid electric blue
  { blobX: -3.0, blobY: 0,   blobScale: 2.1,  blobColor: "#3b82f6", envIntensity: 2.8, transmission: 0.90, thickness: 5.5, ior: 1.44, chrAb: 0.09, bgColor: "#021120" },
  // 4: Proof — blob right, deep blue
  { blobX: 3.0,  blobY: 0,   blobScale: 1.6,  blobColor: "#2563eb", envIntensity: 2.4, transmission: 0.92, thickness: 4.0, ior: 1.42, chrAb: 0.08, bgColor: "#020e1c" },
  // 5: CTA — blob expands to fill, camera engulf
  { blobX: 0,    blobY: 0,   blobScale: 9.0,  blobColor: "#1d4ed8", envIntensity: 3.5, transmission: 0.85, thickness: 8.0, ior: 1.50, chrAb: 0.12, bgColor: "#010810" },
];

// ─── Particle Field — electric blue motes rising like heat shimmer ─────────────
function ParticleField({ scene }: { scene: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);
  const count   = 220;

  const pts = useMemo(() => Array.from({ length: count }, () => ({
    x:  (Math.random() - 0.5) * 55,
    y:  (Math.random() - 0.5) * 55,
    z:  (Math.random() - 0.5) * 40,
    vy: 0.004 + Math.random() * 0.009,
    s:  0.007 + Math.random() * 0.018,
    ph: Math.random() * Math.PI * 2,
  })), []);

  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (!meshRef.current || !matRef.current) return;
    const t  = state.clock.getElapsedTime();
    const sc = scene.current;

    // Electric blue particles, brighter in mid scenes
    const targetOpacity = sc <= 1 ? 0.10 : sc <= 4 ? 0.20 : 0.06;
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOpacity, 0.04);

    // Tint shifts from soft blue → vivid electric as scenes progress
    const r = THREE.MathUtils.lerp(0.37, 0.11, Math.min(sc / 5, 1));
    const g = THREE.MathUtils.lerp(0.71, 0.40, Math.min(sc / 5, 1));
    const b = 1.0;
    matRef.current.color.setRGB(r, g, b);

    pts.forEach((p, i) => {
      p.y += p.vy * (1 + sc * 0.12);
      if (p.y > 27.5) p.y -= 55;
      dummy.position.set(
        p.x + Math.sin(t * 0.28 + p.ph) * 0.25,
        p.y,
        p.z + Math.cos(t * 0.28 + p.ph) * 0.25
      );
      const stretch = 1 + Math.abs(Math.sin(t + p.ph)) * 0.4;
      dummy.scale.set(p.s, p.s * stretch, p.s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial ref={matRef} color="#93c5fd" transparent opacity={0.10} depthWrite={false} />
    </instancedMesh>
  );
}

// ─── Core Blob — crystal dielectric fluid ─────────────────────────────────────
function LiquidBlob({
  currentScene,
  sceneProgress,
}: {
  currentScene:  React.MutableRefObject<number>;
  sceneProgress: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef   = useRef<any>(null);

  const lerpColor = useRef(new THREE.Color(SCENES[0].blobColor));
  const prevVel   = useRef(0);
  const smoothPtr = useRef(new THREE.Vector2());
  const prevY     = useRef(window.scrollY);

  useFrame((state) => {
    if (!groupRef.current || !matRef.current) return;
    const t = state.clock.getElapsedTime();

    const cy = window.scrollY;
    prevVel.current = THREE.MathUtils.lerp(prevVel.current, (cy - prevY.current) * 0.002, 0.08);
    prevY.current   = cy;

    smoothPtr.current.lerp(state.pointer, 0.05);

    const sc   = Math.min(Math.floor(currentScene.current), SCENES.length - 2);
    const prog = sceneProgress.current;
    const ease = prog < 0.5 ? 2 * prog * prog : -1 + (4 - 2 * prog) * prog;

    const A = SCENES[sc];
    const B = SCENES[Math.min(sc + 1, SCENES.length - 1)];

    const tx = THREE.MathUtils.lerp(A.blobX, B.blobX, ease);
    const ty = THREE.MathUtils.lerp(A.blobY, B.blobY, ease);
    const ts = THREE.MathUtils.lerp(A.blobScale, B.blobScale, ease);

    lerpColor.current.lerpColors(
      new THREE.Color(A.blobColor),
      new THREE.Color(B.blobColor),
      ease
    );

    // Position — fluid, mouse-responsive
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      tx + smoothPtr.current.x * 1.6,
      0.055
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      ty + smoothPtr.current.y * 1.6,
      0.055
    );

    // Scale — velocity-based stretch for scroll momentum feel
    const velS = 1 + Math.abs(prevVel.current) * 0.65;
    groupRef.current.scale.set(
      THREE.MathUtils.lerp(groupRef.current.scale.x, ts,       0.07),
      THREE.MathUtils.lerp(groupRef.current.scale.y, ts * velS, 0.07),
      THREE.MathUtils.lerp(groupRef.current.scale.z, ts,       0.07)
    );

    // Slow, organic rotation — like liquid in zero-g
    groupRef.current.rotation.y = t * 0.08 + smoothPtr.current.x * 0.45 + sc * 0.35;
    groupRef.current.rotation.x = Math.sin(t * 0.16) * 0.15 + smoothPtr.current.y * -0.30;
    groupRef.current.rotation.z = Math.sin(t * 0.11) * 0.05;

    // Material properties
    const tIor       = THREE.MathUtils.lerp(A.ior,         B.ior,         ease);
    const tThick     = THREE.MathUtils.lerp(A.thickness,   B.thickness,   ease);
    const tTrans     = THREE.MathUtils.lerp(A.transmission, B.transmission, ease);
    const tChrAb     = THREE.MathUtils.lerp(A.chrAb,       B.chrAb,       ease);
    const velDistort = Math.min(Math.abs(prevVel.current) * 2.5, 0.55);

    matRef.current.color.copy(lerpColor.current);
    matRef.current.ior                 = tIor;
    matRef.current.thickness           = tThick;
    matRef.current.transmission        = tTrans;
    matRef.current.chromaticAberration = tChrAb;
    matRef.current.distortionScale     = THREE.MathUtils.lerp(
      matRef.current.distortionScale ?? 0.18,
      0.14 + velDistort + Math.sin(t * 0.55) * 0.04,
      0.06
    );
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.1} rotationIntensity={0.45} floatIntensity={0.55} floatingRange={[-0.07, 0.07]}>
        <mesh castShadow>
          <sphereGeometry args={[1.8, 64, 64]} />
          <MeshTransmissionMaterial
            ref={matRef}
            color={SCENES[0].blobColor}
            // Dark background makes the glass look cold and crystalline
            background={new THREE.Color("#020d1a")}
            transmission={0.98}
            thickness={2.5}
            roughness={0.0}
            ior={1.33}
            chromaticAberration={0.03}
            anisotropy={0.08}
            distortion={0.22}
            distortionScale={0.18}
            temporalDistortion={0.20}
            envMapIntensity={2.5}
            clearcoat={1.0}
            clearcoatRoughness={0.0}
            attenuationDistance={2.5}
            attenuationColor="#1e40af"
            resolution={512}
            samples={4}
          />
        </mesh>
      </Float>
    </group>
  );
}

// ─── Camera ───────────────────────────────────────────────────────────────────
function Camera({ currentScene }: { currentScene: React.MutableRefObject<number> }) {
  const { camera, mouse } = useThree();
  const targetZ = useRef(14);

  useFrame(() => {
    const sc = currentScene.current;
    // Push camera INTO the blob on final scene
    targetZ.current = sc >= 4.5
      ? THREE.MathUtils.lerp(targetZ.current, 4.5, 0.035)
      : THREE.MathUtils.lerp(targetZ.current, 14,  0.035);

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 1.4, 0.022);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.y * 1.4, 0.022);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ.current, 0.04);
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, -mouse.x * 0.03, 0.022);
  });
  return null;
}

// ─── World Background — stays deep dark, subtle blue shift per scene ──────────
function WorldBackground({ currentScene, sceneProgress }: {
  currentScene:  React.MutableRefObject<number>;
  sceneProgress: React.MutableRefObject<number>;
}) {
  const matRef  = useRef<THREE.MeshBasicMaterial>(null);
  const { viewport } = useThree();

  const bgColors = useMemo(() => SCENES.map(s => new THREE.Color(s.bgColor)), []);
  const lerpBg   = useRef(new THREE.Color(SCENES[0].bgColor));

  useFrame(() => {
    if (!matRef.current) return;
    const sc   = Math.min(Math.floor(currentScene.current), bgColors.length - 2);
    const prog = sceneProgress.current;
    const ease = prog < 0.5 ? 2 * prog * prog : -1 + (4 - 2 * prog) * prog;
    lerpBg.current.lerpColors(bgColors[sc], bgColors[Math.min(sc + 1, bgColors.length - 1)], ease);
    matRef.current.color.copy(lerpBg.current);
  });

  return (
    <mesh position={[0, 0, -20]}>
      <planeGeometry args={[viewport.width * 6, viewport.height * 6]} />
      <meshBasicMaterial ref={matRef} color={SCENES[0].bgColor} />
    </mesh>
  );
}

// ─── Subtle grid — data center floor aesthetic ────────────────────────────────
function DataGrid({ currentScene }: { currentScene: React.MutableRefObject<number> }) {
  const matRef  = useRef<THREE.LineBasicMaterial>(null);
  const lineRef = useRef<THREE.LineSegments>(null);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pts: number[] = [];
    const size = 40, step = 4;
    for (let i = -size; i <= size; i += step) {
      pts.push(i, -8, -15, i, -8, -15 + size);
      pts.push(-size / 2, -8, -15 + i / 2, size / 2, -8, -15 + i / 2);
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);

  useFrame(() => {
    if (!matRef.current) return;
    const sc = currentScene.current;
    const target = sc >= 1 && sc <= 4 ? 0.04 : 0.0;
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, target, 0.03);
  });

  return (
    <lineSegments ref={lineRef} geometry={geo}>
      <lineBasicMaterial ref={matRef} color="#2563eb" transparent opacity={0.0} depthWrite={false} />
    </lineSegments>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
const FluidScene = forwardRef<FluidSceneHandle, {
  currentScene:  React.MutableRefObject<number>;
  sceneProgress: React.MutableRefObject<number>;
}>(({ currentScene, sceneProgress }, ref) => {
  useImperativeHandle(ref, () => ({
    setScene: (scene: number, progress: number) => {
      currentScene.current  = scene;
      sceneProgress.current = progress;
    },
  }));

  return (
    <>
      <Camera currentScene={currentScene} />
      {/* Studio env gives clean reflections in the crystal */}
      <Environment preset="studio" />
      {/* Cool, blue-tinted lighting — data center feel */}
      <ambientLight intensity={0.5} color="#c7d9f8" />
      <directionalLight position={[10, 15, 10]} intensity={3.0} color="#ffffff" castShadow />
      <directionalLight position={[-8, -4, -8]}  intensity={1.8} color="#3b82f6" />
      <spotLight position={[0, 12, 8]} intensity={5} color="#ffffff" penumbra={0.9} angle={0.4} />
      <pointLight position={[6, -6, 6]}  intensity={2.5} color="#60a5fa" />
      <pointLight position={[-6, 4, -4]} intensity={1.5} color="#1d4ed8" />
      <WorldBackground currentScene={currentScene} sceneProgress={sceneProgress} />
      <DataGrid currentScene={currentScene} />
      <ParticleField scene={currentScene} />
      <LiquidBlob currentScene={currentScene} sceneProgress={sceneProgress} />
    </>
  );
});

FluidScene.displayName = "FluidScene";
export default FluidScene;
