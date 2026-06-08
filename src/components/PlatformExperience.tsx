import { useEffect, useState, useRef } from "react";
import Lenis from "lenis";
import { Canvas } from "@react-three/fiber";
import { motion, useScroll, useTransform, useMotionValue } from "motion/react";
import FluidScene from "./FluidScene";
import Magnetic from "./Magnetic";
import { ArrowUpRight, Activity, Zap, Layers, Shield } from "lucide-react";

// ─── Custom Cursor ────────────────────────────────────────────────────────────
function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsHovering(
        !!(target.closest("button") ||
          target.closest("a") ||
          target.closest(".group") ||
          target.closest('[role="slider"]') ||
          window.getComputedStyle(target).cursor === "pointer")
      );
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-[#0055ff] pointer-events-none z-[100]"
        animate={{ x: mousePosition.x - 4, y: mousePosition.y - 4, scale: isHovering ? 0 : 1 }}
        transition={{ type: "tween", ease: "backOut", duration: 0.1 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 rounded-full border border-[#0055ff]/30 pointer-events-none z-[99] backdrop-blur-[1px]"
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y - 20,
          scale: isHovering ? 2.5 : 1,
          backgroundColor: isHovering ? "rgba(0,85,255,0.05)" : "rgba(0,0,0,0)",
        }}
        transition={{ type: "spring", damping: 20, stiffness: 200, mass: 0.5 }}
      />
    </>
  );
}

