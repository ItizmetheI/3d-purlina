/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshDistortMaterial, Environment, Float, Html, ContactShadows } from '@react-three/drei';
import * as THREE from "three";
import Lenis from "lenis";
import { Car, Stethoscope, Droplet, Cpu, Search, Sparkles, Infinity as InfinityIcon, Zap, Shield } from 'lucide-react';
import { motion } from "motion/react";

function SwirlingDroplets({ count = 15 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<any>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      orbitRadius: 1.5 + Math.random() * 2.5,
      speed: 0.005 + Math.random() * 0.015,
      yOffset: (Math.random() - 0.5) * 4,
      angle: Math.random() * Math.PI * 2,
      scale: 0.1 + Math.random() * 0.4,
      wobbleSpeed: 0.5 + Math.random(),
      wobbleAmount: Math.random(),
      axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
    }));
  }, [count]);

  const prevScroll = useRef(0);
  const scrollVelocity = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Smoother scroll velocity calculation
    const currScroll = window.scrollY;
    const delta = currScroll - prevScroll.current;
    scrollVelocity.current = THREE.MathUtils.lerp(scrollVelocity.current, delta * 0.005, 0.05);
    prevScroll.current = currScroll;

    particles.forEach((p, i) => {
      // Base rotation + scroll induced rotation
      p.angle += p.speed + (scrollVelocity.current * 0.05);
      
      const x = Math.cos(p.angle) * p.orbitRadius;
      const z = Math.sin(p.angle) * p.orbitRadius;
      // Gently bob up and down
      const y = p.yOffset + Math.sin(time * p.wobbleSpeed) * p.wobbleAmount;
            
      dummy.position.set(x, y, z);
      
      // Dynamic scaling based on movement
      const velStretch = 1 + Math.abs(scrollVelocity.current) * 0.2;
      dummy.scale.setScalar(p.scale);
      dummy.scale.y *= velStretch;
      
      // Orient along movement path slightly
      dummy.quaternion.setFromAxisAngle(p.axis, time * p.wobbleSpeed + scrollVelocity.current);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // Subtle distortion on droplets for a fluid feel
    if (materialRef.current) {
        materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, 0.4 + Math.min(Math.abs(scrollVelocity.current) * 0.5, 0.6), 0.1);
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 24, 24]} />
      <MeshDistortMaterial
        ref={materialRef}
        color="#fefefe"
        envMapIntensity={3.5}
        clearcoat={1}
        clearcoatRoughness={0.05}
        metalness={0.95}
        roughness={0.05}
        distort={0.4}
        speed={2}
      />
    </instancedMesh>
  );
}

function InteractiveLiquidGroup() {
  const groupRef = useRef<THREE.Group>(null);
  const blobMatRef = useRef<any>(null);
  const { viewport } = useThree();
  const isSmall = viewport.width < 6;
  
  // Adjusted baseline scale for a smaller, cleaner look
  const baseScale = isSmall ? 0.6 : 1.1;

  // Waypoints mapped to the 5 scroll sections
  const waypoints = useMemo(() => [
    { x: isSmall ? 0 : viewport.width * 0.2, y: isSmall ? viewport.height * 0.1 : viewport.height * 0.15, scale: baseScale }, 
    { x: isSmall ? 0 : -viewport.width * 0.25, y: isSmall ? 0 : -viewport.height * 0.05, scale: baseScale * 0.9 }, 
    { x: isSmall ? 0 : viewport.width * 0.2, y: isSmall ? -viewport.height * 0.1 : -viewport.height * 0.1, scale: baseScale * 1.1 }, 
    { x: 0, y: isSmall ? 0 : viewport.height * 0.05, scale: baseScale * 1.2 }, 
    { x: 0, y: isSmall ? -viewport.height * 0.15 : -viewport.height * 0.2, scale: baseScale * 0.8 }, 
  ], [viewport, isSmall, baseScale]);

  const prevScroll = useRef(0);
  const velocity = useRef(0);

  useFrame((state) => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max((scrollable > 0 ? window.scrollY / scrollable : 0), 0), 1);
    
    const currScroll = window.scrollY;
    const delta = currScroll - prevScroll.current;
    velocity.current = THREE.MathUtils.lerp(velocity.current, delta * 0.002, 0.05); // heavily dampened velocity
    prevScroll.current = currScroll;

    const segment = progress * (waypoints.length - 1); 
    const index = Math.floor(segment);
    const t = segment - index;
    // Smoother easing function
    const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    
    const p0 = waypoints[Math.min(index, waypoints.length - 1)];
    const p1 = waypoints[Math.min(index + 1, waypoints.length - 1)];

    if (!groupRef.current) return;
    
    const targetX = THREE.MathUtils.lerp(p0.x, p1.x, easeT);
    const targetY = THREE.MathUtils.lerp(p0.y, p1.y, easeT);
    const targetScale = THREE.MathUtils.lerp(p0.scale, p1.scale, easeT);
    
    // Damping position movement
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);
    
    // Stretch effect based on velocity
    const velStretchX = 1 - Math.abs(velocity.current) * 0.15;
    const velStretchY = 1 + Math.abs(velocity.current) * 0.3;
    
    groupRef.current.scale.set(
       THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale * velStretchX, 0.08),
       THREE.MathUtils.lerp(groupRef.current.scale.y, targetScale * velStretchY, 0.08),
       THREE.MathUtils.lerp(groupRef.current.scale.z, targetScale * velStretchX, 0.08)
    );
    
    // Gentle rotation
    const time = state.clock.getElapsedTime();
    groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.2 + (velocity.current * 0.5);
    groupRef.current.rotation.y = time * 0.1 + (progress * Math.PI * 2);
    groupRef.current.rotation.z = Math.cos(time * 0.15) * 0.2 - (velocity.current * 0.5);
    
    if (blobMatRef.current) {
        // Much smoother, constrained distortion
         const baseDistort = 0.35 + (Math.sin(time * 0.5) * 0.1);
         const velDistort = Math.min(Math.abs(velocity.current) * 0.8, 0.6); // cap max distortion
         blobMatRef.current.distort = THREE.MathUtils.lerp(blobMatRef.current.distort, baseDistort + velDistort, 0.05);
         blobMatRef.current.speed = THREE.MathUtils.lerp(blobMatRef.current.speed, 1.5 + Math.abs(velocity.current) * 2, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.8, 48, 48]} />
        <MeshDistortMaterial
          ref={blobMatRef}
          color="#fefefe"
          envMapIntensity={3.5}
          clearcoat={1}
          clearcoatRoughness={0.05}
          metalness={0.95}
          roughness={0.05}
          distort={0.3}
          speed={1.5}
        />
      </mesh>
      <SwirlingDroplets />
    </group>
  );
}

