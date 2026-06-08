import { useEffect, useState, useRef } from "react";
import Lenis from "lenis";
import { Canvas } from "@react-three/fiber";
import { motion, useScroll, useTransform } from "motion/react";
import FluidScene from "./FluidScene";
import Magnetic from "./Magnetic";
import { Settings, Beaker, ArrowUpRight, Activity, Droplets } from "lucide-react";

function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  // Spring configurations for smooth trailing
  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      if (
        target.closest('button') || 
        target.closest('a') || 
        target.closest('.group') || 
        target.closest('[role="slider"]') ||
        window.getComputedStyle(target).cursor === 'pointer'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return (
    <>
      {/* Core Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-black pointer-events-none z-[100]"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: isHovering ? 0 : 1,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
      />
      {/* Trailing Aura */}
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 rounded-full border border-black/20 pointer-events-none z-[99] flex items-center justify-center backdrop-blur-[1px]"
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y - 20,
          scale: isHovering ? 2.5 : 1,
          backgroundColor: isHovering ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0)",
        }}
        transition={{
          type: "spring",
          ...springConfig
        }}
      />
    </>
  );
}

function FadeIn({ children, delay = 0, className = "", direction = "up" }: { children: React.ReactNode, delay?: number, className?: string, direction?: "up" | "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const yOffset = direction === "up" ? 60 : 0;
  const xOffset = direction === "left" ? 60 : direction === "right" ? -60 : 0;

  // Cinematic parallax effect
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, direction === "up" ? -60 : -20]);

  return (
    <motion.div ref={ref} style={{ y: parallaxY }} className={className}>
      <motion.div
        initial={{ opacity: 0, y: yOffset, x: xOffset }}
        whileInView={{ opacity: 1, y: 0, x: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{
          duration: 1.4,
          ease: [0.16, 1, 0.3, 1], // Cinematic ease out
          delay: delay
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}


function Section({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <section className={`min-h-[140svh] w-full flex flex-col justify-center relative z-10 py-32 ${className}`}>
      <div className="sticky top-1/2 -translate-y-1/2 w-full">
        {children}
      </div>
    </section>
  );
}

function HoverCard({ title, icon: Icon, description, stat }: any) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="group relative border border-black/5 bg-white/60 rounded-[2rem] p-8 md:p-10 overflow-hidden cursor-default backdrop-blur-sm"
    >
      {/* Radial flashlight effect */}
      <div 
         className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
         style={{
           background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,0,0,0.03), transparent 40%)`
         }}
      />
      
      {/* Background Hover color */}
      <div className="absolute inset-0 bg-black/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10 h-full flex flex-col justify-between min-h-[220px]">
          <div>
             <Icon className="w-8 h-8 text-neutral-400 group-hover:text-black transition-colors duration-500 mb-8" />
             <h3 className="text-2xl font-display font-medium text-neutral-600 group-hover:text-black transition-colors duration-500 tracking-tight">{title}</h3>
          </div>
          
          {/* Hover Reveal Content */}
          <div className="overflow-hidden mt-8">
             <div className="transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <p className="text-base text-neutral-500 leading-relaxed font-light mb-6">
                  {description}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-xs uppercase tracking-widest text-[#dca826]">Impact</span>
                  <span className="text-3xl font-display font-light text-black">
                     {stat}
                  </span>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
}

function XRaySlider() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.buttons !== 1) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div 
      ref={containerRef}
      role="slider"
      aria-valuenow={sliderPos}
      className="relative w-full h-64 md:h-[400px] mt-12 rounded-[2rem] overflow-hidden border border-white/10 cursor-ew-resize select-none pointer-events-auto"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      {/* Base: After (Clear / Amber) */}
      <div className="absolute inset-0 bg-gradient-to-r from-white to-[#fdf9f1] flex items-center justify-end px-8">
         <div className="text-right">
            <h4 className="text-[#dca826] font-display text-2xl mb-2">Isolated</h4>
            <p className="text-neutral-500 text-sm max-w-xs">Pollutants extracted into insoluble organic phase. Water remains untouched.</p>
         </div>
      </div>
      
      {/* Overlay: Before (Contaminated / Murky) */}
      <div 
         className="absolute inset-0 bg-neutral-200 border-r border-black/10 flex items-center justify-start px-8 overflow-hidden"
         style={{ width: `${sliderPos}%` }}
      >
         <div className="text-left w-[400px]">
            <h4 className="text-neutral-900 font-display text-2xl mb-2">Contaminated</h4>
            <p className="text-neutral-600 text-sm max-w-xs">Hydrophobic organic compounds dispersed freely throughout the water volume.</p>
         </div>
      </div>
      
      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-black/10 backdrop-blur pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.1)] flex items-center justify-center"
        style={{ left: `calc(${sliderPos}% - 2px)` }}
      >
        <div className="w-6 h-12 bg-white rounded-full flex items-center justify-center gap-1 shadow-md border border-neutral-200">
           <div className="w-0.5 h-4 bg-neutral-400 rounded-full"></div>
           <div className="w-0.5 h-4 bg-neutral-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export default function PlatformExperience() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
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
     <div className="bg-[#f7f7fa] text-neutral-900 font-sans relative selection:bg-black selection:text-white overflow-x-hidden min-h-screen">
       <CustomCursor />
      
      {/* Narrative Overlay / Navbar */}
      <nav className="fixed top-0 w-full z-50 p-6 md:p-10 pointer-events-none">
         <div className="max-w-7xl mx-auto flex justify-between items-center font-medium tracking-widest text-[10px] md:text-xs uppercase text-neutral-500 mix-blend-multiply">
            <div>Purlina Matrix</div>
            <div className="hidden md:block text-neutral-400">Industrial Technology Platform</div>
            <div>Systems</div>
         </div>
      </nav>

      {/* Persistent 3D World Scene */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 14], fov: 40 }} dpr={[1, 1.5]} eventSource={document.body} eventPrefix="client">
          <FluidScene />
        </Canvas>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 pointer-events-none">
        
        {/* Scene 01: The Invisible Layer */}
        <Section className="items-center text-center">
          <div className="pointer-events-auto flex flex-col items-center">
             <FadeIn delay={0.2} direction="up">
                 <p className="text-[10px] md:text-xs tracking-[0.3em] text-neutral-500 uppercase mb-8 border-b border-black/10 pb-4 inline-block font-medium">Core Architecture</p>
             </FadeIn>
             <FadeIn delay={0.4} direction="up">
                 <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-display font-light tracking-tighter leading-[0.95] mb-10 text-neutral-900">
                   The invisible<br/><span className="text-neutral-500 italic font-serif pr-4">infrastructure</span>layer.
                 </h1>
             </FadeIn>
             <FadeIn delay={0.6} direction="up">
                 <p className="text-xl md:text-2xl text-neutral-600 font-light leading-relaxed max-w-2xl text-center">
                    Transforming complex hydrocarbon and surface-performance systems into scalable, easy-to-integrate solutions.
                 </p>
             </FadeIn>
          </div>
          
          {/* Scroll Indicator */}
          <motion.div 
            className="absolute bottom-[-10vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50 pointer-events-none"
            animate={{ y: [0, 10, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="text-[9px] uppercase tracking-[0.4em] font-medium text-neutral-400" style={{ writingMode: 'vertical-rl' }}>Scroll to Initialize</div>
            <div className="w-[1px] h-12 bg-gradient-to-b from-neutral-400 to-transparent"></div>
          </motion.div>
        </Section>

        {/* Scene 02: What is Changing in This World? */}
        <Section className="items-center justify-end">
          <div className="pointer-events-auto max-w-xl w-full md:ml-auto">
             <FadeIn delay={0.1} direction="left">
                 <p className="text-[10px] md:text-xs tracking-[0.3em] text-neutral-500 uppercase mb-6 border-b border-black/10 pb-4 inline-block font-medium">The Bottleneck</p>
                 <h2 className="text-3xl md:text-5xl font-display font-light mb-12 text-neutral-900">
                    What is changing in<br/>this world?
                 </h2>
             </FadeIn>
             <div className="grid grid-cols-1 gap-6 w-full">
                <FadeIn delay={0.3} direction="left">
                    <HoverCard 
                      title="Thermal Bottleneck" 
                      icon={Activity} 
                      description="Artificial Intelligence and HPC data centers are reaching the limits of air and water cooling. Processors are melting down due to extreme energy density." 
                      stat="180 ZB" 
                    />
                </FadeIn>
                <FadeIn delay={0.4} direction="left">
                    <HoverCard 
                      title="Environmental Entropy" 
                      icon={Droplets} 
                      description="Hydrophobic organic pollutants consistently overwhelm traditional water treatment facilities, demanding a physical collection method rather than chemical reactions." 
                      stat="0 VOC" 
                    />
                </FadeIn>
             </div>
          </div>
        </Section>

        {/* Scene 03: Matrix Core - Thermal Revolution */}
        <Section className="items-center justify-start">
          <div className="pointer-events-auto max-w-2xl">
              <FadeIn delay={0.1} direction="right">
                  <p className="text-[10px] md:text-xs tracking-[0.3em] text-neutral-500 uppercase mb-6 border-b border-black/10 pb-4 inline-block font-medium">Thermal Resolution</p>
                  <h2 className="text-5xl md:text-6xl font-display font-light tracking-tighter leading-[1.05] mb-10 text-neutral-900">
                     A stable<br/>
                     <span className="text-neutral-500 italic font-serif tracking-normal">environment for evolution.</span>
                  </h2>
              </FadeIn>
              <FadeIn delay={0.3} direction="right">
                  <p className="text-lg md:text-xl text-neutral-600 font-light leading-relaxed mb-12">
                     Purlina Matrix Core is a single-phase dielectric immersion cooling fluid developed for high-density computing infrastructures. It establishes the stable thermal environment in which electronic systems operate.
                  </p>
              </FadeIn>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <FadeIn delay={0.4} direction="up">
                     <div className="border border-black/5 p-6 rounded-2xl bg-white/60 backdrop-blur-md hover:bg-white transition-colors">
                        <h4 className="text-xl font-display font-medium text-neutral-900 mb-2">X1</h4>
                        <p className="text-neutral-500 text-xs leading-relaxed">Optimized for GPU-dense systems. Maximum fluidity.</p>
                     </div>
                 </FadeIn>
                 <FadeIn delay={0.5} direction="up">
                     <div className="border border-black/5 p-6 rounded-2xl bg-white/60 backdrop-blur-md hover:bg-white transition-colors">
                        <h4 className="text-xl font-display font-medium text-neutral-900 mb-2">X2</h4>
                        <p className="text-neutral-500 text-xs leading-relaxed">Balanced performance between heat transfer and service life.</p>
                     </div>
                 </FadeIn>
                 <FadeIn delay={0.6} direction="up">
                     <div className="border border-black/5 p-6 rounded-2xl bg-white/60 backdrop-blur-md hover:bg-white transition-colors">
                        <h4 className="text-xl font-display font-medium text-neutral-900 mb-2">X3</h4>
                        <p className="text-neutral-500 text-xs leading-relaxed">Developed for 24/7 AI infrastructures under high thermal stress.</p>
                     </div>
                 </FadeIn>
              </div>
          </div>
          
          {/* Fluid Hover Target Layer */}
          <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-auto group hidden md:flex flex-col justify-center items-end pr-12">
             <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col gap-6 items-end">
                <div className="bg-white/80 backdrop-blur-md border border-neutral-200 p-4 rounded-xl text-right max-w-[250px] shadow-sm">
                   <div className="text-[#0055ff] font-display font-light text-2xl mb-1">&gt;35 kV</div>
                   <div className="text-neutral-500 text-[10px] uppercase tracking-widest">Dielectric Breakdown</div>
                </div>
                <div className="bg-white/80 backdrop-blur-md border border-neutral-200 p-4 rounded-xl text-right max-w-[250px] mr-12 shadow-sm">
                   <div className="text-[#0055ff] font-display font-light text-2xl mb-1">Single-phase</div>
                   <div className="text-neutral-500 text-[10px] uppercase tracking-widest">State stability</div>
                </div>
                <div className="bg-white/80 backdrop-blur-md border border-neutral-200 p-4 rounded-xl text-right max-w-[250px] shadow-sm">
                   <div className="text-[#0055ff] font-display font-light text-2xl mb-1">0%</div>
                   <div className="text-neutral-500 text-[10px] uppercase tracking-widest">Water loss</div>
                </div>
             </div>
             <p className="text-neutral-600 text-xs mt-12 opacity-50 group-hover:opacity-0 transition-opacity duration-300 font-mono">
                [ Hover fluid to reveal parameters ]
             </p>
          </div>
        </Section>

        {/* Scene 04: PURLINA HYDROPHOBIC COLLECTOR */}
        <Section className="items-center justify-end">
           <div className="w-full md:w-[55%] pointer-events-auto md:ml-auto">
             <div className="mb-12">
                <FadeIn delay={0.1} direction="left">
                    <p className="text-[10px] md:text-xs tracking-[0.3em] text-[#dca826] uppercase mb-6 border-b border-[#dca826]/20 pb-4 inline-block font-medium">Phase Isolation</p>
                </FadeIn>
                <FadeIn delay={0.2} direction="left">
                    <h2 className="text-4xl md:text-6xl font-display font-light text-neutral-900 mb-8 tracking-tight">
                        Hydrophobic Collector Matrix
                    </h2>
                </FadeIn>
                <FadeIn delay={0.3} direction="left">
                    <p className="text-lg text-neutral-600 font-light leading-relaxed mb-10 max-w-xl">
                        An inert liquid collection phase that physically absorbs hydrophobic organic pollutants found in rivers, dams, wastewater, and surface water without reacting with the water itself.
                    </p>
                </FadeIn>
             </div>
             
             <ul className="space-y-6 max-w-lg mb-8">
                 <FadeIn delay={0.4} direction="left">
                     <li className="flex items-start gap-4 text-neutral-700 font-light border-b border-black/5 pb-6">
                         <div className="min-w-1.5 w-1.5 h-1.5 rounded-full bg-[#dca826] mt-2"></div>
                         <span className="leading-relaxed text-sm md:text-base">Insoluble in water. Does not mix.</span>
                     </li>
                 </FadeIn>
                 <FadeIn delay={0.5} direction="left">
                     <li className="flex items-start gap-4 text-neutral-700 font-light border-b border-black/5 pb-6">
                         <div className="min-w-1.5 w-1.5 h-1.5 rounded-full bg-[#dca826] mt-2"></div>
                         <span className="leading-relaxed text-sm md:text-base">Pollutants do not remain dispersed; they concentrate in the Purlina phase.</span>
                     </li>
                 </FadeIn>
                 <FadeIn delay={0.6} direction="left">
                     <li className="flex items-start gap-4 text-neutral-700 font-light border-b border-black/5 pb-6">
                         <div className="min-w-1.5 w-1.5 h-1.5 rounded-full bg-[#dca826] mt-2"></div>
                         <span className="leading-relaxed text-sm md:text-base">Free from aromatics, sulfur, and VOCs.</span>
                     </li>
                 </FadeIn>
             </ul>
             <FadeIn delay={0.7} direction="left">
                <XRaySlider />
             </FadeIn>
          </div>
        </Section>

        {/* Scene 05: The Efficiency Proof */}
        <Section className="items-center justify-center">
             <div className="w-full max-w-6xl pointer-events-auto">
                 <FadeIn delay={0.1} direction="up">
                     <div className="flex justify-center w-full">
                        <p className="text-[10px] md:text-xs tracking-[0.3em] text-neutral-900 uppercase mb-6 border-b border-black/20 pb-4 inline-block font-medium text-center">The Atlas</p>
                     </div>
                     <h2 className="text-4xl md:text-6xl font-display font-light text-center text-neutral-900 mb-16 tracking-tight">
                         Efficiency Proof
                     </h2>
                 </FadeIn>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <FadeIn delay={0.2} direction="up" className="h-full">
                         <div className="h-full border border-black/5 p-8 rounded-3xl bg-white/60 backdrop-blur-md flex flex-col items-center justify-center text-center group hover:bg-white transition-all duration-500 hover:border-black/10 px-4">
                             <div className="text-5xl md:text-6xl font-display font-light text-neutral-900 mb-6 group-hover:scale-110 transition-transform duration-500 tracking-tighter">48%</div>
                             <div className="text-[10px] sm:text-xs uppercase tracking-widest text-neutral-500 font-medium">Energy Reduction</div>
                         </div>
                     </FadeIn>
                     <FadeIn delay={0.3} direction="up" className="h-full">
                         <div className="h-full border border-black/5 p-8 rounded-3xl bg-white/60 backdrop-blur-md flex flex-col items-center justify-center text-center group hover:bg-white transition-all duration-500 hover:border-black/10 px-4">
                             <div className="text-5xl md:text-6xl font-display font-light text-neutral-900 mb-6 group-hover:scale-110 transition-transform duration-500 tracking-tighter">33%</div>
                             <div className="text-[10px] sm:text-xs uppercase tracking-widest text-neutral-500 font-medium">TCO Decrease</div>
                         </div>
                     </FadeIn>
                     <FadeIn delay={0.4} direction="up" className="h-full">
                         <div className="h-full border border-black/5 p-8 rounded-3xl bg-white/60 backdrop-blur-md flex flex-col items-center justify-center text-center group hover:bg-white transition-all duration-500 hover:border-black/10 px-4">
                             <div className="text-5xl md:text-6xl font-display font-light text-neutral-900 mb-6 group-hover:scale-110 transition-transform duration-500 tracking-tighter">30%</div>
                             <div className="text-[10px] sm:text-xs uppercase tracking-widest text-neutral-500 font-medium">CO2 Reduction</div>
                         </div>
                     </FadeIn>
                     <FadeIn delay={0.5} direction="up" className="h-full">
                         <div className="h-full border border-black/5 p-8 rounded-3xl bg-white/60 backdrop-blur-md flex flex-col items-center justify-center text-center group hover:bg-white transition-all duration-500 hover:border-black/10 px-4">
                             <div className="text-5xl md:text-6xl font-display font-light text-neutral-900 mb-6 group-hover:scale-110 transition-transform duration-500 tracking-tighter">80%</div>
                             <div className="text-[10px] sm:text-xs uppercase tracking-widest text-neutral-500 font-medium">Less Space</div>
                         </div>
                     </FadeIn>
                 </div>
                 
                 <FadeIn delay={0.6} direction="up">
                     <p className="text-center text-neutral-600 mt-12 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed">
                         Compared to evaporative systems, water consumption can be reduced by up to 80%, establishing a radically sustainable baseline for hyperscale compute and legacy infrastructure.
                     </p>
                 </FadeIn>
             </div>
        </Section>

        {/* Scene 06: Initialization CTA */}
        <Section className="items-center justify-center text-center pb-32">
           <div className="pointer-events-auto flex flex-col items-center mt-20">
              <FadeIn delay={0.1} direction="up">
                  <p className="text-[10px] md:text-xs tracking-[0.3em] text-neutral-500 uppercase mb-8 border-b border-black/10 pb-4 inline-block font-medium">An Automated Future</p>
              </FadeIn>
              
              <FadeIn delay={0.2} direction="up">
                 <h2 className="text-5xl md:text-7xl font-display font-light text-neutral-900 mb-16 tracking-tight">
                    Enter the Matrix
                 </h2>
              </FadeIn>
              
              <FadeIn delay={0.3} direction="up">
                  <Magnetic>
                    <button className="group relative flex items-center justify-center gap-6 bg-black text-white pl-12 pr-4 py-4 rounded-full text-xl md:text-2xl font-display font-medium overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-xl">
                       <span className="relative z-10 flex items-center gap-6">
                          Initialize Platform
                          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/20">
                             <ArrowUpRight className="w-6 h-6 group-hover:rotate-45 transition-transform duration-300" />
                          </div>
                       </span>
                       <div className="absolute inset-0 w-full h-full bg-neutral-900 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
                    </button>
                  </Magnetic>
              </FadeIn>
           </div>
        </Section>

      </div>
    </div>
  );
}
