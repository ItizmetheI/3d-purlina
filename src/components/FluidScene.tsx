import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshDistortMaterial, Environment, ContactShadows, Float } from "@react-three/drei";
import * as THREE from "three";

function SwirlingNodes({ count = 25 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      orbitRadius: 2.5 + Math.random() * 4.5,
      speed: 0.002 + Math.random() * 0.008,
      yOffset: (Math.random() - 0.5) * 6,
      angle: Math.random() * Math.PI * 2,
      scale: 0.05 + Math.random() * 0.15,
      axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
    }));
  }, [count]);

  const prevScroll = useRef(0);
  const velocity = useRef(0);
  
  const colorBlue = useMemo(() => new THREE.Color("#7db4e6"), []);
  const colorAmber = useMemo(() => new THREE.Color("#dca826"), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Smooth scroll velocity
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(Math.max((window.scrollY / scrollable), 0), 1);
    
    const currScroll = window.scrollY;
    velocity.current = THREE.MathUtils.lerp(velocity.current, (currScroll - prevScroll.current) * 0.004, 0.05);
    prevScroll.current = currScroll;

    // Transition particle color based on progress (Amber in section 4)
    if (matRef.current) {
        const targetColor = progress > 0.55 && progress < 0.75 ? colorAmber : colorBlue;
        matRef.current.color.lerp(targetColor, 0.05);
    }

    particles.forEach((p, i) => {
      // Dynamic rotation based on velocity
      p.angle += p.speed + (velocity.current * 0.05);
      
      // Expand orbit dynamically with scroll for a 3D dramatic push effect
      const currentOrbit = p.orbitRadius + Math.abs(velocity.current) * 4;
      
      const x = Math.cos(p.angle) * currentOrbit;
      const z = Math.sin(p.angle) * currentOrbit;
      const y = p.yOffset + Math.sin(time + p.angle) * 1.5 + (velocity.current * 6); // Extra vertical sway
            
      dummy.position.set(x, y, z);
      
      // Cinematic scale pulse
      const pulse = 1 + Math.sin(time * 2 + i) * 0.4;
      const stretch = 1 + Math.abs(velocity.current) * 4;
      dummy.scale.set(p.scale * pulse, p.scale * pulse * stretch, p.scale * pulse);
      
      // Orient rotation logic
      dummy.quaternion.setFromAxisAngle(p.axis, time * 2 + velocity.current);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshPhysicalMaterial ref={matRef} color="#7db4e6" envMapIntensity={1.5} clearcoat={1} clearcoatRoughness={0} roughness={0} metalness={0.1} transmission={0.95} ior={1.33} thickness={1.5} />
    </instancedMesh>
  );
}

function DataDust({ count = 800 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 60,
      z: (Math.random() - 0.5) * 60,
      speed: Math.random() * 0.015 + 0.002,
      scale: Math.random() * 0.02 + 0.005
    }));
  }, [count]);

  const prevScroll = useRef(0);
  const velocity = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const currScroll = window.scrollY;
    velocity.current = THREE.MathUtils.lerp(velocity.current, (currScroll - prevScroll.current) * 0.01, 0.05);
    prevScroll.current = currScroll;

    particles.forEach((p, i) => {
      // Move up like bubbles
      p.y += (p.speed) + (velocity.current * 2);
      
      // Loop back
      if (p.y > 30) p.y -= 60;
      if (p.y < -30) p.y += 60;
      
      const wiggleX = Math.sin(time * 0.5 + i) * 0.1;
      const wiggleZ = Math.cos(time * 0.5 + i) * 0.1;
      
      dummy.position.set(p.x + wiggleX, p.y, p.z + wiggleZ);
      
      // Stretch on Y based on scroll velocity for cinematic motion blur feel
      const stretch = 1 + Math.abs(velocity.current) * 8;
      dummy.scale.set(p.scale, p.scale * stretch, p.scale);
      
      // Rotation based on movement to add realism
      dummy.rotation.x = time * p.speed * 10;
      dummy.rotation.y = time * p.speed * 10;
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshPhysicalMaterial color="#ffffff" transmission={0.9} roughness={0} ior={1.33} thickness={0.5} clearcoat={1} depthWrite={false} transparent opacity={0.6} />
    </instancedMesh>
  );
}

