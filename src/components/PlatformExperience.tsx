import { useEffect, useRef, useState, useCallback } from "react";
import Lenis from "lenis";
import { Canvas } from "@react-three/fiber";
import { motion, AnimatePresence } from "motion/react";
import FluidScene, { FluidSceneHandle } from "./FluidScene";
import Magnetic from "./Magnetic";
import { ArrowUpRight, Search } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SCENE_LABELS = [
  { id: "01", label: "The Infrastructure" },
  { id: "02", label: "The Bottleneck" },
  { id: "03", label: "Matrix Core" },
  { id: "04", label: "X Series" },
  { id: "05", label: "Proof" },
  { id: "06", label: "Initialize" },
];

// ─── Split text — word-by-word reveal ─────────────────────────────────────────
function SplitText({
  text,
  className = "",
  delay = 0,
  stagger = 0.04,
  inView = false,
  style = {},
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  inView?: boolean;
  style?: React.CSSProperties;
}) {
  const words = text.split(" ");
  return (
    <span className={className} style={style}>
      {words.map((word, wi) => (
        <span key={wi} style={{ display: "inline-block", overflow: "hidden", marginRight: "0.22em" }}>
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
function LiquidCursor() {
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
        ring.current.style.transform = `translate(${lag.current.x - 18}px,${lag.current.y - 18}px) scale(${hov.current ? 2.2 : 1})`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <div
        ref={dot}
        className="fixed top-0 left-0 w-[6px] h-[6px] rounded-full pointer-events-none z-[9999]"
        style={{ background: "#60a5fa" }}
      />
      <div
        ref={ring}
        className="fixed top-0 left-0 w-9 h-9 rounded-full border pointer-events-none z-[9998]"
        style={{
          borderColor: "rgba(96,165,250,0.35)",
          transition: "transform 0.15s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </>
  );
}

// ─── Loading screen — terminal init feel ──────────────────────────────────────
function Loader({ onDone }: { onDone: () => void }) {
  const [pct,  setPct]  = useState(0);
  const [exit, setExit] = useState(false);
  const [line, setLine] = useState(0);

  const initLines = [
    "INITIALIZING DIELECTRIC MATRIX",
    "LOADING THERMAL ENVIRONMENT",
    "CALIBRATING FLUID PARAMETERS",
    "SYSTEM READY",
  ];

  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v += Math.random() * 14 + 3;
      if (v >= 100) {
        v = 100;
        clearInterval(id);
        setTimeout(() => { setExit(true); setTimeout(onDone, 800); }, 600);
      }
      setPct(Math.floor(v));
      setLine(Math.floor((v / 100) * (initLines.length - 1)));
    }, 90);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[500] flex flex-col items-center justify-center"
          style={{ background: "#020812" }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16 text-center"
          >
            <div
              className="font-display text-white tracking-[0.55em] text-lg mb-2"
              style={{ letterSpacing: "0.55em" }}
            >
              PURLINA
            </div>
            <div
              className="font-display tracking-[0.3em] text-3xl"
              style={{ color: "#3b82f6" }}
            >
              MATRIX CORE
            </div>
          </motion.div>

          {/* Progress bar */}
          <div
            className="w-48 h-[1px] relative overflow-hidden mb-5"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{ background: "#3b82f6" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.08 }}
            />
          </div>

          {/* Terminal line */}
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans text-[10px] tracking-[0.4em] uppercase"
            style={{ color: "rgba(148,163,184,0.5)" }}
          >
            {initLines[line]} — {pct}%
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Scene navigation dots ─────────────────────────────────────────────────────
function SceneNav({ current, total }: { current: number; total: number }) {
  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ scale: i === current ? 1.6 : 1, opacity: i === current ? 1 : 0.25 }}
          transition={{ duration: 0.4 }}
          className="w-[4px] h-[4px] rounded-full"
          style={{ background: i === current ? "#60a5fa" : "#475569" }}
        />
      ))}
    </div>
  );
}