function FloatingSectors() {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  
  useFrame((state) => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    
    // Appear primarily in section 4
    const distanceToTarget = Math.abs(progress - 0.75); 
    const targetScale = distanceToTarget < 0.2 ? 1 : 0;
    
    let currentScale = groupRef.current!.scale.x;
    groupRef.current!.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.08));
    
    const time = state.clock.getElapsedTime();
    groupRef.current!.position.y = Math.sin(time * 0.5) * 0.2;
    groupRef.current!.rotation.y = time * 0.1;
  });

  const icons = [
    { Icon: Car, pos: [3.5, 1, 0], speed: 1.5 },
    { Icon: Stethoscope, pos: [-3.5, -1, 1], speed: 1.2 },
    { Icon: Cpu, pos: [0.5, 3.5, -0.5], speed: 1.8 },
    { Icon: Droplet, pos: [-1.5, 2.5, -1.5], speed: 1.4 },
    { Icon: Zap, pos: [2, -2.5, 1.5], speed: 1.6 },
    { Icon: Shield, pos: [-1, -3.5, -0.5], speed: 1.7 },
  ] as const;

  return (
    <group ref={groupRef} scale={0} position={[0, 0, 0]}>
       {icons.map((item, i) => (
         <Float key={i} speed={item.speed} rotationIntensity={0.5} floatIntensity={1.5} position={item.pos as any}>
           <Html transform center style={{ pointerEvents: 'none' }} className="select-none">
              <div className="bg-white/70 backdrop-blur-3xl p-4 md:p-5 rounded-full shadow-[0_8px_32px_rgb(0,0,0,0.08)] border border-white/60 flex items-center justify-center text-gray-800 transition-transform duration-500 hover:scale-110">
                 <item.Icon className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
              </div>
           </Html>
         </Float>
       ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 15, 10]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-10, 5, -5]} intensity={1} color="#f0f7ff" />
      <directionalLight position={[0, -10, 5]} intensity={1.5} color="#ffffff" />
      
      <InteractiveLiquidGroup />
      <FloatingSectors />
      
      <ContactShadows 
         position={[0, -4, 0]} 
         opacity={0.3} 
         scale={15} 
         blur={2} 
         far={10} 
         resolution={128} 
         color="#000000" 
      />
    </>
  );
}