function LiquidGlassCore() {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<any>(null);
  const { viewport } = useThree();
  const isSmall = viewport.width < 6;

  const baseScale = isSmall ? 0.8 : 1.3;

  const waypoints = useMemo(() => [
    // Scene 01: The Invisible Layer (Center, smaller core)
    { x: 0, y: 0, scale: baseScale * 0.9, color: new THREE.Color("#e0eaf5"), distort: 0.2 }, 
    // Scene 02: What is Changing (Text on right, fluid on left)
    { x: isSmall ? 0 : -viewport.width * 0.25, y: 0, scale: baseScale * 0.8, color: new THREE.Color("#d0e3f5"), distort: 0.15 }, 
    // Scene 03: Matrix Core (Text on left, fluid on right)
    { x: isSmall ? 0 : viewport.width * 0.25, y: isSmall ? -viewport.height * 0.05 : 0, scale: baseScale * 1.5, color: new THREE.Color("#bde0fe"), distort: 0.3 }, 
    // Scene 04: X Series (Text on right, fluid on left, clear/blue color)
    { x: isSmall ? 0 : -viewport.width * 0.25, y: isSmall ? viewport.height * 0.1 : 0, scale: baseScale * 1.4, color: new THREE.Color("#a2d2ff"), distort: 0.25 },
    // Scene 05: Efficiency Proof (Text centered, fluid centered)
    { x: 0, y: 0, scale: baseScale * 1.2, color: new THREE.Color("#d0e3f5"), distort: 0.2 },
    // Scene 06: CTA Background (Engulfing camera for initialization)
    { x: 0, y: 0, scale: baseScale * 5.5, color: new THREE.Color("#e0eaf5"), distort: 0.2 }, 
  ], [viewport, isSmall, baseScale]);

  const prevScroll = useRef(0);
  const velocity = useRef(0);
  const smoothPointer = useRef(new THREE.Vector2());
  const interpolatedColor = useRef(new THREE.Color());

  useFrame((state) => {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(Math.max((window.scrollY / scrollable), 0), 1);
    
    const currScroll = window.scrollY;
    velocity.current = THREE.MathUtils.lerp(velocity.current, (currScroll - prevScroll.current) * 0.002, 0.05);
    prevScroll.current = currScroll;

    // Fluid mouse follow
    smoothPointer.current.lerp(state.pointer, 0.05);

    const segment = progress * (waypoints.length - 1); 
    const index = Math.floor(segment);
    const t = segment - index;
    const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Smoothstep
    
    const p0 = waypoints[Math.min(index, waypoints.length - 1)];
    const p1 = waypoints[Math.min(index + 1, waypoints.length - 1)];

    if (!groupRef.current) return;
    
    const targetX = THREE.MathUtils.lerp(p0.x, p1.x, easeT);
    const targetY = THREE.MathUtils.lerp(p0.y, p1.y, easeT);
    const targetScale = THREE.MathUtils.lerp(p0.scale, p1.scale, easeT);
    const targetDistort = THREE.MathUtils.lerp(p0.distort, p1.distort, easeT);
    interpolatedColor.current.lerpColors(p0.color, p1.color, easeT);
    
    // Parallax & Interpolation
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX + (smoothPointer.current.x * 2), 0.05);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY + (smoothPointer.current.y * 2), 0.05);
    
    // Apply stretch on scroll velocity
    const velStretchY = 1 + Math.abs(velocity.current) * 0.4;
    groupRef.current.scale.set(
       THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.08),
       THREE.MathUtils.lerp(groupRef.current.scale.y, targetScale * velStretchY, 0.08),
       THREE.MathUtils.lerp(groupRef.current.scale.z, targetScale, 0.08)
    );
    
    // Rotations based on mouse and time
    const time = state.clock.getElapsedTime();
    groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.2 + (smoothPointer.current.y * -0.5);
    groupRef.current.rotation.y = time * 0.1 + (smoothPointer.current.x * 0.5) + (progress * Math.PI);
    
    if (materialRef.current) {
         // Subtle distortion that increases when scrolling
         const velDistort = Math.min(Math.abs(velocity.current) * 1.5, 0.8);
         materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, targetDistort + velDistort + (Math.sin(time) * 0.05), 0.05);
         materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, 2 + Math.abs(velocity.current) * 4, 0.05);
         materialRef.current.color.copy(interpolatedColor.current);
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={1} floatIntensity={1} floatingRange={[-0.1, 0.1]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1.8, 128, 128]} />
          <MeshDistortMaterial
            ref={materialRef}
            color="#ffffff"
            envMapIntensity={3.5}
            clearcoat={1.0}
            clearcoatRoughness={0.0}
            metalness={0.05}
            roughness={0.0}
            transmission={1.0}
            ior={1.333} // Exact IOR of water
            thickness={4.5}
            distort={0.4}
            speed={2}
          />
        </mesh>
      </Float>
      <SwirlingNodes count={45} />
    </group>
  );
}

function CameraRig() {
  const { camera, mouse } = useThree();
  useFrame(() => {
    // Cinematic camera sway based on mouse position
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 1.5, 0.02);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.y * 1.5, 0.02);
    // Slight roll
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, -mouse.x * 0.05, 0.02);
  });
  return null;
}

export default function FluidScene() {
  return (
    <>
      <CameraRig />
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      {/* Cinematic underwater lighting setup */}
      <directionalLight position={[10, 15, 10]} intensity={3} color="#ffffff" castShadow />
      <directionalLight position={[-10, -5, -5]} intensity={2} color="#4488ff" />
      <spotLight position={[0, 10, 10]} intensity={2.5} color="#a2d2ff" penumbra={0.8} angle={0.5} />
      <pointLight position={[0, -10, 0]} intensity={1.5} color="#0055ff" />
      
      <DataDust count={2000} />
      <LiquidGlassCore />
      
      <ContactShadows 
         position={[0, -4, 0]} 
         opacity={0.3} 
         scale={25} 
         blur={2} 
         far={10} 
         color="#000000" 
         resolution={256}
      />
    </>
  );
}
