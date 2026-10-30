# UNBUILT — Project Brief & Product Requirements Document (PRD) v1.0

**Product Name:** UNBUILT  
**Document Version:** 1.0 (Consolidated Project Brief & PRD)  
**Target Users:** Architects, Urban Designers, Real Estate Developers, Master Planners  
**Design System Reference:** `Tectonic Precision CAD`  
**Current Milestone:** Milestone 1 & 2 Convergence (Precision Vector Workspace & Deterministic Evaluation)  
**Owner / Author:** Product & Design Architecture Team  

---

## 1. Executive Summary & Vision

**UNBUILT** is an AI-augmented, vector-native computational site planning and feasibility platform designed specifically for architects and urban planners. It bridges the gap between high-level conceptual feasibility modeling and technical CAD/GIS spatial drafting.

Traditional real-estate feasibility software relies either on rigid tabular spreadsheets divorced from site geometry, or complex CAD/BIM tools requiring days of manual drafting to test single layout permutations. UNBUILT delivers an ultra-responsive, **canvas-first workspace** where users directly manipulate geometric invariants (setbacks, road networks, parcel subdivisions, open space requirements) and receive real-time financial, spatial, and regulatory consequence telemetry. 

A tightly bounded AI co-pilot assists in exploring spatial trade-offs and layout permutations, governed strictly by deterministic geometry engines and verifiable financial models.

---

## 2. Core Problem Statement

1. **Information Fragmentation:** Architects must balance zoning envelopes, road hierarchies, parcel yields, civic amenities, and owner financial yield across disjointed tools (CAD/Rhino + Excel + GIS).
2. **Slow Iteration Cycles:** Testing a trade-off (e.g., *"What happens to home selling price or yield if we preserve this 480 m² central green space?"*) takes hours to manually recalculate and redraw.
3. **Loss of Focus in Legacy Tools:** Prior prototypes suffered from undersized drawing canvases, excessive chrome, unreadable SVG fonts, and cluttered UI that distracted professional designers from spatial reasoning.
4. **Untrusted AI / Black-Box Generation:** Hallucinated site boundaries or ungrounded geometric claims are unacceptable in professional practice; urban planners require mathematical certainty and immutable constraints.

---

## 3. Product Principles & Design Philosophy

* **Canvas-First Real Estate:** The vector drafting canvas is the hero surface (occupying >75% of viewport width and height). Interface chrome stays compact, functional, and unobtrusive.
* **Tectonic Precision (Minimalist CAD Aesthetic):** Clean hairline linework, dual lineweights (heavy parcel boundaries vs. hairline engineering setbacks), subtle CAD coordinate grids (1.0m snap / 10.0m visual grid), and high-contrast, non-glare neutral surfaces.
* **Deterministic Authority:** The language model interprets user intent and suggests spatial strategies, but **never invents geometry or calculates financial figures**. All metrics are computed by verified local deterministic engines.
* **Immutable Invariants & Locks:** Users can declare hard constraints (e.g., *Site Boundary 120×100m Lock*, *Open Space Area ≥ 480 m² Lock*, *Target Price Lock*) that both manual parametric sliders and algorithmic solvers must honor.
* **Zero Layout Drift & Non-Disruptive Viewports:** Switching between objects, adjusting properties, or asking AI questions never resets camera framing, zoom, or coordinate context.

---

## 4. User Personas & Key Workflows

### Primary Persona: Urban Designer & Architect (Lead Master Planner)
* **Needs:** Precise dimensional control (setbacks, parcel widths, frontage, FAR limits, solar angles), clean DXF/IFC vector export, legibility at scale.
* **Workflow:** Imports site perimeter $\rightarrow$ sets access/entrance and road spine $\rightarrow$ adjusts subdivision parcels $\rightarrow$ locks civic bioswales and open spaces $\rightarrow$ runs generative optimization for optimal housing yield.

### Secondary Persona: Development Feasibility Manager / Real Estate Owner
* **Needs:** Continuous telemetry on Gross Floor Area (GFA), Floor Area Ratio (FAR), unit counts, infrastructure cost deltas, and landowner deficit/headroom.
* **Workflow:** Reviews live consequences bar $\rightarrow$ compares alternative scenarios side-by-side $\rightarrow$ validates baseline financial feasibility.

