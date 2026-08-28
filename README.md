# MATSYA AI — Intelligent Marine Decision Support System
### Smart India Hackathon 2024 · Problem Statement 26176

MATSYA AI is a full-stack, voice-first marine intelligence platform that helps Indian fishermen make safe and profitable decisions using real satellite data, machine learning, and multi-agent AI orchestration. It also provides an operations center view for INCOIS/Coast Guard analysts.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [System Architecture](#system-architecture)
3. [Feature Workflows — Behind the Scenes](#feature-workflows)
   - [PFZ — Potential Fishing Zone Detection](#pfz-workflow)
   - [Multi-Agent Orchestration](#multi-agent-workflow)
   - [Voice AI Assistant](#voice-ai-workflow)
   - [Geofence & Boundary Alerts](#geofence-workflow)
   - [Weather Safety Assessment](#weather-workflow)
   - [Safe Route Planning](#route-workflow)
   - [Historical Causal Analytics](#causal-workflow)
4. [Data Sources](#data-sources)
5. [ML Model](#ml-model)
6. [Authentication & History](#auth)
7. [Running the Project](#running)

---

## 1. Tech Stack <a name="tech-stack"></a>

| Technology | Version | Role in MATSYA AI |
|---|---|---|
| **React 19** | v19.0.1 | UI framework for all views — Fisherman cockpit, Operations Center, Landing Dashboard |
| **TypeScript** | ~5.8 | Type-safe code across frontend and backend |
| **Vite 6** | v6.2 | Frontend bundler and dev server with HMR |
| **Tailwind CSS 4** | v4.1 | Utility-first styling; dark marine theme |
| **Framer Motion (motion)** | v12 | Cinematic animations on the landing page and hero section |
| **Leaflet + react-leaflet** | v1.9 / v5.0 | Interactive 2D map with GPS pin, PFZ zone markers, route polylines in the Fisherman view |
| **Three.js** | v0.185 | 3D WebGL ocean globe rendered in the Operations Center / Global Explorer view |
| **Lucide React** | v0.546 | Icon library across all UI components |
| **Express.js** | v4.21 | Node.js HTTP server — serves 16 REST API endpoints and Vite SSR middleware |
| **tsx** | v4.21 | Runs TypeScript server code directly without pre-compilation in dev |
| **esbuild** | v0.25 | Bundles server.ts for production |
| **Python 3 + FastAPI** | FastAPI 2.0 | Standalone ML microservice that serves the RandomForest PFZ classifier |
| **Uvicorn** | — | ASGI server for the FastAPI ML service |
| **scikit-learn** | v1.x | RandomForestClassifier — trained on 6000 synthetic Indian Ocean samples |
| **Pandas + NumPy** | — | Feature engineering and batch inference inside the Python ML service |
| **joblib** | — | Serializes/deserializes the trained model (`.joblib` file) |
| **Pydantic v2** | — | Input validation with physical range checks on SST, gradient, chlorophyll |
| **@google/genai** | v2.4 | Gemini LLM SDK — used optionally in Agent 4 for natural-language enrichment |
| **bcrypt** | v6.0 | Password hashing for the auth system |
| **jsonwebtoken** | v9.0 | JWT-based session tokens for fisherman/analyst login |
| **pg (node-postgres)** | v8.23 | PostgreSQL driver; falls back to in-memory store if DB is absent |
| **dotenv** | v17 | Environment variable management (API keys, DB connection strings) |
| **Web Speech API** | Browser built-in | Voice recognition (STT) and text-to-speech (TTS) for 11 Indian languages |
| **Web Audio API** | Browser built-in | Audio beep feedback on mic start |
| **Geolocation API** | Browser built-in | Live GPS coordinates via `navigator.geolocation.watchPosition` |
| **ERDDAP Protocol** | Standard | REST-based scientific data access protocol used to query NCEI, INCOIS, PIFSC servers |
| **concurrently** | v9.2 | Runs Express + Uvicorn in parallel with a single `npm run dev:full` command |

---

## 2. System Architecture <a name="system-architecture"></a>

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React 19 + Vite)                           │
│                                                                             │
│  FishermanView          OperationsCenterView        LandingDashboard        │
│  ├─ Leaflet Map          ├─ Three.js Globe           ├─ CinematicOceanHero  │
│  ├─ Voice (Web STT/TTS)  ├─ AgentGraph              ├─ GlobalOceanGlobe     │
│  ├─ NavigationPanel      ├─ CausalAnalysisPanel      └─ HeaderNavbar        │
│  └─ Quick Queries (ta/hi/te/en)                                             │
└───────────────────────────────┬────────────────────────────────────────────┘
                                │  REST API (JSON over HTTP)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER  (server.ts · Node.js)                    │
│                                                                             │
│  POST /api/agents/orchestrate   ← Master entry point for all AI queries     │
│  GET  /api/ocean/location       ← Real-time ocean telemetry                 │
│  GET  /api/pfz/live             ← Live ML PFZ pipeline                      │
│  POST /api/weather/analyze      ← Weather safety assessment                 │
│  POST /api/geofence/check       ← Boundary proximity check                  │
│  POST /api/route/safe           ← Route planning                            │
│  POST /api/pfz/predict          ← Proxy to Python ML service                │
│  POST /api/auth/*               ← Login / Signup                            │
│  GET  /api/history/*            ← Trip & analysis history                   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │              FOUR-AGENT ORCHESTRATION PIPELINE                       │  │
│  │                                                                      │  │
│  │  Agent 1: Orchestrator AI   — intent classification, routing         │  │
│  │  Agent 2: Marine Intelligence AI — PFZ, weather, predictions         │  │
│  │  Agent 3: Spatial & Risk AI — geofence, route planning               │  │
│  │  Agent 4: Synthesis & Voice AI — NL response + Gemini enrichment     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬────────────────────────────────────────────┘
          ┌────────────────────┼───────────────────────────┐
          ▼                    ▼                           ▼
┌─────────────────┐  ┌──────────────────────┐  ┌────────────────────────┐
│  Python FastAPI │  │  External ERDDAP APIs│  │  PostgreSQL / In-Memory│
│  ML Service     │  │                      │  │  Database              │
│  :8000          │  │  NCEI OISST (SST)    │  │                        │
│                 │  │  PIFSC ESA-CCI (CHL) │  │  Users, Sessions,      │
│  RandomForest   │  │  INCOIS Argo (SST)   │  │  Analysis History      │
│  Classifier     │  │  Open-Meteo Marine   │  │                        │
│  .joblib        │  │  (Waves/Wind/Current)│  │                        │
└─────────────────┘  └──────────────────────┘  └────────────────────────┘
```

---

## 3. Feature Workflows — Behind the Scenes <a name="feature-workflows"></a>

### 3.1 PFZ — Potential Fishing Zone Detection <a name="pfz-workflow"></a>

**What the user sees:** Tap "Where can I fish today?" → Map shows green markers for the best fishing zones with distance, species, and confidence %.

**What happens behind the scenes:**

```
Step 1 — GPS
  Browser calls navigator.geolocation.watchPosition()
  → Returns live lat/lng (±accuracy meters)

Step 2 — Satellite Data Fetch (parallel, server-side)
  GET /api/pfz/live?lat=...&lng=...&radius=150

  Inside pfzGridService.ts:
  ┌─────────────────────────────────────────────┐
  │ 2a. SST Grid (NCEI OISST v2.1)              │
  │     URL: ncei.noaa.gov/erddap/griddap/      │
  │          ncdc_oisst_v2_avhrr_prelim...json  │
  │     Returns: 0.25° grid of SST values       │
  │     Resolution: ~27 km, ~1-2 day lag        │
  │                                             │
  │ 2b. Chlorophyll-a Grid (PIFSC ESA-CCI v6.0) │
  │     URL: oceanwatch.pifsc.noaa.gov/erddap/  │
  │          griddap/esa-cci-chla-8d-v6-0.json  │
  │     Returns: 0.042° (~4 km) CHL grid        │
  │     8-day composite composite               │
  │                                             │
  │ 2c. SST Gradient                            │
  │     Computed via finite differences from    │
  │     the SST grid (∂T/∂x, ∂T/∂y)            │
  └─────────────────────────────────────────────┘

Step 3 — Cloud Cover Filtering
  For each grid point within radius:
  - Skip if SST ≤ 0 (missing/fill value)
  - Skip if CHL ≤ 0 (cloud-covered pixel — never imputed)
  Result: Only grid points with BOTH real SST AND real CHL

Step 4 — ML Batch Inference
  POST http://localhost:8000/predict/pfz/batch
  Body: [{sst, sst_gradient, chlorophyll, lat, lng}, ...]

  Inside Python FastAPI (main.py):
  ┌─────────────────────────────────────────────┐
  │ Pydantic validates all inputs               │
  │ model.predict(input_df) → class [0,1]       │
  │ model.predict_proba(input_df) → P(PFZ)      │
  │ Returns predictions with confidence scores  │
  └─────────────────────────────────────────────┘

Step 5 — PFZ Candidate Selection
  Filter where pfz_prediction == True
  Sort by P(PFZ) descending
  Take top 6 candidates
  Compute: Haversine distance from vessel, bearing (direction)
  Infer species: e.g., SST 27-29°C → Sardine, Mackerel, Anchovies

Step 6 — Response to Frontend
  {pfzCandidates: [{name, lat, lng, distanceKm, direction,
    suitabilityScore, sst, chlorophyllValue, speciesLikelihood...}]}

Step 7 — Map Rendering (React + Leaflet)
  react-leaflet renders CircleMarker for each PFZ zone
  Color: green (high) → amber → orange (lower confidence)
  Popup shows: distance, direction, species, SST, CHL
```

**Fallback chain if live data is unavailable:**
1. Live NCEI + PIFSC + ML → `dataStatus: LIVE`
2. Cached GeoJSON (Jan 2020 run) → `dataStatus: CACHED/HISTORICAL`
3. If ML service is down → returns `dataStatus: UNAVAILABLE` (no fake data shown)

---

### 3.2 Multi-Agent Orchestration <a name="multi-agent-workflow"></a>

**What the user sees:** Ask any marine question in any language → get a structured, spoken answer with evidence.

**What happens behind the scenes (POST /api/agents/orchestrate):**

```
╔═══════════════════════════════════════════════╗
║  AGENT 1: Orchestrator AI (orchestratorAgent) ║
║  Technology: Rule-based NLP, no LLM call      ║
╠═══════════════════════════════════════════════╣
║  Classifies query into one of these Intents:  ║
║    FIND_PFZ · CHECK_WEATHER · BOUNDARY_CHECK  ║
║    SAFE_FISHING · ROUTE_REQUEST               ║
║    OCEAN_ANALYSIS · PRODUCTIVITY_ANALYSIS     ║
║    GENERAL_OCEAN_QUERY                        ║
║                                               ║
║  Also extracts:                               ║
║    - Language (en/ta/hi/te/ml/kn)             ║
║    - Location (from GPS context or text)      ║
║    - Time horizon (today/tomorrow)            ║
║    - Which downstream agents are needed       ║
╚═══════════════════════════════════════════════╝
                      ↓
╔═══════════════════════════════════════════════╗
║  AGENT 2: Marine Intelligence AI              ║
║  Technology: ERDDAP APIs + Python ML service  ║
╠═══════════════════════════════════════════════╣
║  Runs in parallel:                            ║
║  ├─ fetchNceiSst()  → real SST               ║
║  ├─ fetchPifscChlorophyll() → real CHL        ║
║  ├─ fetchMarineLive() → wave/wind/current     ║
║  └─ analyzeWithLiveML() → PFZ candidates      ║
║                                               ║
║  Also handles historical causal analysis      ║
║  and 24h predictions (rule-based + ML hybrid) ║
╚═══════════════════════════════════════════════╝
                      ↓
╔═══════════════════════════════════════════════╗
║  AGENT 3: Spatial & Risk AI                   ║
║  Technology: Haversine geometry, A* routing   ║
╠═══════════════════════════════════════════════╣
║  ├─ Geofence check against 5 zone registry    ║
║  │   (IMBL India-Sri Lanka, India-Pakistan,   ║
║  │    Gulf of Mannar MPA, DRDO test range,    ║
║  │    Chennai port shipping lane)             ║
║  └─ Route planning: origin → nearest PFZ      ║
║      Waypoints with wave risk per segment     ║
╚═══════════════════════════════════════════════╝
                      ↓
╔═══════════════════════════════════════════════╗
║  AGENT 4: Synthesis & Voice AI                ║
║  Technology: Rule-based templates + Gemini LLM║
╠═══════════════════════════════════════════════╣
║  Step 1: Build deterministic answer from      ║
║           structured agent outputs            ║
║  Step 2 (optional): Call Gemini API to        ║
║           make the answer more conversational ║
║  Returns:                                     ║
║    answer (full text)                         ║
║    spokenText (short, for TTS)                ║
║    warnings[], recommendations[]             ║
║    confidence score (0–100%)                  ║
╚═══════════════════════════════════════════════╝

Final response includes:
  - traceId for debugging
  - steps[] with timing per agent
  - evidence[] with dataset citations
  - dataProvenance[] with source + freshness
  - suggestedFollowUps[]
  - llmCallCount (0 or 1)
```

**Key design decision:** 3 of 4 agents run without any LLM call. Gemini is used only for language enrichment as the final step. This keeps latency low and ensures factual accuracy (data from real satellite APIs, not hallucinated).

---

### 3.3 Voice AI Assistant <a name="voice-ai-workflow"></a>

**What the user sees:** Press mic button → speak in Tamil/Hindi/Telugu/etc → hear a spoken answer.

**What happens behind the scenes:**

```
STT (Speech-to-Text):
  Browser's Web Speech API (SpeechRecognition / webkitSpeechRecognition)
  Language mapping:
    ta → ta-IN (Tamil)    hi → hi-IN (Hindi)
    te → te-IN (Telugu)   ml → ml-IN (Malayalam)
    kn → kn-IN (Kannada)  en → en-IN (English)

  Safari workaround: captures bestTranscript from all interim results
  because Safari never fires isFinal=true before onend.

  When recognition ends → text passed to startFishermanTask()

Multi-Agent call:
  runAgentOrchestration(query, language, {lat, lng})
  → POST /api/agents/orchestrate
  → Full 4-agent pipeline (described above)

TTS (Text-to-Speech):
  Web Speech Synthesis API (SpeechSynthesisUtterance)
  Uses result.spokenText (short, natural phrasing)
  Picks a matching voice for the selected language
  Rate: 0.88 (slightly slower for clarity)

  Safari workaround: 80ms delay between cancel() and speak()
  to flush synthesis queue before enqueuing new utterance.

Languages spoken: Tamil, Hindi, Telugu, Malayalam,
                  Kannada, Bengali, Marathi, Gujarati,
                  Punjabi, Odia, English

Fallback (MediaRecorder + Gemini STT):
  If webkitSpeechRecognition is unavailable, records audio
  as audio/webm (or audio/mp4 on iOS), sends base64 to
  POST /api/voice/transcribe → Gemini transcription
```

---

### 3.4 Geofence & Boundary Alerts <a name="geofence-workflow"></a>

**What the user sees:** Live map chip shows distance to nearest restricted zone. If vessel approaches, voice alarm fires in local language.

**What happens behind the scenes:**

```
Registry (hardcoded in geofenceAgent.ts):
  5 zones stored as polygon/polyline coordinate arrays:
  1. India–Sri Lanka IMBL (Palk Strait)     — 12 km warning buffer
  2. India–Pakistan IMBL (Sir Creek)        — 20 km warning buffer
  3. Gulf of Mannar Marine National Park    — 8 km warning buffer
  4. DRDO Chandipur Missile Test Range      — 25 km warning buffer
  5. Chennai Port TSS (Shipping Lane)       — 5 km warning buffer

Distance Calculation:
  For polygon zones: isPointInPolygon() using ray-casting algorithm
  For polyline zones: minimum distance to each line segment
  Both use distanceToSegmentKm() → Haversine great-circle distance

Alert Levels:
  distanceKm > bufferWarningKm       → CLEAR (INFO)
  distanceKm ≤ bufferWarningKm       → APPROACHING_BOUNDARY (CAUTION)
  distanceKm ≤ criticalBufferKm      → NEAR_BOUNDARY (CRITICAL)
  isPointInPolygon = true            → INSIDE_RESTRICTED_ZONE (CRITICAL)

Voice Warning (6 languages):
  spokenWarning.ta: "ஆபத்து! சர்வதேச எல்லைக்கோடு X கி.மீ தொலைவில்..."
  spokenWarning.hi: "खतरा! अंतरराष्ट्रीय सीमा केवल X किमी दूर है।"
  spokenWarning.en: "Danger. You are within X nautical miles..."

Cooldown: Same vessel won't get duplicate alerts within 60 seconds
          unless alert level escalates to CRITICAL.
```

---

### 3.5 Weather Safety Assessment <a name="weather-workflow"></a>

**What the user sees:** Safety card showing wave height, wind speed, risk level (SAFE / CAUTION / HIGH_RISK / DANGEROUS), departure window recommendation.

**What happens behind the scenes:**

```
Data Source: Open-Meteo Marine API
  Endpoint: https://marine-api.open-meteo.com/v1/marine
  Parameters fetched:
    wave_height, swell_wave_height, swell_wave_period,
    wave_period, wind_wave_height, wave_direction,
    ocean_current_velocity, ocean_current_direction

Risk Classification:
  wave ≥ 3.0m OR wind ≥ 45 km/h  → DANGEROUS (score: 15)
  wave ≥ 2.2m OR wind ≥ 35 km/h  → HIGH_RISK  (score: 42)
  wave ≥ 1.5m OR wind ≥ 25 km/h  → CAUTION    (score: 70)
  else                            → SAFE       (score: 92)

Departure Window Recommendation:
  Derived from live wave height:
  wave ≥ 2.5m → "Departure not recommended"
  wave ≥ 1.8m → "Cautious departure only"
  wave ≥ 1.2m → "Early morning (04:00–08:00 AM IST)"
  wave < 1.2m → "Favourable conditions"

Operational Advice (vessel type):
  Artisanal craft:   PERMITTED / EXERCISE_CAUTION / PROHIBITED
  Mechanized trawler: PERMITTED / EXERCISE_CAUTION / PROHIBITED

Spoken advisory in 6 languages (Tamil, Hindi, Telugu, Malayalam, Kannada, English)
```

---

### 3.6 Safe Route Planning <a name="route-workflow"></a>

**What the user sees:** "Show safe route to PFZ" → step-by-step waypoints with distance and estimated time.

**What happens behind the scenes:**

```
Algorithm: A* Isochrone Marine Pathfinding
  Cost function = Distance + Wave Swell + Geofence Proximity

Route Generation:
  1. Divide origin→destination into 4 segments
  2. Apply slight northward offset to avoid coastal shoals
  3. Name key waypoints:
     - Harbour Exit Gate
     - Mid-Shelf Clear Corridor
     - Thermal Front Boundary Gate
     - PFZ Rendezvous Point

Per Waypoint:
  Haversine distance to next waypoint
  Bearing angle (degrees)
  Wave risk level (SAFE / CAUTION / DANGER)
  ETA in minutes at vessel's speed (knots)

Hazards Avoided (hardcoded for safety):
  - Commercial ship anchorage (outer harbour)
  - Pulicat shallow shoal breakers
  - Sri Lanka IMBL (maintains >65 km clearance)
  - Sub-surface telecom cable corridor

Departure recommendation: derived from live wave data
  fetched fresh from Open-Meteo at time of route request
```

---

### 3.7 Historical Causal Analytics <a name="causal-workflow"></a>

**What the user sees:** "Why has fish catch declined?" → 4-tier evidence chart with satellite data, statistical correlations, environmental hypotheses, and AI synthesis.

**What happens behind the scenes:**

```
Evidence Tier Architecture:
  Tier 1 — OBSERVED_DATA:
    SST anomaly (+1.1°C above 5-year median)
    CHL reduction (-36.4% nearshore)
    Thermocline deepening (+14m Argo float data)

  Tier 2 — CORRELATION:
    SST vs pelagic catch correlation (r = -0.82)
    Thermal front displacement (42 km seaward)

  Tier 3 — POSSIBLE_CONTRIBUTING_FACTORS:
    Wind stress reduction (-45%)
    Reduced monsoon riverine runoff (-28%)

  Tier 4 — MODEL_AI_INTERPRETATION:
    Fish migration estimate (35-45 km offshore)
    Recovery window prediction (5-7 days)

Vector Store Retrieval:
  globalVectorStore.search(query, {region}, limit=3)
  Cosine similarity search over embedded marine science documents
  Returns relevant scientific literature excerpts

Final output:
  primaryFinding, evidenceTiers, spatialTemporalMetrics,
  retrievedScientificLiterature, mitigationAndFisheryAdvice
```

---

## 4. Data Sources <a name="data-sources"></a>

| Parameter | Source | API/Protocol | Update Frequency | Resolution |
|---|---|---|---|---|
| **Sea Surface Temperature (SST)** | NCEI NOAA OISST v2.1 | ERDDAP griddap | Daily (1-2 day lag) | 0.25° (~27 km) |
| **Chlorophyll-a (CHL)** | PIFSC ESA-CCI v6.0 | ERDDAP griddap | 8-day composite | 0.042° (~4 km) |
| **Wave Height / Swell / Period** | Open-Meteo Marine API | REST JSON | Hourly | ~5 km |
| **Wind Speed / Direction** | Open-Meteo Marine API | REST JSON | Hourly | ~5 km |
| **Ocean Current (speed/direction)** | Open-Meteo Marine API | REST JSON | Hourly | ~5 km |
| **SST (backup)** | Open-Meteo Marine API | REST JSON | Hourly | ~5 km |
| **SST (Indian waters)** | INCOIS ERDDAP (Argo 10-day VAM) | ERDDAP griddap | 10 days | 0.5° |
| **CHL (historical)** | INCOIS ERDDAP Oceansat-2 OCM | ERDDAP griddap | Historical only (2020) | 0.04° (~4 km) |
| **Salinity** | Physics model (no free real-time API) | — | — | Parameterized |
| **Geofence Zones** | India-Sri Lanka/Pakistan IMBL, MoEFCC MPAs, DRDO NOTMAR | Hardcoded + legally sourced | Static | Vector |

---

## 5. ML Model <a name="ml-model"></a>

**Algorithm:** RandomForestClassifier (scikit-learn)

**Purpose:** Binary classification — given SST, thermal gradient, and chlorophyll at a grid point, predict whether it is a Potential Fishing Zone (PFZ=1) or not (PFZ=0).

**Features (3):**

| Feature | Description | Typical Range (Indian Ocean) |
|---|---|---|
| `sst` | Sea Surface Temperature (°C) | 20–32°C |
| `sst_gradient` | Thermal gradient (°C / 0.25° grid cell) | 0–3.5 |
| `chlorophyll` | Chlorophyll-a concentration (mg/m³) | 0.05–12 |

**Pseudo-label rule (domain knowledge):**
```
PFZ = 1  if  SST ∈ [26°C, 30.5°C]    ← optimal for Indian pelagic species
         AND sst_gradient ≥ 0.2       ← significant thermal front present
         AND chlorophyll ≥ 0.4 mg/m³  ← above-baseline productivity
PFZ = 0  otherwise
```

**Training data:** 6,000 synthetic samples drawn from realistic Indian Ocean distributions:
- Bay of Bengal: n=2,400 (high SST, moderate CHL)
- Arabian Sea: n=1,800 (upwelling, cooler SST, very high CHL)
- Indian Ocean open water: n=1,800 (low-productivity baseline)

**Model hyperparameters:**
- n_estimators = 200
- max_depth = 12
- class_weight = 'balanced'
- min_samples_leaf = 3

**Live inference pipeline:**
1. Real SST grid from NCEI OISST (1-2 day lag)
2. Real CHL grid from PIFSC ESA-CCI (8-day composite)
3. SST gradient computed via finite differences
4. Batch POST to Python FastAPI `/predict/pfz/batch`
5. Top-6 PFZ candidates returned, sorted by P(PFZ)

**Disclaimer:** Pseudo-label model — NOT an official INCOIS PFZ advisory. For demonstration and research only.

---

## 6. Authentication & History <a name="auth"></a>

**Technology:** bcrypt (password hashing) + JWT (session tokens) + PostgreSQL (persistent) or in-memory fallback.

```
Signup flow:
  POST /api/auth/signup
  → bcrypt.hash(password, 10)
  → INSERT INTO users (name, email, password_hash, role)
  → Returns JWT token (24h expiry)

Login flow:
  POST /api/auth/login
  → bcrypt.compare(password, hash)
  → Returns JWT token

Protected routes:
  optionalAuth middleware decodes JWT from Authorization header
  Authenticated users get their analysis history saved automatically

History:
  POST /api/agents/orchestrate (authenticated)
  → saveAnalysis() stores: query, intent, location, answerSummary,
    dataStatus, pfzCount, waveHeight, timestamp
  GET /api/history/:userId → returns last 50 analyses
```

---

## 7. Running the Project <a name="running"></a>

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.9
- A Gemini API key (optional, for NL enrichment)

### Environment Variables

Create `.env` from `.env.example`:
```
GEMINI_API_KEY=your_key_here
PORT=3000
ML_SERVICE_URL=http://localhost:8000
DATABASE_URL=postgresql://user:pass@localhost:5432/matsya   # optional
```

### Install & Run

```bash
# Install Node dependencies
npm install

# Create Python virtual environment and install
cd ml-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# (Optional) Retrain the ML model
python train_model.py

# Run both servers together
npm run dev:full

# Or separately:
npm run dev          # Express + Vite on :3000
npm run ml           # FastAPI ML service on :8000
```

### API Endpoints Quick Reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/agents/orchestrate` | POST | Master AI query endpoint |
| `/api/ocean/location` | GET | Real-time ocean data for GPS coordinates |
| `/api/pfz/live` | GET | Live ML PFZ pipeline |
| `/api/pfz/predict` | POST | Single-point ML prediction |
| `/api/pfz/predict/batch` | POST | Batch ML prediction |
| `/api/weather/analyze` | POST | Weather safety assessment |
| `/api/weather/marine` | GET | Marine weather adapter |
| `/api/geofence/check` | POST | Boundary proximity check |
| `/api/geofence/monitor` | POST | Proactive vessel monitoring |
| `/api/route/safe` | POST | Safe route planning |
| `/api/history/analyze` | POST | Historical causal analytics |
| `/api/vector/search` | POST | Scientific literature search |
| `/api/auth/signup` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/history/:userId` | GET | Analysis history |
| `/api/agent/trace/:id` | GET | Agent execution trace |

---

## Views / User Personas

| View | Persona | Key Features |
|---|---|---|
| **FishermanView** | Artisanal fisherman | Voice assistant (11 languages), Leaflet GPS map, PFZ markers, navigation, emergency call (1554) |
| **OperationsCenterView** | INCOIS / Coast Guard analyst | 4-agent trace visualization, evidence panel, causal analytics, risk dashboard |
| **LandingDashboard** | General public | Cinematic ocean hero (video), 3D globe, data showcases |
| **AskOrcaView** | Any user | Direct text query to the orchestration engine |
| **PublicDashboardView** | Coastal communities | Weather, fishing suitability, news feed |

---

*MATSYA AI — Built for SIH 2024 Problem Statement 26176 · Real satellite data · No hallucinated ocean science*
