# 🩺 Dual Expert System for COVID-19 vs Dengue Differential Diagnosis

A hybrid expert system implementing two complementary classical AI approaches: rule-based reasoning (deterministic) and Bayesian probabilistic inference for differential diagnosis between COVID-19 and Dengue, tailored to the Argentine epidemiological context in dengue-endemic regions (2025).

> 🤖 **AI-Assisted Development**: This project was designed and developed with the assistance of Generative Artificial Intelligence. It serves as a dual case study: it implements classical AI techniques (rule-based systems + probabilistic reasoning) while demonstrating how modern AI tools can accelerate complex software development in the medical-academic domain.

---

## 🌟 Key Features

### 🧠 **Dual Diagnostic Engine**
- **Deterministic Agent**: Rule-based system with forward chaining and weighted scoring
- **Probabilistic Agent**: Bayesian network with 13 nodes and 16 causal dependencies
- **Intelligent Consensus**: Complementary results with full reasoning traceability

### 💬 **Trimodal User Interface**
- **Medical Form**: Direct capture of 16 clinical-epidemiological parameters
- **Conversational Chat**: Step-by-step guided triage with adaptive logic
- **Advanced Visualization**: Interactive decision tree with React Flow + inference traces

### ⚕️ **Medical Knowledge Base**
- 2025 protocols from the Argentine Ministry of Health + PAHO
- 6 differential diagnosis rules with calibrated weights
- 3 alarm signs with automatic urgent referral
- Fuzzy fever logic (low-grade/high/hyperpyrexia)

### 🌍 **Argentine Epidemiological Context**
- Endemic areas: Corrientes, Misiones, Formosa, Chaco
- Seasonality: Higher dengue incidence in summer (Aedes aegypti)
- Risk factors: travel to Brazil, contact with confirmed cases

---

## 🧪 AI Fundamentals & Knowledge Representation

### 📚 Deterministic Approach - Rule-Based System

**Architecture**: Pure Python implementation of **forward chaining** inference engine (no expert system libraries).

**Knowledge Base** (`backend/data/reglas_infectologia.json`):
- **6 differential diagnosis rules** with calibrated weights:
  - `retro_orbital_pain`: +5 Dengue, -1 COVID → Classic arbovirus symptom
  - `cough`: +2 COVID, -2 Dengue → Upper respiratory symptom
  - `anosmia`: +7 COVID, -2 Dengue → Highly specific for COVID-19
  - `myalgia`: +4 Dengue, +1 COVID → "Breakbone fever"
  - `dengue_contact`: +10 Dengue → Strongest predictor in active outbreaks

- **2 contextual rules**:
  - Corrientes + Summer: +5 Dengue (endemic zone + high Aedes aegypti season)
  - Corrientes + Other seasons: +2 Dengue (endemic zone, lower vector activity)

- **3 alarm signs** with urgent referral:
  - Intense abdominal pain → plasma extravasation (severe dengue)
  - Mucosal bleeding → evaluate platelets/hematocrit
  - Dyspnea → COVID pneumonia, O₂ saturation check

**Inference Algorithm**:
1. **Perception**: Maps patient data to internal evidence
2. **Weighted Scoring**: Accumulates points per activated rule
3. **Fuzzy Fever Logic**:
   - 37.0-37.9°C: low-grade fever (+0 dengue)
   - 38.0-39.5°C: high fever (+2 dengue)
   - ≥39.6°C: hyperpyrexia (+3 dengue)
4. **Severity Assessment**: Detects alarm signs with maximum priority
5. **Differential Classification**:
   ```python
   if score_dengue > score_covid + 3:
       return "SUSPICIOUS OF DENGUE (High Probability)"
   elif score_covid > score_dengue + 3:
       return "COMPATIBLE WITH COVID-19"
   else:
       return "REQUIRES DIFFERENTIAL DIAGNOSIS"
   ```
6. **Traceability**: Generates human-readable trace of every fired rule

**Example Trace**:
```
START: Fever detected (40.2°C) → Initial scores
Applying R_RETROOCULAR → Dengue +5, COVID -1
Context: Corrientes + Summer → Dengue +5
Fuzzy Logic: 40.2°C → HYPERPYREXIA (Dengue +3)
FINAL SCORES: Dengue 23 vs COVID 3
DIAGNOSIS: SUSPICIOUS OF DENGUE (High Probability)
```