// ─── Fade In on Scroll ────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, direction === "up" ? -60 : -20]);

  return (
    <motion.div ref={ref} style={{ y: parallaxY }} className={className}>
      <motion.div
        initial={{ opacity: 0, y: direction === "up" ? 60 : 0, x: direction === "left" ? 60 : direction === "right" ? -60 : 0 }}
        whileInView={{ opacity: 1, y: 0, x: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
// Using padding-based layout instead of sticky to avoid overlap bugs
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-h-[100svh] w-full flex flex-col justify-center relative z-10 py-24 md:py-32 ${className}`}>
      {children}
    </section>
  );
}

// ─── Spec Card ────────────────────────────────────────────────────────────────
function HoverCard({ title, icon: Icon, description, stat }: { title: string; icon: any; description: string; stat: string }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-150, 150], [5, -5]);
  const rotateY = useTransform(x, [-150, 150], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;
    setMousePos({ x: ex, y: ey });
    x.set(ex - rect.width / 2);
    y.set(ey - rect.height / 2);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className="group relative border border-black/5 bg-white/60 rounded-[2rem] p-8 md:p-10 overflow-hidden cursor-default backdrop-blur-sm transition-transform duration-300 ease-out"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,85,255,0.04), transparent 40%)` }}
      />
      <div className="relative z-10 h-full flex flex-col justify-between min-h-[220px]">
        <div>
          <Icon className="w-8 h-8 text-neutral-400 group-hover:text-[#0055ff] transition-colors duration-500 mb-8" />
          <h3 className="text-2xl font-display font-medium text-neutral-600 group-hover:text-black transition-colors duration-500 tracking-tight">{title}</h3>
        </div>
        <div className="overflow-hidden mt-8">
          <div className="transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <p className="text-base text-neutral-500 leading-relaxed font-light mb-6">{description}</p>
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-widest text-[#0055ff]">Impact</span>
              <span className="text-3xl font-display font-light text-black">{stat}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── X-Series Comparison ──────────────────────────────────────────────────────
function XSeriesTable() {
  const rows = [
    { label: "Color (ASTM)", x1: "L0.5", x2: "L0.5", x3: "L0.5" },
    { label: "Density @ 15°C (g/cm³)", x1: "0.837", x2: "0.809", x3: "0.819" },
    { label: "Kinematic Viscosity @ 40°C (mm²/s)", x1: "34.8", x2: "9.19", x3: "19.7" },
    { label: "Flash Point (°C)", x1: "254", x2: "196", x3: "248" },
    { label: "Auto-Ignition Point (°C)", x1: "402", x2: "336", x3: "387" },
    { label: "Acid Number (mgKOH/g)", x1: "0.01", x2: "0.01", x3: "0.01" },
    { label: "Volume Resistivity @ 25°C (TΩ·m)", x1: ">1", x2: ">1", x3: ">1" },
  ];

  return (
    <div className="w-full overflow-x-auto mt-12 group/table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10">
            <th className="text-left py-4 pr-6 text-[10px] uppercase tracking-widest text-neutral-400 font-medium w-1/2">Parameter</th>
            {["X1", "X2", "X3"].map((x) => (
              <th key={x} className="py-4 px-4 text-center">
                <span className="text-2xl font-display font-light text-neutral-900">{x}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-black/5 group-hover/table:opacity-40 hover:!opacity-100 hover:bg-black/[0.02] transition-colors relative z-10 transition-opacity">
              <td className="py-4 pr-6 text-neutral-500 text-xs leading-relaxed font-light">{row.label}</td>
              <td className="py-4 px-4 text-center text-neutral-900 font-display font-light text-sm transition-colors">{row.x1}</td>
              <td className="py-4 px-4 text-center text-neutral-900 font-display font-light text-sm transition-colors">{row.x2}</td>
              <td className="py-4 px-4 text-center text-neutral-900 font-display font-light text-sm transition-colors">{row.x3}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-neutral-400 mt-4 font-light">Typical properties subject to change without notice. (March 2026)</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PlatformExperience() {
  useEffect(() => {
    // Add lenis scroll
    const lenis = new Lenis({ lerp: 0.1, orientation: "vertical", gestureOrientation: "vertical", smoothWheel: true, wheelMultiplier: 1 });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.scrollTo(0, 0);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="bg-[#f7f7fa] text-neutral-900 font-sans relative selection:bg-[#0055ff] selection:text-white overflow-x-hidden min-h-screen">
      <CustomCursor />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 p-6 md:p-10 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center font-medium tracking-widest text-[10px] md:text-xs uppercase text-neutral-500 mix-blend-multiply">
          <div className="font-display font-medium text-neutral-900">Purlina Matrix Core</div>
          <div className="hidden md:block">by Alkim Petrokimya</div>
          <div>AI Thermal Platform</div>
        </div>
      </nav>

      {/* Persistent 3D Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 14], fov: 40 }} dpr={[1, 1.5]} eventSource={document.body} eventPrefix="client">
          <FluidScene />
        </Canvas>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 pointer-events-none">

        {/* ── Scene 01: Hero ── */}
        <Section className="items-center text-center">
          <div className="pointer-events-auto flex flex-col items-center">
            <FadeIn delay={0.2} direction="up">
              <p className="text-[10px] md:text-xs tracking-[0.3em] text-neutral-500 uppercase mb-8 border-b border-black/10 pb-4 inline-block font-medium">
                Dielectric Immersion Cooling Platform
              </p>
            </FadeIn>
            <FadeIn delay={0.4} direction="up">
              <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-display font-light tracking-tighter leading-[0.95] mb-10 text-neutral-900">
                The thermal<br />
                <span className="text-[#0055ff] italic font-serif pr-4">revolution</span>
                <span className="text-neutral-900">shaping</span><br />
                <span className="text-neutral-400 font-light">the future.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.6} direction="up">
              <p className="text-xl md:text-2xl text-neutral-600 font-light leading-relaxed max-w-2xl text-center">
                A single-phase dielectric immersion fluid for AI data centers, HPC clusters, and GPU-dense infrastructure.
              </p>
            </FadeIn>
          </div>
          <motion.div
            className="absolute bottom-[-6vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none"
            animate={{ y: [0, 10, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="text-[9px] uppercase tracking-[0.4em] font-medium text-neutral-400" style={{ writingMode: "vertical-rl" }}>Scroll to Initialize</div>
            <div className="w-[1px] h-12 bg-gradient-to-b from-neutral-400 to-transparent" />
          </motion.div>
        </Section>

        {/* ── Scene 02: The Problem ── */}
        <Section className="items-center justify-end">
          <div className="pointer-events-auto max-w-xl w-full md:ml-auto">
            <FadeIn delay={0.1} direction="left">
              <p className="text-[10px] md:text-xs tracking-[0.3em] text-neutral-500 uppercase mb-6 border-b border-black/10 pb-4 inline-block font-medium">The Bottleneck</p>
              <h2 className="text-3xl md:text-5xl font-display font-light mb-12 text-neutral-900">
                The third phase<br />of digital transformation<br />
                <span className="text-[#0055ff] italic font-serif">is thermal.</span>
              </h2>
            </FadeIn>
            <div className="grid grid-cols-1 gap-6 w-full">
              <FadeIn delay={0.3} direction="left">
                <HoverCard
                  title="Thermal Bottleneck"
                  icon={Activity}
                  description="AI clusters and LLM training infrastructures now generate megawatt-level heat. Conventional air and water cooling has reached its sustainability ceiling."
                  stat="180 ZB"
                />
              </FadeIn>
              <FadeIn delay={0.4} direction="left">
                <HoverCard
                  title="Data Center Growth"
                  icon={Zap}
                  description="Data center infrastructure grows at ~20% annually. From 5 ZB in 2010 to 180 ZB in 2025 — this growth demands a new thermal architecture."
                  stat="~20% / yr"
                />
              </FadeIn>
            </div>
          </div>
        </Section>

        {/* ── Scene 03: The Solution ── */}
        <Section className="items-center justify-start">
          <div className="pointer-events-auto max-w-2xl">
            <FadeIn delay={0.1} direction="right">
              <p className="text-[10px] md:text-xs tracking-[0.3em] text-[#0055ff] uppercase mb-6 border-b border-[#0055ff]/10 pb-4 inline-block font-medium">Thermal Resolution</p>
              <h2 className="text-5xl md:text-6xl font-display font-light tracking-tighter leading-[1.05] mb-10 text-neutral-900">
                Not just cooling.<br />
                <span className="text-neutral-500 italic font-serif tracking-normal">A stable environment<br />for evolution.</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.3} direction="right">
              <p className="text-lg md:text-xl text-neutral-600 font-light leading-relaxed mb-4">
                Purlina Matrix Core is a single-phase dielectric immersion cooling fluid for high-density computing. It doesn't merely carry heat — it stabilizes the processing environment.
              </p>
              <p className="text-base text-neutral-500 font-light leading-relaxed mb-12">
                Ultra-refined, aromatic-free, saturated hydrocarbon base. Electrically and chemically passive. Does not react, does not create conductivity, leaves no residue.
              </p>
            </FadeIn>

            {/* Key specs inline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {[
                { val: ">35 kV", label: "Dielectric Breakdown" },
                { val: ">10¹² Ω·m", label: "Electrical Resistivity" },
                { val: "<0.01", label: "Acid Number (mgKOH/g)" },
                { val: "~2.0 kJ/kgK", label: "Specific Heat Capacity" },
                { val: "~0.13 W/mK", label: "Thermal Conductivity" },
                { val: "240–265°C", label: "Flash Point" },
              ].map((s, i) => (
                <FadeIn key={i} delay={0.35 + i * 0.05} direction="up">
                  <div className="border border-black/5 p-5 rounded-2xl bg-white/60 backdrop-blur-md hover:bg-white hover:border-[#0055ff]/20 transition-all group">
                    <div className="text-lg font-display font-medium text-[#0055ff] mb-1">{s.val}</div>
                    <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium leading-tight">{s.label}</div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Scene 04: X Series ── */}
        <Section className="items-center justify-end">
          <div className="w-full md:w-[60%] pointer-events-auto md:ml-auto">
            <FadeIn delay={0.1} direction="left">
              <p className="text-[10px] md:text-xs tracking-[0.3em] text-[#0055ff] uppercase mb-6 border-b border-[#0055ff]/10 pb-4 inline-block font-medium">Product Series</p>
            </FadeIn>
            <FadeIn delay={0.2} direction="left">
              <h2 className="text-4xl md:text-6xl font-display font-light text-neutral-900 mb-8 tracking-tight">
                Three viscosity grades.<br />
                <span className="text-neutral-500 italic font-serif">One architecture.</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.3} direction="left">
              <p className="text-lg text-neutral-600 font-light leading-relaxed mb-8 max-w-xl">
                The X Series covers every thermal load profile — from maximum-fluidity GPU clusters to continuous 24/7 AI workloads under sustained thermal stress.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[
                { id: "X1", desc: "Maximum fluidity for GPU-dense systems. Highest heat transfer rate.", badge: "GPU Optimized" },
                { id: "X2", desc: "Balanced performance between heat transfer and service life.", badge: "Balanced" },
                { id: "X3", desc: "Built for 24/7 AI infrastructure under sustained thermal stress.", badge: "24/7 AI" },
              ].map((x, i) => (
                <FadeIn key={i} delay={0.4 + i * 0.1} direction="up">
                  <div className="border border-black/5 p-6 rounded-2xl bg-white/60 backdrop-blur-md hover:bg-white hover:border-[#0055ff]/20 transition-all group cursor-default h-full">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-4xl font-display font-light text-neutral-900 group-hover:text-[#0055ff] transition-colors">{x.id}</span>
                      <span className="text-[9px] uppercase tracking-widest text-[#0055ff] bg-[#0055ff]/5 px-2 py-1 rounded-full font-medium">{x.badge}</span>
                    </div>
                    <p className="text-neutral-500 text-xs leading-relaxed">{x.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.7} direction="left">
              <XSeriesTable />
            </FadeIn>
          </div>
        </Section>

        {/* ── Scene 05: Efficiency Numbers ── */}
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {[
                { val: "48%", label: "Energy Reduction" },
                { val: "33%", label: "TCO Decrease" },
                { val: "30%", label: "CO₂ Reduction" },
                { val: "80%", label: "Less Space" },
              ].map((s, i) => (
                <FadeIn key={i} delay={0.2 + i * 0.1} direction="up" className="h-full">
                  <div className="h-full border border-black/5 p-8 rounded-3xl bg-white/60 backdrop-blur-md flex flex-col items-center justify-center text-center group hover:bg-white transition-all duration-500 hover:border-[#0055ff]/20 px-4">
                    <div className="text-5xl md:text-6xl font-display font-light text-neutral-900 mb-6 group-hover:scale-110 group-hover:text-[#0055ff] transition-all duration-500 tracking-tighter">{s.val}</div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-widest text-neutral-500 font-medium">{s.label}</div>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* Pure vs AO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FadeIn delay={0.6} direction="left" className="h-full">
                <div className="h-full border border-black/5 p-8 rounded-3xl bg-white/60 backdrop-blur-md hover:bg-white/90 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-neutral-400" />
                    <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Pure Version</span>
                  </div>
                  <p className="text-neutral-600 text-sm font-light leading-relaxed">Additive-free formulation based on molecular transparency. Ideal for medium loads and short-duration operations.</p>
                </div>
              </FadeIn>
              <FadeIn delay={0.7} direction="right" className="h-full">
                <div className="h-full border border-[#0055ff]/10 p-8 rounded-3xl bg-white/80 backdrop-blur-md hover:bg-white transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <Layers className="w-5 h-5 text-[#0055ff]" />
                    <span className="text-xs uppercase tracking-widest text-[#0055ff] font-medium">AO Enhanced Version</span>
                  </div>
                  <p className="text-neutral-600 text-sm font-light leading-relaxed">Phenolic, aminic, or phosphite-based antioxidant systems. Suppresses oxidative chain reactions under continuous thermal cycling. Prevents viscosity change and deposit formation.</p>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.8} direction="up">
              <p className="text-center text-neutral-500 mt-12 text-sm max-w-2xl mx-auto font-light leading-relaxed">
                Compared to evaporative systems, water consumption can be reduced by up to 80% — establishing a radically sustainable baseline for hyperscale compute.
              </p>
            </FadeIn>
          </div>
        </Section>

        {/* ── Scene 06: Company + CTA ── */}
        <Section className="items-center justify-center text-center pb-0">
          <div className="pointer-events-auto flex flex-col items-center w-full max-w-5xl mx-auto">
            <FadeIn delay={0.1} direction="up">
              <p className="text-[10px] md:text-xs tracking-[0.3em] text-[#0055ff] uppercase mb-8 border-b border-[#0055ff]/10 pb-4 inline-block font-medium">By Alkim Petrokimya</p>
            </FadeIn>
            <FadeIn delay={0.2} direction="up">
              <h2 className="text-5xl md:text-7xl font-display font-light text-neutral-900 mb-8 tracking-tight">
                The stable environment<br />
                <span className="text-[#0055ff] italic font-serif">processing the future.</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.3} direction="up">
              <p className="text-lg text-neutral-600 font-light leading-relaxed max-w-2xl mb-16">
                Alkim Petrokimya — over 25 years in the chemical industry. 14,500 m² facilities in Istanbul Tuzla. 52,000 tons active stock. 270,000 tons/year trade volume.
              </p>
            </FadeIn>

            {/* Company stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mb-16">
              {[
                { val: "52,000 T", label: "Active Stock Capacity" },
                { val: "60+", label: "Tanker Distribution Fleet" },
                { val: "270,000 T", label: "Annual Trade Volume" },
                { val: "6", label: "Bonded Warehouses" },
              ].map((s, i) => (
                <FadeIn key={i} delay={0.4 + i * 0.1} direction="up">
                  <div className="border border-black/5 p-6 rounded-2xl bg-white/40 backdrop-blur-md text-center hover:bg-white/80 transition-colors">
                    <div className="text-2xl md:text-3xl font-display font-light text-[#0055ff] mb-2">{s.val}</div>
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium leading-tight">{s.label}</div>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.8} direction="up">
              <Magnetic>
                <a
                  href="mailto:satis@alkimpetrokimya.com"
                  className="group relative flex items-center justify-center gap-6 bg-black text-white pl-12 pr-4 py-4 rounded-full text-xl md:text-2xl font-display font-medium overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-xl"
                >
                  <span className="relative z-10 flex items-center gap-6">
                    Initialize Platform
                    <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/20">
                      <ArrowUpRight className="w-6 h-6 group-hover:rotate-45 transition-transform duration-300" />
                    </div>
                  </span>
                  <div className="absolute inset-0 w-full h-full bg-[#0055ff] transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out" />
                </a>
              </Magnetic>
            </FadeIn>
          </div>
        </Section>

      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-black/5 bg-white/30 backdrop-blur-md mt-24 px-6 lg:px-12 py-12 pointer-events-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="font-display font-medium text-neutral-900 mb-1">Purlina Matrix Core</div>
            <div className="text-xs text-neutral-400 font-light">ALKİM Petrokimya San. ve Tic. A.Ş.</div>
            <div className="text-xs text-neutral-400 font-light mt-1">Kimya Sanayicileri OSB, Aromatik Cd. No:61<br />34956 Aydınlı-KOSB / Tuzla / İstanbul</div>
          </div>
          <div className="flex flex-col gap-1">
            <a href="tel:+902165932461" className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors font-light">+90 (216) 593 24 61</a>
            <a href="tel:+905443959166" className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors font-light">+90 (544) 395 91 66</a>
            <a href="mailto:info@alkimpetrokimya.com" className="text-xs text-neutral-500 hover:text-[#0055ff] transition-colors font-light">info@alkimpetrokimya.com</a>
            <a href="mailto:satis@alkimpetrokimya.com" className="text-xs text-neutral-500 hover:text-[#0055ff] transition-colors font-light">satis@alkimpetrokimya.com</a>
          </div>
          <div className="text-xs text-neutral-400 font-light self-end">
            © 2026 Alkim Petrokimya
          </div>
        </div>
      </footer>
    </div>
  );
}