---

## 5. System Architecture & UI Anatomy

The interface is structured into 4 tightly integrated zones:

### 5.1 Top Navigation & Status Bar
* **Brandmark:** Prominent `UNBUILT v0.9.4` indicator with balanced visual weight.
* **Project Context:** Active site reference (e.g., `Cedar Market sample (120 × 100m) — Working Plan`).
* **Active Scenario Breadcrumb:** Scenario selector, zoning envelope indicator (`R-3 Med-Density`, `Setback: 3.0m / 2.5m`, `FAR Limit: 1.80 MAX`).
* **Engine Status:** `Deterministic: Validated` / `Solver: Stable (0.04s delta)`.
* **Global Actions:** Universal Undo/Redo (`Ctrl+Z` / `Ctrl+Y`), Export DXF/IFC vector bundle, User Workspace Profile.

### 5.2 Primary Vector Drafting Canvas (Center Stage)
* **Viewport Geometry:** Responsive vector SVG/Canvas rendering maintaining exact aspect ratio, centered dynamically across 1024×768, 1440×900, and 4K displays.
* **Drafting Tools (Floating HUD):**
  * `Select (V)`: Direct parcel selection and handle adjustment.
  * `Pan (H)`: Free navigation without altering zoom or coordinates.
  * `Split Lot`: Dynamic parcel subdivision.
  * `Envelope`: Zoning envelope and setback projection.
  * `Measure (M)`: Orthogonal and direct distance verification.
* **Drawing Entities:**
  * **Site Boundary:** Outer parcel limit (e.g., $120.00\,\text{m} \times 100.00\,\text{m} = 12,000\,\text{m}^2$).
  * **Primary Spine Road:** 6.0m wide asphalt road ($720\,\text{m}^2$) with designated entrance nodes and two-way circulation.
  * **Subdivided Lots:** Individual parcel geometries (Lots 01–17) displaying lot footprint ($135\,\text{m}^2$–$284\,\text{m}^2$), frontage ($F: 8.2\,\text{m}$), and depth ($D: 16.8\,\text{m}$).
  * **Civic Amenity / Open Space:** Dedicated permeable bioswale ($480.0\,\text{m}^2$, $24.0\,\text{m} \times 20.0\,\text{m}$), highlighted with technical cross-hatch.
* **HUD Readouts:** North arrow indicator, fractional graphic scale bar ($1:250 \text{ @ 100\% DPI}$), live cursor coordinates ($X: 54.2\,\text{m}, Y: 41.8\,\text{m}$), and zoom snap indicator.

### 5.3 Spatial Inspector & AI Co-Pilot (Right Collapsible Panel, 320px)
* **Spatial Inspector:**
  * Displays active selected object identity (e.g., `Open Space A — North Lot Buffer`).
  * Real-time metrics: Footprint Area ($480.0\,\text{m}^2$), Site Share ($4.00\%$), Road Buffer ($3.00\,\text{m}$), Sun Exposure ($6.4\,\text{hrs/day}$).
  * Geometric Parameter Sliders: Parcel Width (East-West), Parcel Depth (Setback), Perimeter Green Buffer.
* **Active Invariant Locks:**
  * Toggle locks to prevent solver modification: `Site Envelope Lock (120×100m)`, `Open Space A Lock (≥ 480m²)`, `Target Price Lock (≤ Rp 450M)`.
* **Contextual Co-Pilot Entry:**
  * Streamlined natural language input bound to current selection: *"Keep this green space. Do not increase home selling price. What else can change?"*
  * One-click trigger for `Run Optimization`.

### 5.4 Evaluator Consequences & Telemetry Strip (Persistent Footer)
* **Immediate Economic & Spatial Delta Bar:**
  * **Total Homes:** Live unit yield (e.g., $17\,\text{units}$, avg $140\,\text{m}^2$).
  * **Green Area:** $480\,\text{m}^2$ ($4.0\%$).
  * **Road Infrastructure:** $720\,\text{m}^2$ ($6.0\%$).
  * **Financial Allowance:** $\text{Rp } 2.41\,\text{bn}$.
  * **Shortfall / Delta:** $-\text{Rp } 7.59\,\text{bn}$ (Baseline Deficit).