function Section({ children, className = "", align = "left" }: { children: React.ReactNode, className?: string, align?: "left" | "right" | "center" }) {
  const alignmentClass = align === "right" ? "lg:justify-end justify-center" : align === "center" ? "justify-center" : "lg:justify-start justify-center";
  const textAlignment = align === "center" ? "text-center" : "lg:text-left text-center";
  
  return (
    <section className={`min-h-[100svh] flex items-center ${alignmentClass} ${className} relative z-10 py-24`}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-2xl pointer-events-auto ${textAlignment} flex flex-col ${align === 'center' ? 'items-center' : align === 'right' ? 'lg:items-end items-center' : 'lg:items-start items-center'}`}
      >
        {children}
      </motion.div>
    </section>
  )
}

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1, // Smooth scrolling without strict duration constraint
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1, 
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    window.scrollTo(0, 0);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="bg-[#fafafa] text-gray-900 font-sans relative selection:bg-black selection:text-white overflow-hidden">
      
      {/* Navbar overlay */}
      <nav className="fixed top-0 w-full z-50 p-6 mix-blend-difference text-white pointer-events-none">
         <div className="max-w-7xl mx-auto flex justify-between items-center opacity-80 font-medium tracking-wide text-sm md:text-base">
            <div>Next Generation</div>
            <div>Purlina 2.0</div>
         </div>
      </nav>

      {/* 3D Canvas fixed in background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 14], fov: 40 }} dpr={[1, 2]}>
          <Scene />
        </Canvas>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 pointer-events-none">
        
        {/* SECTION 1 - Hero */}
        <Section align="left">
          <div className="bg-black text-white p-8 md:p-12 w-fit shadow-2xl">
            <h1 className="flex flex-col">
               <span className="text-2xl md:text-4xl font-light tracking-[0.2em] mb-2 uppercase">Purlina</span>
               <span className="text-6xl md:text-[7rem] font-black tracking-tighter uppercase leading-[0.85]">Matrix</span>
            </h1>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/50 max-w-md relative mt-12">
             <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-medium">
               As you scroll down the site, the shape also moves down and changes position. 
               <br/><br/>
               <span className="text-gray-500">
                  It gives the impression of being in motion and curving, in a liquid and variable form, with a glassy structure.
               </span>
             </p>
          </div>
        </Section>

        {/* SECTION 2 - Benefits */}
        <Section align="right">
          <div className="flex flex-col lg:flex-row items-center gap-12 max-w-4xl">
            <div className="bg-white/70 backdrop-blur-3xl p-10 md:p-14 rounded-[2.5rem] border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] w-full">
               <h2 className="text-2xl md:text-4xl font-bold mb-10 text-gray-900 border-b border-gray-200 pb-6 flex items-center gap-4">
               Benefits
               </h2>
               <ol className="text-lg md:text-2xl space-y-8 text-gray-700 font-medium pb-4">
               {[ 'Adaptation to new regulation changes', 'Convenience', 'Cost', 'Speed' ].map((item, i) => (
                  <motion.li 
                     key={i}
                     initial={{ opacity: 0, x: 20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.15 + 0.1, duration: 0.6 }}
                     viewport={{ once: true }}
                     className="flex items-start gap-6 group"
                  >
                     <span className="flex-shrink-0 text-gray-300 font-light text-2xl md:text-4xl leading-none pt-1">
                        {i + 1}.
                     </span>
                     <span className="group-hover:text-black transition-colors leading-tight">{item}</span>
                  </motion.li>
               ))}
               </ol>
            </div>
          </div>
          <p className="text-lg text-gray-500 italic max-w-md bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm mt-12">
             As you scroll down the site, the shape also moves down and changes position.
          </p>
        </Section>

        {/* SECTION 3 - Sectors */}
        <Section align="left">
          <div className="flex flex-col lg:flex-row items-center gap-10">
             <div className="bg-white/70 backdrop-blur-3xl p-10 md:p-16 rounded-[3rem] border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
               <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-[1.1] mb-8 tracking-tight">
                  Adaptable structure for <br/><span className="text-gray-400 font-medium block mt-2">900+ sectors...</span>
               </h2>
               <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-md">
                 It shifts its form to show the products of each sector it enters (car wheel, medicine, cosmetics, etc.).
               </p>
             </div>
          </div>
        </Section>

        {/* SECTION 4 - Continuous */}
        <Section align="right">
          <div className="flex flex-col lg:flex-row-reverse items-center justify-end gap-10 w-full mb-32">
             <div className="bg-black/90 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-gray-800 shadow-[0_30px_100px_rgba(0,0,0,0.3)] text-white max-w-md">
                 <p className="text-lg md:text-2xl font-light leading-snug">
                   The liquid shape continues in the background, while examples of the sectors it can enter rotate above it.
                 </p>
             </div>
          </div>
        </Section>

        {/* SECTION 5 - Call to Action */}
        <Section align="center" className="pb-32">
          <motion.div 
             initial={{ scale: 0.9, opacity: 0, y: 40 }}
             whileInView={{ scale: 1, opacity: 1, y: 0 }}
             viewport={{ once: false, margin: "-10%" }}
             transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
             className="w-full max-w-3xl relative pointer-events-auto group mt-20"
          >
             <div className="absolute inset-0 bg-gray-200/50 rounded-[3rem] blur-2xl transform group-hover:scale-105 transition-transform duration-700"></div>
             <div className="relative bg-white/70 backdrop-blur-3xl border-2 border-white/80 rounded-[3rem] p-4 flex items-center shadow-[0_20px_80px_-20px_rgba(0,0,0,0.1)] transition-all hover:bg-white/90">
               <input 
                  type="text" 
                  value="Create Purlina Matrix"
                  readOnly
                  className="w-full bg-transparent py-6 md:py-8 pl-8 md:pl-10 text-xl md:text-3xl font-medium focus:outline-none text-gray-900 cursor-default"
               />
               <button className="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-gray-100 hover:bg-black rounded-[2rem] transition-colors duration-300 cursor-pointer shadow-sm group/btn mr-2">
                 <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-600 group-hover/btn:text-white transition-colors duration-300" />
               </button>
             </div>
          </motion.div>
        </Section>
        
      </div>
    </div>
  );
}