---

### 🎲 Probabilistic Approach - Bayesian Network

**Architecture**: DAG (Directed Acyclic Graph) with 13 nodes, 16 edges implemented using `pgmpy`.

**Network Structure**:
```
Root Nodes (Context):
  Season → Dengue
  Location → Dengue
  Travel → Dengue
  Contact → Dengue
  
Disease Nodes:
  COVID (independent - global circulation)
  Dengue (depends on 4 contextual factors)

Symptom Nodes (observed evidence):
  Fever ← {Dengue, COVID}
  Cough ← {Dengue, COVID}
  SoreThroat ← {Dengue, COVID}
  RetroOrbitalPain ← {Dengue, COVID}
  Myalgia ← {Dengue, COVID}
  Anosmia ← {Dengue, COVID}
  Dyspnea ← {Dengue, COVID}
```

**Key Conditional Probability Tables (CPDs)**:
- **Baseline Prevalence**: P(COVID) = 5%, P(Dengue | default) = 1%
- **Contextual Dengue**: P(Dengue | Contact=Yes) = 85%, P(Dengue | Travel=Yes) = 55%
- **Discriminant Symptoms**:
  - P(Anosmia | COVID=Yes, Dengue=No) = 85% (highly specific)
  - P(RetroOrbital | Dengue=Yes, COVID=No) = 80% (classic dengue)
  - P(Cough | COVID=Yes, Dengue=No) = 80% (upper respiratory)

**Inference**: Variable Elimination algorithm applies Bayes' Theorem recursively, propagating evidence to disease nodes and returning posterior probabilities P(COVID|Evidence) and P(Dengue|Evidence).

---

### 💬 Conversational Agent - Interactive Triage

**16-Question Dynamic Flow**:
1. **Base Symptoms** (4): Fever, Temperature (conditional), Retro-orbital pain, Cough
2. **Differentiators** (5): Sore throat, Myalgia, Anosmia, Alarm signs (3 combined)
3. **Epidemiological Context** (6): Location, Season, Brazil travel, Dengue contact, Medical history (asthma, hypertension)

**Adaptive Logic**: Temperature question only appears if fever=Yes (conditional rendering).

**Session Management**: RESTful API with UUID-based sessions (`/chat/start`, `/chat/{session_id}/message`).

**Final Output**: After 16 questions, both engines run and return deterministic classification + Bayesian probabilities + full inference trace + interactive decision tree.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+, Node.js 20+, npm

### 1️⃣ Backend Setup
```bash
pip install -r requirements.txt
py -m uvicorn backend.main:app --reload
```
✅ Backend running at `http://localhost:8000` (API docs: `/docs`)

### 2️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend running at `http://localhost:3000`

### 3️⃣ Usage
1. Open `http://localhost:3000`
2. Choose mode:
   - **📋 Form**: Direct 16-field input
   - **💬 Chat**: Step-by-step conversational triage
3. View dual results: deterministic classification + Bayesian probabilities + inference trace + decision tree

---

## 📖 Example Cases

### 🧪 Case 1: Dengue with Hyperpyrexia
**Input**: Temp 40.5°C, retro-orbital pain, myalgia, Corrientes+Summer, dengue contact  
**Output**:
- Deterministic: "SUSPICIOUS OF DENGUE" (Score 23 vs -1)
- Probabilistic: Dengue 99.99%, COVID 0.01%

### 🧪 Case 2: COVID-19 with Anosmia
**Input**: Temp 38.2°C, cough, sore throat, anosmia, CABA+Winter  
**Output**:
- Deterministic: "COMPATIBLE WITH COVID-19" (Score 9 vs 0)
- Probabilistic: COVID 99.81%, Dengue 0.19%

### 🚨 Case 3: Severe Dengue (Alarm Signs)
**Input**: Temp 39.8°C, retro-orbital pain, intense abdominal pain, mucosal bleeding  
**Output**:
- Deterministic: "**SEVERE DENGUE CASE (Alarm Signs)**"
- Action: "⚠️ MEDICAL EMERGENCY - IMMEDIATE REFERRAL"