* **System Telemetry:** Macro yield ($142\,\text{units}$ optimized yield), Open Space gross ($3,480\,\text{m}^2$), Circulation gross ($2,160\,\text{m}^2$), Owner Headroom ($+360\,\text{m}^2\text{ FAR}$), CRS coordinate projection (`EPSG:27700`).

---

## 6. Color Systems & Visual Hierarchy

The interface adopts a calibrated neutral architectural palette that avoids eye fatigue during prolonged CAD work:

| Visual Element | Specification | Rationale |
| :--- | :--- | :--- |
| **Canvas Drafting Paper** | `#DFE2E6` / `#F1F3F5` (Day CAD / Vellum) | Soft, matte technical gray that provides high contrast against black parcel vectors without eye strain. |
| **Outer Chrome (Panels/Bars)**| `#202328` to `#262930` (Architectural Slate) | Slightly lighter than pure black to create soft depth and frame the drawing panel crisply. |
| **Linework & Borders** | `1px solid rgba(255,255,255,0.08)` to `rgba(0,0,0,0.85)` | High-precision technical hairline delineation. |
| **Accent Options** | • **Muted Orange** (`#D97736` / `#E08544`)<br>• **Muted Red** (`#D9534F` / `#C84B4B`)<br>• **Muted Purple** (`#9B82C9` / `#8C78B8`)<br>• **CAD Cyan/Teal** (`#00C9A7`) | Semantic status highlights: Orange for active editing/CTAs, Red for locked constraints, Purple for civic/ecological reserves. |
| **Typography** | Pure Sans-Serif (`Geist`, `Inter`, `system-ui`) | Tabular numeric lining figures (`font-variant-numeric: tabular-nums`) for exact alignment of dimensions and currency. |

---

## 7. Functional & Non-Functional Requirements

### 7.1 Functional Requirements
* **FR-01: Direct Selection & Manipulation:** Clicking any lot, road, or buffer on canvas or inspector selects the entity and loads its properties instantly.
* **FR-02: Live Invariant Enforcing:** Parameters constrained by active locks cannot be overridden by heuristic solvers or AI prompts without explicit user confirmation.
* **FR-03: Real-Time Telemetry Recalculation:** Any geometric change recalculates road runoff, lot area, FAR compliance, and economic deficit within $< 50\,\text{ms}$.
* **FR-04: Deterministic AI Co-Pilot Boundary:** The assistant translates user prompts into parameter bounds and solver query payloads, executing strictly against local calculation models.
* **FR-05: One-Step Undo/Redo:** Every boundary split, merge, or slider tweak creates an undo point.

### 7.2 Non-Functional & Usability Requirements (PRD v0.35 Conformance)
* **NFR-01 (Viewport Optimization):** At $1440 \times 900$ and $1024 \times 768$, the full site, spatial inspector, and consequences strip fit without viewport scrolling.
* **NFR-02 (Legibility & Type Scale):** Primary UI labels target $\ge 16\,\text{px}$; secondary tags $\ge 14\,\text{px}$. Vector canvas dimensions maintain crisp screen-space rendering without collapsing to illegible sub-pixel text.
* **NFR-03 (Performance):** Zero canvas frame drops during pan and zoom; vector re-renders complete at 60 FPS.
* **NFR-04 (Export Accuracy):** Exported vector geometries conform to exact standard coordinate reference systems (`EPSG:27700`) and scale ($1:250$).

---

## 8. Development Roadmap

* **Phase 1 (Complete):** High-density canvas layout, viewport resizing, technical drawing linework, spatial inspector consolidation, and color variations.
* **Phase 2 (Current):** Interactive polygon split tool, live setback vertex dragging, and multi-scenario side-by-side comparison matrix.
* **Phase 3 (Next):** Full DXF/IFC bidirectional sync, integration of topographic contours, and multi-zone solar envelope analysis.
