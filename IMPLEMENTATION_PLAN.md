# Purlina Platform - Conceptual Architecture & Implementation Plan

## 1. Core Paradigm Shift
We are abandoning the "standard website" format. Purlina will be designed as an **Experimental Cinematic Universe / Atlas**. It acts as an interactive documentary that reveals the "invisible infrastructure layer" running underneath modern industries (AI Data Centers & Environmental Water Treatment).

**Vibe:** Premium, immersive, highly technical yet accessible. A blend of Apple's hardware showcases, Notion's clean typography, and Loewe's editorial pacing.

## 2. Motion & Sensory Bible
Before building components, we define the physics of this universe:
- **Hover Reveal:** Information is hidden by default. Hovering over abstract 3D elements or text nodes reveals data (e.g., technical specs, thermal capacities).
- **Immersive Scroll (Scrollytelling):** The user does not scroll down a page; they move the camera *deeper* into the fluid/matrix.
- **Micro-interactions:** Magnetic buttons (already partially implemented), liquid cursor trails, fluid inertia on scroll.
- **Visuals:** High-contrast minimalist typography (Space Grotesk + Inter) over deep, immersive 3D liquid environments.

## 3. Scene Architecture (Story World Option)

### Scene 01: The Invisible Layer (Curiosity)
* **Visual:** A completely black or deep dark blue screen. A single, hyper-realistic, slow-moving liquid droplet (representing both the dielectric fluid and clean water) floats in the center.
* **Interaction:** As the user moves the mouse, the droplet slightly distorts (Liquid cursor effect).
* **Copy:** "The invisible infrastructure layer." (Fade in gently).
* **Scroll Action:** The droplet expands massively, engulfing the camera, transitioning to Scene 02.

### Scene 02: What is Changing in This World? (Recognition)
* **Visual:** Split narrative or a morphing landscape. We establish the two massive problems Purlina solves:
    1. The exploding heat of AI (Megawatt data centers, 180 zettabytes by 2025).
    2. Environmental pollution (Hydrophobic organic pollutants in water).
* **Interaction:** Parallax storytelling. Numbers floating in 3D space.

### Scene 03: PURLINA MATRIX CORE - Thermal Revolution (Trust / Solution 1)
* **Visual:** An exploding 3D view of a server rack submerged in the Matrix Core dielectric fluid. 
* **Interaction:** Scroll-based film. As you scroll, the server components separate. 
* **Hover:** Hovering over the fluid reveals its properties: `>35 kV Dielectric Breakdown`, `Single-phase`, `Zero water loss`.
* **Details:** Highlight the X1, X2, X3 series using a horizontal "Columns slider" or segmented control.

### Scene 04: PURLINA HYDROPHOBIC COLLECTOR - Water Purity (Solution 2)
* **Visual:** A macroscopic view of contaminated water. As Purlina is introduced, dark particles (pollutants) are magnetically drawn into a golden/amber fluid phase (the Collector Matrix), leaving the surrounding water crystal clear.
* **Interaction:** "X-ray mode" or "Before/After slider" controlled by mouse position. 
* **Details:** Non-reactive, insoluble in water, zero VOCs.

### Scene 05: The Efficiency Proof (Transformation)
* **Visual:** A clean, data-driven dashboard layout (The Atlas).
* **Interaction:** Bento morphing cards showing the massive gains: `Up to 48% energy reduction`, `80% less space`, `33% TCO decrease`.

### Scene 06: Initialization (Decision / CTA)
* **Visual:** The environment fades back out to a minimalistic, highly premium interface.
* **Interaction:** Magnetic, inertia-based CTA button. "Initialize Platform" or "Explore the Matrix".

## 4. Technical Implementation Phases

**Phase 1: Foundation & Typography**
- Rip out the old standard layout.
- Setup layout wrappers for continuous scrolling.
- Establish the new premium typography system (editorial style).

**Phase 2: Global 3D Context (The Fluid)**
- Rework the WebGL/Three.js context to act as a global background that morphs based on scroll position rather than being a localized object.
- Implement the "Dielectric Fluid" (Dark/Blue) and "Hydrophobic Phase" (Amber/Clear) shaders.

**Phase 3: Scene Construction**
- Build out the 6 scenes using `framer-motion` for complex scroll triggers and orchestrations (match-cut navigation).
- Integrate the technical data from the provided PDFs into beautiful, interactive Bento boxes or hover-reveals.

**Phase 4: Micro-interactions & Polish**
- Implement magnetic buttons, smooth easing on all text reveals, and custom cursor logic to tie the sensory experience together.
