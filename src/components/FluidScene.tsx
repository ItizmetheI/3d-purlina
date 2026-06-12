import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, Environment, Float } from "@react-three/drei";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FluidSceneHandle {
  setScene: (scene: number, progress: number) => void;
}

// ─── Scene configs ────────────────────────────────────────────────────────────
const SCENES = [
  // 0: Hero — white world, small centered blob
  { blobX: 0,    blobY: 0,   blobScale: 1.1,  blobColor: "#d0d8e8", envIntensity: 1.2, transmission: 0.98, thickness: 3,   ior: 1.35, chrAb: 0.04 },
  // 1: Problem — blob drifts left, grows
  { blobX: -3.5, blobY: 0,   blobScale: 1.4,  blobColor: "#c5d5ee", envIntensity: 1.5, transmission: 0.95, thickness: 4,   ior: 1.38, chrAb: 0.06 },
  // 2: Solution — blob right, large
  { blobX: 3.5,  blobY: 0,   blobScale: 1.8,  blobColor: "#a8c4e8", envIntensity: 2.0, transmission: 0.92, thickness: 5,   ior: 1.42, chrAb: 0.08 },
  // 3: Collector — amber phase, center
  { blobX: 0,    blobY: 0,   blobScale: 2.0,  blobColor: "#c8860a", envIntensity: 2.5, transmission: 0.88, thickness: 6,   ior: 1.45, chrAb: 0.10 },
  // 4: Data — blob right, medium
  { blobX: 3.0,  blobY: 0,   blobScale: 1.5,  blobColor: "#8899bb", envIntensity: 1.8, transmission: 0.93, thickness: 4.5, ior: 1.40, chrAb: 0.07 },
  // 5: CTA — blob expands to fill, camera engulf
  { blobX: 0,    blobY: 0,   blobScale: 9.0,  blobColor: "#111111", envIntensity: 3.0, transmission: 0.85, thickness: 8,   ior: 1.50, chrAb: 0.12 },
];

// ─── Particle Field ───────────────────────────────────────────────────────────
function ParticleField({ scene }: { scene: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 200; // REDUCED FROM 600 FOR WEBGL CONTEXT PERFORMANCE

  const pts = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 50,
    y: (Math.random() - 0.5) * 50,
    z: (Math.random() - 0.5) * 40,
    vy: 0.003 + Math.random() * 0.008,
    s: 0.006 + Math.random() * 0.016,
    ph: Math.random() * Math.PI * 2,
  })), []);

  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (!meshRef.current || !matRef.current) return;
    const t = state.clock.getElapsedTime();
    const sc = scene.current;

    // Color: white in scenes 0-2, amber in scene 3, fade dark in 4-5
    const targetOpacity = sc <= 2 ? 0.18 : sc === 3 ? 0.3 : 0.08;
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOpacity, 0.04);

    pts.forEach((p, i) => {
      p.y += p.vy * (1 + sc * 0.15);
      if (p.y > 25) p.y -= 50;
      dummy.position.set(
        p.x + Math.sin(t * 0.3 + p.ph) * 0.2,
        p.y,
        p.z + Math.cos(t * 0.3 + p.ph) * 0.2
      );
      const stretch = 1 + Math.abs(Math.sin(t + p.ph)) * 0.3;
      dummy.scale.set(p.s, p.s * stretch, p.s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial ref={matRef} color="#aabbcc" transparent opacity={0.18} depthWrite={false} />
    </instancedMesh>
  );
}

// ─── Core Blob ────────────────────────────────────────────────────────────────
function LiquidBlob({
  currentScene,
  sceneProgress,
}: {
  currentScene: React.MutableRefObject<number>;
  sceneProgress: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef   = useRef<any>(null);
  const { viewport } = useThree();

  const lerpColor = useRef(new THREE.Color(SCENES[0].blobColor));
  const prevVel   = useRef(0);
  const smoothPtr = useRef(new THREE.Vector2());
  const prevY     = useRef(window.scrollY);

  useFrame((state) => {
    if (!groupRef.current || !matRef.current) return;
    const t = state.clock.getElapsedTime();

    // Velocity
    const cy = window.scrollY;
    prevVel.current = THREE.MathUtils.lerp(prevVel.current, (cy - prevY.current) * 0.002, 0.08);
    prevY.current = cy;

    smoothPtr.current.lerp(state.pointer, 0.05);

    // Scene interpolation
    const sc = Math.min(Math.floor(currentScene.current), SCENES.length - 2);
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

    // Position
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      tx + smoothPtr.current.x * 1.8,
      0.055
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      ty + smoothPtr.current.y * 1.8,
      0.055
    );

    // Scale with velocity stretch
    const velS = 1 + Math.abs(prevVel.current) * 0.7;
    groupRef.current.scale.set(
      THREE.MathUtils.lerp(groupRef.current.scale.x, ts, 0.07),
      THREE.MathUtils.lerp(groupRef.current.scale.y, ts * velS, 0.07),
      THREE.MathUtils.lerp(groupRef.current.scale.z, ts, 0.07)
    );

    // Rotation
    groupRef.current.rotation.y = t * 0.09 + smoothPtr.current.x * 0.5 + sc * 0.4;
    groupRef.current.rotation.x = Math.sin(t * 0.18) * 0.18 + smoothPtr.current.y * -0.35;
    groupRef.current.rotation.z = Math.sin(t * 0.12) * 0.06;

    // Material
    const tIor          = THREE.MathUtils.lerp(A.ior, B.ior, ease);
    const tThick        = THREE.MathUtils.lerp(A.thickness, B.thickness, ease);
    const tTrans        = THREE.MathUtils.lerp(A.transmission, B.transmission, ease);
    const tChrAb        = THREE.MathUtils.lerp(A.chrAb, B.chrAb, ease);
    const velDistort    = Math.min(Math.abs(prevVel.current) * 2.5, 0.6);

    matRef.current.color.copy(lerpColor.current);
    matRef.current.ior              = tIor;
    matRef.current.thickness        = tThick;
    matRef.current.transmission     = tTrans;
    matRef.current.chromaticAberration = tChrAb;
    matRef.current.distortionScale  = THREE.MathUtils.lerp(
      matRef.current.distortionScale ?? 0.2,
      0.15 + velDistort + Math.sin(t * 0.6) * 0.04,
      0.06
    );
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.0} rotationIntensity={0.5} floatIntensity={0.6} floatingRange={[-0.06, 0.06]}>
        <mesh castShadow>
          <sphereGeometry args={[1.8, 64, 64]} />
          <MeshTransmissionMaterial
            ref={matRef}
            color={SCENES[0].blobColor}
            background={new THREE.Color("#ffffff")}
            transmission={0.98}
            thickness={3}
            roughness={0.0}
            ior={1.35}
            chromaticAberration={0.04}
            anisotropy={0.1}
            distortion={0.25}
            distortionScale={0.2}
            temporalDistortion={0.22}
            envMapIntensity={2.0}
            clearcoat={1.0}
            clearcoatRoughness={0.0}
            attenuationDistance={3.0}
            attenuationColor="#d0d8f0"
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
    // Push camera closer in final scene (engulf effect)
    const sc = currentScene.current;
    targetZ.current = sc >= 4.5 ? THREE.MathUtils.lerp(targetZ.current, 5, 0.04) : THREE.MathUtils.lerp(targetZ.current, 14, 0.04);

    camera.position.x   = THREE.MathUtils.lerp(camera.position.x,   mouse.x * 1.5, 0.025);
    camera.position.y   = THREE.MathUtils.lerp(camera.position.y,   mouse.y * 1.5, 0.025);
    camera.position.z   = THREE.MathUtils.lerp(camera.position.z,   targetZ.current, 0.04);
    camera.rotation.z   = THREE.MathUtils.lerp(camera.rotation.z, -mouse.x * 0.04, 0.025);
  });
  return null;
}