---

## 📁 Project Structure

```
tp3_prototipo1/
├── backend/
│   ├── main.py                      # FastAPI endpoints
│   ├── agents/
│   │   ├── deterministic.py         # Rule-based engine with scoring
│   │   ├── probabilistic.py         # Bayesian network (pgmpy)
│   │   └── conversational.py        # Chat logic (16 questions)
│   └── data/
│       └── reglas_infectologia.json # Medical knowledge base
├── frontend/
│   ├── app/
│   │   └── page.tsx                 # Main page (tabs: form/chat)
│   ├── components/
│   │   ├── diagnostic-form.tsx      # 16-field medical form
│   │   ├── chat-interface.tsx       # Conversational interface
│   │   ├── diagnostic-results.tsx   # Results visualization
│   │   └── decision-tree.tsx        # Interactive tree (React Flow)
│   └── lib/
│       └── i18n.ts                  # Internationalization (ES/EN)
├── requirements.txt
└── README.md
```

---

## 🧑‍⚕️ Medical Knowledge Base

### Data Sources
- Argentine Ministry of Health (2025 Protocols)
- PAHO - Dengue Guidelines
- Scientific papers: COVIDENGUE Score, arbovirus differential diagnosis

### Knowledge Rules Summary

**6 Differential Diagnosis Rules**:
- Retro-orbital pain: +5 Dengue (classic arbovirus)
- Cough: +2 COVID (upper respiratory)
- Anosmia: +7 COVID (highly specific)
- Intense myalgia: +4 Dengue ("breakbone fever")
- Epidemiological link: +10 Dengue (strongest predictor)

**2 Contextual Rules**:
- Corrientes + Summer: +5 Dengue (endemic zone + Aedes aegypti season)
- Corrientes + Other seasons: +2 Dengue (endemic zone, lower vector)

**3 Alarm Signs**:
- Intense abdominal pain → URGENT (plasma extravasation)
- Mucosal bleeding → URGENT (platelets/hematocrit)
- Dyspnea → RESPIRATORY (COVID pneumonia, O₂ saturation)

---

## 🎓 AI Theoretical Foundations

### Rule-Based Systems (Deterministic)
- **Knowledge Representation**: IF-THEN rules with numeric weights
- **Inference Engine**: Forward chaining
- **Search Strategy**: Breadth-first in rule space
- **Conflict Resolution**: Priority by accumulated weights
- **Explainability**: Full trace of fired rules

### Probabilistic Reasoning (Bayesian Network)
- **Bayes' Theorem**: P(Disease|Symptoms) = P(Symptoms|Disease) × P(Disease) / P(Symptoms)
- **Conditional Independence**: Symptoms independent given disease
- **Exact Inference**: Variable Elimination algorithm
- **Advantage**: Rigorous uncertainty handling + Bayesian updating

### Approach Comparison

| Aspect | Deterministic | Probabilistic |
|--------|--------------|---------------|
| **Output** | Categorical classification | Probability distribution |
| **Explainability** | High (full trace) | Medium (probabilities) |
| **Maintenance** | Easy (JSON editable) | Complex (CPD calibration) |
| **Uncertainty** | Not formally handled | Mathematical rigor |
| **Speed** | O(n) rules | O(exponential in tree-width) |
| **Clinical Use** | Quick triage | Epidemiological research |

---

## 🤝 Academic Use

This project is part of a university assignment for the **Artificial Intelligence** course (Computer Science Degree, UNNE - Argentina).

**License**: MIT (free educational use)

**Citation**:
```
Dual Expert System for COVID-19 vs Dengue Differential Diagnosis
National University of the Northeast, Faculty of Exact Sciences
2025 - Developed with Generative AI Assistance
```

---

## 🙏 Acknowledgments

- Argentine Ministry of Health (public protocols)
- PAHO/WHO (epidemiological guidelines)
- pgmpy community (Bayesian network library)
- shadcn/ui (React components)
- Claude AI (Anthropic) for development assistance

---

**⚠️ Medical Disclaimer**: This system is an educational and research tool. **IT DOES NOT REPLACE** professional medical judgment and should not be used for real clinical diagnoses. Any medical decision must be made by a licensed healthcare professional.