// ─── Scene 01: Hero ───────────────────────────────────────────────────────────
function SceneHero({ visible }: { visible: boolean }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="scene-num">01</div>

      <div className="overflow-hidden mb-10">
        <motion.div
          initial={{ y: "120%" }}
          animate={visible ? { y: "0%" } : { y: "120%" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="font-sans text-[10px] tracking-[0.55em] uppercase"
          style={{ color: "rgba(96,165,250,0.6)" }}
        >
          Dielectric Immersion Cooling Platform
        </motion.div>
      </div>

      <h1
        className="font-display leading-[0.88] tracking-tight mb-10 text-white"
        style={{ fontSize: "clamp(4rem, 14vw, 13rem)" }}
      >
        <SplitText text="PURLINA" inView={visible} delay={0.2} stagger={0.06} />
        <br />
        <SplitText
          text="MATRIX"
          inView={visible}
          delay={0.5}
          stagger={0.06}
          className="font-display"
        />
        <br />
        <SplitText
          text="CORE"
          inView={visible}
          delay={0.75}
          stagger={0.06}
          className="font-display"
        />
      </h1>

      <div className="overflow-hidden">
        <motion.p
          initial={{ y: "100%" }}
          animate={visible ? { y: "0%" } : { y: "100%" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 1.0 }}
          className="font-sans font-light text-base max-w-md leading-relaxed"
          style={{ color: "rgba(148,163,184,0.7)" }}
        >
          The stable environment in which processors operate.
          Not just cooling — a new thermal architecture.
        </motion.p>
      </div>

      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 1.6, duration: 1 }}
      >
        <motion.div
          animate={{ y: [0, 9, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span
            className="font-sans text-[9px] uppercase tracking-[0.5em]"
            style={{ color: "rgba(96,165,250,0.4)", writingMode: "vertical-rl" }}
          >
            Scroll
          </span>
          <div
            className="w-[1px] h-10"
            style={{ background: "linear-gradient(to bottom, rgba(96,165,250,0.3), transparent)" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Scene 02: Problem ────────────────────────────────────────────────────────
function SceneProblem({ visible }: { visible: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center px-8 md:px-16 lg:px-24">
      <div className="scene-num">02</div>
      <div className="max-w-xl ml-auto">
        <div className="overflow-hidden mb-8">
          <motion.div
            initial={{ y: "120%" }}
            animate={visible ? { y: "0%" } : { y: "120%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-[10px] tracking-[0.5em] uppercase"
            style={{ color: "rgba(96,165,250,0.5)" }}
          >
            Yeni Nesil Isı Yönetimi
          </motion.div>
        </div>

        <h2
          className="font-display leading-[0.9] mb-10 text-white"
          style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)" }}
        >
          <SplitText text="THE THIRD" inView={visible} delay={0.1} stagger={0.05} />
          <br />
          <SplitText
            text="PHASE."
            inView={visible}
            delay={0.3}
            stagger={0.05}
            className="font-display"
            style={{ color: "rgba(255,255,255,0.35)" }}
          />
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {[
            {
              num: "180 ZB",
              label: "Data Generated by 2025",
              sub: "AI clusters consume megawatts. Heat is now the bottleneck — not compute.",
            },
            {
              num: "20% /yr",
              label: "Data Center Infrastructure Growth",
              sub: "Conventional air cooling has reached its sustainability ceiling.",
            },
            {
              num: ">1000×",
              label: "Fluid vs Air Thermal Capacity",
              sub: "Immersion cooling is the natural evolution. PURLINA MATRIX CORE is the fluid.",
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 40 }}
              animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 + i * 0.15 }}
              className="flex gap-6 items-start rounded-2xl px-6 py-5 spec-card"
              style={{ border: "1px solid rgba(37,99,235,0.15)", background: "rgba(37,99,235,0.05)" }}
              data-cursor
            >
              <div className="font-display text-3xl shrink-0 text-white">{s.num}</div>
              <div>
                <div
                  className="font-sans text-[10px] uppercase tracking-widest mb-1.5"
                  style={{ color: "rgba(96,165,250,0.55)" }}
                >
                  {s.label}
                </div>
                <div
                  className="font-sans font-light text-xs leading-relaxed"
                  style={{ color: "rgba(148,163,184,0.55)" }}
                >
                  {s.sub}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Scene 03: Matrix Core ────────────────────────────────────────────────────
function SceneMatrix({ visible }: { visible: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center px-8 md:px-16 lg:px-24">
      <div className="scene-num">03</div>
      <div className="max-w-2xl">
        <div className="overflow-hidden mb-8">
          <motion.div
            initial={{ y: "120%" }}
            animate={visible ? { y: "0%" } : { y: "120%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-[10px] tracking-[0.5em] uppercase"
            style={{ color: "rgba(96,165,250,0.5)" }}
          >
            Termal Ortamın Yeniden Tasarlanması
          </motion.div>
        </div>

        <h2
          className="font-display leading-[0.9] mb-10 text-white"
          style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)" }}
        >
          <SplitText text="PURLINA" inView={visible} delay={0.1} stagger={0.05} />
          <br />
          <SplitText text="MATRIX" inView={visible} delay={0.25} stagger={0.05} />
          <br />
          <SplitText
            text="CORE"
            inView={visible}
            delay={0.4}
            stagger={0.05}
            className="font-display"
          />
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          className="font-sans font-light text-base leading-relaxed mb-10 max-w-lg"
          style={{ color: "rgba(148,163,184,0.65)" }}
        >
          Single-phase dielectric immersion fluid for AI data centers.
          Electrically inert. Chemically passive. Crystal-clear.
        </motion.p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { val: ">35 kV",   label: "Breakdown Voltage" },
            { val: "240°C",    label: "Flash Point" },
            { val: ">10¹² Ω", label: "Resistivity" },
            { val: "0.01",     label: "Acid Number" },
            { val: "~0°",      label: "Emulsion Formation" },
            { val: "L0.5",     label: "ASTM Colour" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.7 + i * 0.08 }}
              className="rounded-xl p-4 text-center spec-card"
              style={{ border: "1px solid rgba(37,99,235,0.18)", background: "rgba(37,99,235,0.06)" }}
              data-cursor
            >
              <div className="font-display text-xl mb-1 text-white">{s.val}</div>
              <div
                className="font-sans text-[9px] uppercase tracking-widest"
                style={{ color: "rgba(96,165,250,0.5)" }}
              >
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Scene 04: X Series ───────────────────────────────────────────────────────
function SceneXSeries({ visible }: { visible: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center justify-end px-8 md:px-16 lg:px-24">
      <div className="scene-num">04</div>
      <div className="max-w-lg">
        <div className="overflow-hidden mb-8">
          <motion.div
            initial={{ y: "120%" }}
            animate={visible ? { y: "0%" } : { y: "120%" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-[10px] tracking-[0.5em] uppercase"
            style={{ color: "rgba(96,165,250,0.5)" }}
          >
            Viskozite Segmentleri
          </motion.div>
        </div>

        <h2
          className="font-display leading-[0.9] mb-8 text-white"
          style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)" }}
        >
          <SplitText text="THREE" inView={visible} delay={0.1} stagger={0.05} />
          <br />
          <SplitText text="THERMAL" inView={visible} delay={0.3} stagger={0.05} />
          <br />
          <SplitText text="PROFILES." inView={visible} delay={0.5} stagger={0.05} />
        </h2>

        <div className="space-y-4">
          {[
            {
              id: "X1",
              title: "Maximum Fluidity",
              desc: "GPU-dense systems. Lowest viscosity, maximum heat transfer rate.",
              vis: "34.8 mm²/s @ 40°C",
            },
            {
              id: "X2",
              title: "Balanced Performance",
              desc: "Heat transfer vs service life equilibrium. General deployment.",
              vis: "9.19 mm²/s @ 40°C",
            },
            {
              id: "X3",
              title: "24/7 AI Infrastructure",
              desc: "Continuous high thermal stress. Extended service cycle.",
              vis: "19.7 mm²/s @ 40°C",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.6 + i * 0.14 }}
              className="flex items-start gap-5 rounded-2xl px-6 py-5 spec-card"
              style={{ border: "1px solid rgba(37,99,235,0.15)", background: "rgba(37,99,235,0.05)" }}
              data-cursor
            >
              <div
                className="font-display text-3xl shrink-0 w-12"
                style={{ color: "#3b82f6" }}
              >
                {item.id}
              </div>
              <div>
                <div className="font-sans font-medium text-sm text-white mb-1">{item.title}</div>
                <div
                  className="font-sans font-light text-xs leading-relaxed mb-2"
                  style={{ color: "rgba(148,163,184,0.55)" }}
                >
                  {item.desc}
                </div>
                <div
                  className="font-sans text-[10px] tracking-widest"
                  style={{ color: "rgba(96,165,250,0.45)" }}
                >
                  {item.vis}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Scene 05: Proof ──────────────────────────────────────────────────────────
function SceneProof({ visible }: { visible: boolean }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="scene-num">05</div>

      <div className="overflow-hidden mb-8">
        <motion.div
          initial={{ y: "120%" }}
          animate={visible ? { y: "0%" } : { y: "120%" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans text-[10px] tracking-[0.5em] uppercase"
          style={{ color: "rgba(96,165,250,0.5)" }}
        >
          Enerji ve Su Verimliliği
        </motion.div>
      </div>

      <h2
        className="font-display leading-[0.9] mb-12 text-white"
        style={{ fontSize: "clamp(3rem, 9vw, 8rem)" }}
      >
        <SplitText text="THE" inView={visible} delay={0.1} stagger={0.06} />
        <br />
        <SplitText text="NUMBERS." inView={visible} delay={0.25} stagger={0.06} />
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
        {[
          { val: "48%",  label: "Energy Reduction" },
          { val: "33%",  label: "TCO Decrease" },
          { val: "80%",  label: "Space Savings" },
          { val: "30%",  label: "CO₂ Reduction" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.12 }}
            className="rounded-2xl p-6 md:p-8 spec-card"
            style={{ border: "1px solid rgba(37,99,235,0.18)", background: "rgba(37,99,235,0.06)" }}
            data-cursor
          >
            <div
              className="font-display mb-3 text-white"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              {s.val}
            </div>
            <div
              className="font-sans text-[10px] uppercase tracking-widest"
              style={{ color: "rgba(96,165,250,0.5)" }}
            >
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={visible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 0.9, duration: 1 }}
        className="font-sans font-light text-sm max-w-md mt-10 leading-relaxed"
        style={{ color: "rgba(148,163,184,0.5)" }}
      >
        vs. evaporative systems — up to 80% water savings.
        Compatible with AI clusters, HPC centers, blockchain mining, edge AI.
      </motion.p>
    </div>
  );
}

// ─── Scene 06: CTA ────────────────────────────────────────────────────────────
function SceneCTA({ visible }: { visible: boolean }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="scene-num">06</div>

      <div className="overflow-hidden mb-8">
        <motion.div
          initial={{ y: "120%" }}
          animate={visible ? { y: "0%" } : { y: "120%" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans text-[10px] tracking-[0.5em] uppercase"
          style={{ color: "rgba(96,165,250,0.5)" }}
        >
          By Alkim Petrokimya
        </motion.div>
      </div>

      <h2
        className="font-display leading-[0.9] mb-10 text-white"
        style={{ fontSize: "clamp(3rem, 10vw, 9rem)" }}
      >
        <SplitText text="INITIALIZE" inView={visible} delay={0.1} stagger={0.05} />
        <br />
        <SplitText text="MATRIX" inView={visible} delay={0.35} stagger={0.05} />
      </h2>

      {/* Sector search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
        className="relative w-full max-w-md mb-8"
      >
        <input
          type="text"
          placeholder="Enter your sector or use case..."
          className="w-full rounded-full px-7 py-4 pr-16 font-sans text-sm outline-none"
          style={{
            background: "rgba(37,99,235,0.08)",
            border: "1px solid rgba(37,99,235,0.25)",
            color: "#e2e8f0",
          }}
        />
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: "#2563eb" }}
        >
          <Search className="w-4 h-4 text-white" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
      >
        <Magnetic>
          <a
            href="mailto:satis@alkimpetrokimya.com"
            className="group relative flex items-center gap-5 rounded-full pl-8 pr-3 py-3 font-sans font-medium"
            style={{ border: "1px solid rgba(37,99,235,0.3)", color: "rgba(255,255,255,0.85)" }}
            data-cursor
          >
            <span className="relative z-10 text-sm uppercase tracking-wider">Initialize Platform</span>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center z-10"
              style={{ border: "1px solid rgba(37,99,235,0.3)" }}
            >
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

  const currentScene  = useRef(0);
  const sceneProgress = useRef(0);

  const panelRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const onLoaded = useCallback(() => {
    setLoaded(true);
    setSceneVisible(true);
  }, []);

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    const raf = (t: number) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    window.scrollTo(0, 0);
    return () => lenis.destroy();
  }, []);

  // Scroll → scene detection
  useEffect(() => {
    if (!loaded) return;
    const onScroll = () => {
      const panels  = panelRefs.current;
      const scrollY = window.scrollY;
      const winH    = window.innerHeight;

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
          const sceneH = el.offsetHeight;
          const prog   = Math.min(Math.max((scrollY - top) / sceneH, 0), 1);
          currentScene.current  = i + prog;
          sceneProgress.current = prog;
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [loaded, activeScene]);

  const sceneComponents = [
    <SceneHero    key={0} visible={sceneVisible && activeScene === 0} />,
    <SceneProblem key={1} visible={sceneVisible && activeScene === 1} />,
    <SceneMatrix  key={2} visible={sceneVisible && activeScene === 2} />,
    <SceneXSeries key={3} visible={sceneVisible && activeScene === 3} />,
    <SceneProof   key={4} visible={sceneVisible && activeScene === 4} />,
    <SceneCTA     key={5} visible={sceneVisible && activeScene === 5} />,
  ];

  return (
    <div
      ref={containerRef}
      className="grain relative font-sans overflow-x-hidden min-h-screen"
      style={{ background: "#020812" }}
    >
      <LiquidCursor />
      <Loader onDone={onLoaded} />

      {/* Navbar — mix-blend-difference for auto light/dark */}
      <nav className="fixed top-0 w-full z-50 px-8 md:px-14 py-7 pointer-events-none mix-blend-difference">
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-white tracking-[0.35em] text-sm"
          >
            PURLINA
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ delay: 0.5 }}
            className="font-sans text-white/50 text-[10px] tracking-[0.4em] uppercase"
          >
            {SCENE_LABELS[activeScene]?.label}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ delay: 0.6 }}
            className="font-sans text-white/30 text-[10px] tracking-[0.3em] uppercase"
          >
            MATRIX CORE
          </motion.div>
        </div>
      </nav>

      {/* Scene nav dots */}
      {loaded && <SceneNav current={activeScene} total={SCENE_LABELS.length} />}

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

      {/* Scene panels */}
      <div className="relative z-10 pointer-events-none">
        {sceneComponents.map((scene, i) => (
          <div
            key={i}
            ref={(el) => { panelRefs.current[i] = el; }}
            className="relative w-full pointer-events-auto"
            style={{ height: "100vh" }}
          >
            <AnimatePresence mode="wait">
              {activeScene === i && (
                <motion.div
                  key={`scene-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  {scene}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer
        className="relative z-10 px-8 lg:px-14 py-10 pointer-events-auto"
        style={{ borderTop: "1px solid rgba(37,99,235,0.12)", background: "#020812" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-4 items-center">
          <div
            className="font-display tracking-[0.3em] text-sm text-white"
          >
            PURLINA MATRIX CORE
          </div>
          <div
            className="font-sans text-xs tracking-widest uppercase"
            style={{ color: "rgba(148,163,184,0.35)" }}
          >
            © 2026 Alkim Petrokimya
          </div>
          <div
            className="font-sans text-xs"
            style={{ color: "rgba(148,163,184,0.35)" }}
          >
            Tuzla, İstanbul
          </div>
        </div>
      </footer>
    </div>
  );
}
