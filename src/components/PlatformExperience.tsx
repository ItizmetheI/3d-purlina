import { useEffect, useRef, useState, useCallback } from "react";
import Lenis from "lenis";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "motion/react";
import FluidScene, { FluidSceneHandle } from "./FluidScene";
import Magnetic from "./Magnetic";
import { ArrowUpRight, Search } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SCENES = [
  { id: "01", label: "The Invisible Layer" },
  { id: "02", label: "The Bottleneck" },
  { id: "03", label: "Matrix Core" },
  { id: "04", label: "Collector" },
  { id: "05", label: "Proof" },
  { id: "06", label: "Initialize" },
];

// ─── Split text utility ───────────────────────────────────────────────────────
function SplitText({ text, className = "", delay = 0, stagger = 0.04, inView = false }: {
  text: string; className?: string; delay?: number; stagger?: number; inView?: boolean;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, wi) => (
        <span key={wi} style={{ display: "inline-block", overflow: "hidden", marginRight: "0.25em" }}>
          <motion.span
            style={{ display: "inline-block" }}
            initial={{ y: "110%" }}
            animate={inView ? { y: "0%" } : { y: "110%" }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: delay + wi * stagger }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// ─── Liquid cursor ────────────────────────────────────────────────────────────
function LiquidCursor({ darkMode }: { darkMode: boolean }) {
  const dot  = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const pos  = useRef({ x: 0, y: 0 });
  const lag  = useRef({ x: 0, y: 0 });
  const hov  = useRef(false);

  useEffect(() => {
    let raf: number;
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      const t = e.target as HTMLElement;
      hov.current = !!(t.closest("button") || t.closest("a") || t.closest("[data-cursor]"));
    };
    const tick = () => {
      lag.current.x += (pos.current.x - lag.current.x) * 0.1;
      lag.current.y += (pos.current.y - lag.current.y) * 0.1;
      if (dot.current)
        dot.current.style.transform = `translate(${pos.current.x - 3}px,${pos.current.y - 3}px)`;
      if (ring.current)
        ring.current.style.transform = `translate(${lag.current.x - 18}px,${lag.current.y - 18}px) scale(${hov.current ? 2.4 : 1})`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  const c = darkMode ? "#ffffff" : "#111111";
  return (
    <>
      <div ref={dot} className="fixed top-0 left-0 w-[6px] h-[6px] rounded-full pointer-events-none z-[9999]"
        style={{ background: c, transition: "background 0.4s" }} />
      <div ref={ring} className="fixed top-0 left-0 w-9 h-9 rounded-full border pointer-events-none z-[9998]"
        style={{ borderColor: `${c}40`, transition: "background 0.4s, border-color 0.4s, transform 0.15s cubic-bezier(0.16,1,0.3,1)" }} />
    </>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function Loader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v += Math.random() * 15 + 3;
      if (v >= 100) {
        v = 100; clearInterval(id);
        setTimeout(() => { setExit(true); setTimeout(onDone, 800); }, 500);
      }
      setPct(Math.floor(v));
    }, 80);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[500] bg-white flex flex-col items-center justify-center"
        >
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-black tracking-[0.6em] text-sm mb-14 select-none">
            PURLINA MATRIX
          </motion.div>
          <div className="w-44 h-[1px] bg-black/10 relative overflow-hidden mb-5">
            <motion.div className="absolute inset-y-0 left-0 bg-black"
              animate={{ width: `${pct}%` }} transition={{ duration: 0.08 }} />
          </div>
          <p className="font-sans text-black/30 text-[10px] tracking-[0.4em] uppercase">
            Initializing — {pct}%
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────
function SceneNav({ current, total, dark }: { current: number; total: number; dark: boolean }) {
  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div key={i}
          animate={{ scale: i === current ? 1.6 : 1, opacity: i === current ? 1 : 0.3 }}
          transition={{ duration: 0.4 }}
          className="w-[5px] h-[5px] rounded-full"
          style={{ background: dark ? "#fff" : "#111" }}
        />
      ))}
    </div>
  );
}