// ─── Background plane (world color) ──────────────────────────────────────────
function WorldBackground({ currentScene, sceneProgress }: {
  currentScene: React.MutableRefObject<number>;
  sceneProgress: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshBasicMaterial>(null);

  // World background colors per scene
  const bgColors = useMemo(() => [
    new THREE.Color("#ffffff"), // scene 0 — white
    new THREE.Color("#f2f2f5"), // scene 1 — near white
    new THREE.Color("#e8e8ef"), // scene 2 — light grey
    new THREE.Color("#0d0d10"), // scene 3 — near black (amber scene)
    new THREE.Color("#111118"), // scene 4 — dark
    new THREE.Color("#000000"), // scene 5 — black
  ], []);

  const lerpBg = useRef(new THREE.Color("#ffffff"));

  useFrame(() => {
    if (!matRef.current) return;
    const sc   = Math.min(Math.floor(currentScene.current), bgColors.length - 2);
    const prog = sceneProgress.current;
    const ease = prog < 0.5 ? 2 * prog * prog : -1 + (4 - 2 * prog) * prog;
    lerpBg.current.lerpColors(bgColors[sc], bgColors[Math.min(sc + 1, bgColors.length - 1)], ease);
    matRef.current.color.copy(lerpBg.current);
  });

  const { viewport } = useThree();
  return (
    <mesh ref={meshRef} position={[0, 0, -20]}>
      <planeGeometry args={[viewport.width * 6, viewport.height * 6]} />
      <meshBasicMaterial ref={matRef} color="#ffffff" />
    </mesh>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
const FluidScene = forwardRef<FluidSceneHandle, {
  currentScene: React.MutableRefObject<number>;
  sceneProgress: React.MutableRefObject<number>;
}>(({ currentScene, sceneProgress }, ref) => {
  useImperativeHandle(ref, () => ({
    setScene: (scene: number, progress: number) => {
      currentScene.current = scene;
      sceneProgress.current = progress;
    },
  }));

  return (
    <>
      <Camera currentScene={currentScene} />
      <Environment preset="studio" />
      <ambientLight intensity={0.6} color="#e8eef8" />
      <directionalLight position={[10, 15, 10]} intensity={3.5} color="#ffffff" castShadow />
      <directionalLight position={[-8, -4, -8]} intensity={2.0} color="#aabbdd" />
      <spotLight position={[0, 10, 8]} intensity={4} color="#ffffff" penumbra={0.9} angle={0.4} />
      <pointLight position={[6, -6, 6]} intensity={2} color="#c8d8f0" />
      <WorldBackground currentScene={currentScene} sceneProgress={sceneProgress} />
      <ParticleField scene={currentScene} />
      <LiquidBlob currentScene={currentScene} sceneProgress={sceneProgress} />
    </>
  );
});

FluidScene.displayName = "FluidScene";
export default FluidScene;