// ─── Scene panels ─────────────────────────────────────────────────────────────
// Each scene: pinned, fills viewport, text choreographed
function SceneHero({ visible, dark }: { visible: boolean; dark: boolean }) {
  const c = dark ? "text-white" : "text-black";
  const cs = dark ? "text-white/40" : "text-black/35";
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="scene-num" style={{ color: dark ? "#fff" : "#000" }}>01</div>
      <div className={`font-sans text-[10px] tracking-[0.5em] uppercase mb-10 overflow-hidden ${cs}`}>
        <motion.span style={{ display: "block" }}
          initial={{ y: "120%" }} animate={visible ? { y: "0%" } : { y: "120%" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}>
          Invisible Infrastructure Layer
        </motion.span>
      </div>
      <h1 className={`font-display leading-[0.88] tracking-tight mb-10 ${c}`}
        style={{ fontSize: "clamp(4rem, 14vw, 13rem)" }}>
        <SplitText text="PURLINA" inView={visible} delay={0.2} stagger={0.06} />
        <br />
        <SplitText text="MATRIX" inView={visible} delay={0.5} stagger={0.06} className="opacity-40" />
      </h1>
      <div className={`font-sans font-light text-base md:text-lg max-w-md leading-relaxed overflow-hidden ${cs}`}>
        <motion.span style={{ display: "block" }}
          initial={{ y: "100%" }} animate={visible ? { y: "0%" } : { y: "100%" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}>
          The platform layer invisible to the eye, essential to industry.
        </motion.span>
      </div>
      <motion.div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }} animate={visible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 1.4, duration: 1 }}>
        <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2">
          <span className={`font-sans text-[9px] uppercase tracking-[0.5em] ${cs}`}
            style={{ writingMode: "vertical-rl" }}>Scroll</span>
          <div className={`w-[1px] h-10 bg-gradient-to-b ${dark ? "from-white/30" : "from-black/30"} to-transparent`} />
        </motion.div>
      </motion.div>
    </div>
  );
}

function SceneProblem({ visible, dark }: { visible: boolean; dark: boolean }) {
  const c  = dark ? "text-white"    : "text-black";
  const cs = dark ? "text-white/40" : "text-black/40";
  const cb = dark ? "border-white/8" : "border-black/8";
  const bg = dark ? "bg-white/5"    : "bg-black/3";

  return (
    <div className="relative w-full h-full flex items-center px-8 md:px-16 lg:px-24">
      <div className="scene-num" style={{ color: dark ? "#fff" : "#000" }}>02</div>
      <div className="max-w-xl ml-auto">
        <div className={`font-sans text-[10px] tracking-[0.5em] uppercase mb-8 overflow-hidden ${cs}`}>
          <motion.span style={{ display: "block" }}
            initial={{ y: "120%" }} animate={visible ? { y: "0%" } : { y: "120%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            The Bottleneck
          </motion.span>
        </div>
        <h2 className={`font-display leading-[0.9] mb-10 ${c}`}
          style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)" }}>
          <SplitText text="THE WORLD" inView={visible} delay={0.1} stagger={0.05} />
          <br />
          <SplitText text="IS CHANGING." inView={visible} delay={0.3} stagger={0.05} className="opacity-40" />
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {[
            { num: "180 ZB", label: "Data generated by 2025", sub: "AI infrastructure heat output is reaching megawatt scale. Conventional cooling has hit its ceiling." },
            { num: "20% /yr", label: "Data center growth", sub: "Every rack, every GPU, every AI workload demands a new thermal architecture." },
            { num: "900+", label: "Industrial sectors affected", sub: "Hydrophobic pollutants silently contaminate water across every major industry." },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: 40 }} animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 + i * 0.15 }}
              className={`flex gap-6 items-start border rounded-2xl px-6 py-5 ${cb} ${bg}`}
              data-cursor>
              <div className={`font-display text-3xl shrink-0 ${c}`}>{s.num}</div>
              <div>
                <div className={`font-sans text-[10px] uppercase tracking-widest mb-1.5 ${cs}`}>{s.label}</div>
                <div className={`font-sans font-light text-xs leading-relaxed ${cs}`}>{s.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneMatrix({ visible, dark }: { visible: boolean; dark: boolean }) {
  const c  = dark ? "text-white"    : "text-black";
  const cs = dark ? "text-white/40" : "text-black/40";
  const cb = dark ? "border-white/8" : "border-black/8";
  const bg = dark ? "bg-white/5"    : "bg-black/3";

  return (
    <div className="relative w-full h-full flex items-center px-8 md:px-16 lg:px-24">
      <div className="scene-num" style={{ color: dark ? "#fff" : "#000" }}>03</div>
      <div className="max-w-2xl">
        <div className={`font-sans text-[10px] tracking-[0.5em] uppercase mb-8 overflow-hidden ${cs}`}>
          <motion.span style={{ display: "block" }}
            initial={{ y: "120%" }} animate={visible ? { y: "0%" } : { y: "120%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            Thermal Resolution
          </motion.span>
        </div>
        <h2 className={`font-display leading-[0.9] mb-10 ${c}`}
          style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)" }}>
          <SplitText text="PURLINA" inView={visible} delay={0.1} stagger={0.05} />
          <br />
          <SplitText text="MATRIX" inView={visible} delay={0.25} stagger={0.05} />
          <br />
          <SplitText text="CORE" inView={visible} delay={0.4} stagger={0.05} className="opacity-40" />
        </h2>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          className={`font-sans font-light text-base leading-relaxed mb-10 max-w-lg ${cs}`}>
          Single-phase dielectric immersion fluid. Not just cooling — a stable environment for AI infrastructure evolution.
        </motion.p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { val: ">35 kV", label: "Dielectric Breakdown" },
            { val: "240°C", label: "Flash Point" },
            { val: ">10¹²", label: "Resistivity Ω·m" },
            { val: "X1", label: "Max Fluidity" },
            { val: "X2", label: "Balanced Load" },
            { val: "X3", label: "24/7 AI" },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.9 }} animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.7 + i * 0.08 }}
              className={`border rounded-xl p-4 text-center ${cb} ${bg} hover:border-opacity-40 transition-all`}
              data-cursor>
              <div className={`font-display text-xl mb-1 ${c}`}>{s.val}</div>
              <div className={`font-sans text-[9px] uppercase tracking-widest ${cs}`}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneCollector({ visible, dark }: { visible: boolean; dark: boolean }) {
  const c  = dark ? "text-white"    : "text-black";
  const cs = dark ? "text-white/40" : "text-black/40";
  const cb = dark ? "border-white/10" : "border-black/8";

  return (
    <div className="relative w-full h-full flex items-center justify-end px-8 md:px-16 lg:px-24">
      <div className="scene-num" style={{ color: dark ? "#fff" : "#000" }}>04</div>
      <div className="max-w-lg">
        <div className={`font-sans text-[10px] tracking-[0.5em] uppercase mb-8 overflow-hidden ${cs}`}>
          <motion.span style={{ display: "block" }}
            initial={{ y: "120%" }} animate={visible ? { y: "0%" } : { y: "120%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            Hydrophobic Collector
          </motion.span>
        </div>
        <h2 className={`font-display leading-[0.9] mb-8 ${c}`}
          style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)" }}>
          <SplitText text="KIRLETICI" inView={visible} delay={0.1} stagger={0.05} />
          <br />
          <SplitText text="FAZINDA" inView={visible} delay={0.3} stagger={0.05} />
          <br />
          <SplitText text="TOPLANIR." inView={visible} delay={0.5} stagger={0.05} className="opacity-40" />
        </h2>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
          className={`font-sans font-light text-sm leading-relaxed mb-10 ${cs}`}>
          Hydrophobic organic pollutants in rivers, dams, and wastewater are physically captured into the Purlina phase. No emulsion. No VOCs. No water reaction.
        </motion.p>

        <div className="space-y-4">
          {[
            { label: "Suya Karışmaz",            desc: "Insoluble in water, no reaction" },
            { label: "Emülsiyon Oluşturmaz",      desc: "Zero emulsion formation" },
            { label: "VOC İçermez",               desc: "Aromatic-free, sulfur-free" },
            { label: "İnert, Yüksek Saflıklı",   desc: "Stable structure, high purity" },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -30 }} animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.8 + i * 0.12 }}
              className={`flex items-center gap-4 border-b pb-3 ${cb}`}>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0`}
                style={{ background: "#c8860a" }} />
              <div>
                <div className={`font-sans font-medium text-xs tracking-wide ${c}`}>{item.label}</div>
                <div className={`font-sans font-light text-[11px] ${cs}`}>{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneProof({ visible, dark }: { visible: boolean; dark: boolean }) {
  const c  = dark ? "text-white"    : "text-black";
  const cs = dark ? "text-white/40" : "text-black/40";
  const cb = dark ? "border-white/8" : "border-black/8";
  const bg = dark ? "bg-white/5"    : "bg-black/3";

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="scene-num" style={{ color: dark ? "#fff" : "#000" }}>05</div>
      <div className={`font-sans text-[10px] tracking-[0.5em] uppercase mb-8 overflow-hidden ${cs}`}>
        <motion.span style={{ display: "block" }}
          initial={{ y: "120%" }} animate={visible ? { y: "0%" } : { y: "120%" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          Efficiency Proof
        </motion.span>
      </div>
      <h2 className={`font-display leading-[0.9] mb-12 ${c}`}
        style={{ fontSize: "clamp(3rem, 9vw, 8rem)" }}>
        <SplitText text="THE ATLAS" inView={visible} delay={0.1} stagger={0.06} />
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
        {[
          { val: "48%",  label: "Energy Reduction" },
          { val: "33%",  label: "TCO Decrease" },
          { val: "80%",  label: "Less Space" },
          { val: "30%",  label: "CO₂ Reduction" },
        ].map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 40 }} animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.12 }}
            className={`border rounded-2xl p-6 md:p-8 ${cb} ${bg} hover:border-opacity-50 transition-all`}
            data-cursor>
            <div className={`font-display mb-3 ${c}`} style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
              {s.val}
            </div>
            <div className={`font-sans text-[10px] uppercase tracking-widest ${cs}`}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={visible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.9, duration: 1 }}
        className={`font-sans font-light text-sm max-w-md mt-10 leading-relaxed ${cs}`}>
        vs. evaporative systems — up to 80% less water consumption, establishing a sustainable baseline for hyperscale compute.
      </motion.div>
    </div>
  );
}

function SceneCTA({ visible, dark }: { visible: boolean; dark: boolean }) {
  const c  = dark ? "text-white"    : "text-black";
  const cs = dark ? "text-white/40" : "text-black/40";

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="scene-num" style={{ color: dark ? "#fff" : "#000" }}>06</div>
      <div className={`font-sans text-[10px] tracking-[0.5em] uppercase mb-8 overflow-hidden ${cs}`}>
        <motion.span style={{ display: "block" }}
          initial={{ y: "120%" }} animate={visible ? { y: "0%" } : { y: "120%" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          By Alkim Petrokimya
        </motion.span>
      </div>
      <h2 className={`font-display leading-[0.9] mb-10 ${c}`}
        style={{ fontSize: "clamp(3rem, 10vw, 9rem)" }}>
        <SplitText text="INITIALIZE" inView={visible} delay={0.1} stagger={0.05} />
        <br />
        <SplitText text="MATRIX" inView={visible} delay={0.35} stagger={0.05} className="opacity-40" />
      </h2>

      {/* Search CTA */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
        className="relative w-full max-w-md mb-8">
        <input type="text" placeholder="Enter your sector..."
          className={`w-full rounded-full px-7 py-4 pr-16 font-sans text-sm outline-none transition-all duration-400 ${dark ? "bg-white/8 border border-white/15 text-white placeholder:text-white/25 focus:border-white/35" : "bg-black/5 border border-black/10 text-black placeholder:text-black/30 focus:border-black/30"}`} />
        <button className={`absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-colors ${dark ? "bg-white hover:bg-white/90" : "bg-black hover:bg-black/80"}`}>
          <Search className={`w-4 h-4 ${dark ? "text-black" : "text-white"}`} />
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}>
        <Magnetic>
          <a href="mailto:satis@alkimpetrokimya.com"
            className={`group relative flex items-center gap-5 rounded-full pl-8 pr-3 py-3 font-sans font-medium overflow-hidden transition-all duration-500 border ${dark ? "border-white/15 text-white hover:border-white/35" : "border-black/15 text-black hover:border-black/30"}`}
            data-cursor>
            <span className="relative z-10 text-sm uppercase tracking-wider">Initialize Platform</span>
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center z-10 ${dark ? "border-white/15" : "border-black/15"}`}>
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-400" />
            </div>
          </a>
        </Magnetic>
      </motion.div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PlatformExperience() {
  const [loaded,       setLoaded]       = useState(false);
  const [activeScene,  setActiveScene]  = useState(0);
  const [sceneVisible, setSceneVisible] = useState(false);
  const [dark,         setDark]         = useState(false);

  // R3F scene refs — no re-renders
  const currentScene  = useRef(0);
  const sceneProgress = useRef(0);

  // One div per scene, stacked
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const onLoaded = useCallback(() => {
    setLoaded(true);
    setSceneVisible(true);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;
    const raf = (t: number) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    window.scrollTo(0, 0);
    return () => lenis.destroy();
  }, []);

  // Scroll → scene detection
  useEffect(() => {
    if (!loaded) return;

    const onScroll = () => {
      const panels = panelRefs.current;
      const scrollY = window.scrollY;
      const winH = window.innerHeight;

      for (let i = panels.length - 1; i >= 0; i--) {
        const el = panels[i];
        if (!el) continue;
        const top = el.offsetTop;
        if (scrollY >= top - winH * 0.4) {
          if (activeScene !== i) {
            setActiveScene(i);
            setSceneVisible(false);
            setTimeout(() => setSceneVisible(true), 60);
          }
          // Progress within this scene
          const sceneH = el.offsetHeight;
          const prog = Math.min(Math.max((scrollY - top) / sceneH, 0), 1);
          currentScene.current = i + prog;
          sceneProgress.current = prog;

          // Dark mode: scenes 3+ are dark
          setDark(i >= 3);
          break;
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [loaded, activeScene]);

  // BG color synced to dark state
  const bgClass = dark ? "bg-black" : "bg-white";

  const sceneComponents = [
    <SceneHero      key={0} visible={sceneVisible && activeScene === 0} dark={dark} />,
    <SceneProblem   key={1} visible={sceneVisible && activeScene === 1} dark={dark} />,
    <SceneMatrix    key={2} visible={sceneVisible && activeScene === 2} dark={dark} />,
    <SceneCollector key={3} visible={sceneVisible && activeScene === 3} dark={dark} />,
    <SceneProof     key={4} visible={sceneVisible && activeScene === 4} dark={dark} />,
    <SceneCTA       key={5} visible={sceneVisible && activeScene === 5} dark={dark} />,
  ];

  return (
    <div ref={containerRef}
      className={`grain relative font-sans overflow-x-hidden min-h-screen transition-colors duration-1000 ${bgClass}`}>
      <LiquidCursor darkMode={dark} />
      <Loader onDone={onLoaded} />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-8 md:px-14 py-7 pointer-events-none mix-blend-difference">
        <div className="flex justify-between items-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-white tracking-[0.35em] text-sm">
            PURLINA
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ delay: 0.5 }}
            className="font-sans text-white/50 text-[10px] tracking-[0.4em] uppercase">
            {SCENES[activeScene]?.label}
          </motion.div>
        </div>
      </nav>

      {/* Scene nav dots */}
      {loaded && <SceneNav current={activeScene} total={SCENES.length} dark={dark} />}

      {/* 3D Canvas — fixed, full viewport */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 14], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: "default", antialias: false, alpha: false }}
          eventSource={document.body}
          eventPrefix="client"
        >
          <FluidScene currentScene={currentScene} sceneProgress={sceneProgress} />
        </Canvas>
      </div>

      {/* Scene panels — tall enough to scroll through each */}
      <div className="relative z-10 pointer-events-none">
        {sceneComponents.map((scene, i) => (
          <div
            key={i}
            ref={el => { panelRefs.current[i] = el; }}
            className="relative w-full pointer-events-auto"
            style={{ height: "100vh" }}
          >
            <AnimatePresence mode="wait">
              {activeScene === i && (
                <motion.div key={`scene-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0">
                  {scene}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className={`relative z-10 border-t px-8 lg:px-14 py-10 pointer-events-auto transition-colors duration-1000 ${dark ? "border-white/8 bg-black text-white/30" : "border-black/8 bg-white text-black/30"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-4 items-center">
          <div className="font-display tracking-[0.3em] text-sm" style={{ color: dark ? "#fff" : "#111" }}>PURLINA MATRIX</div>
          <div className="font-sans text-xs tracking-widest uppercase">© 2026 Alkim Petrokimya</div>
          <div className="font-sans text-xs">Tuzla, İstanbul</div>
        </div>
      </footer>
    </div>
  );
}
