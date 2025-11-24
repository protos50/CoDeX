from typing import Dict, Optional, List
from uuid import uuid4
import json
import os

# Session storage (in production, use Redis or DB)
sessions: Dict[str, dict] = {}

# Translations for questions
TRANSLATIONS = {
    "es": {
        "greeting": "👋 Hola, soy tu asistente de diagnóstico. ¿Tienes fiebre actualmente?",
        "temperature": "🌡️ ¿Qué temperatura tienes? (en °C, ejemplo: 38.5)",
        "presents": "¿Presentas {desc}?",
        "dolor_retroocular": "¿Sientes dolor detrás de los ojos (dolor retroocular)?",
        "mialgia": "¿Tienes dolores musculares intensos?",
        "anosmia": "¿Has perdido el olfato (anosmia)?",
        "dolor_abdominal_intenso": "⚠️ ¿Tienes dolor abdominal intenso y continuo?",
        "sangrado_mucosas": "⚠️ ¿Has notado sangrado en encías o nariz?",
        "disnea": "⚠️ ¿Sientes falta de aire o dificultad para respirar?",
        "asma": "¿Tienes antecedentes de asma?",
        "hipertension": "¿Sufres de hipertensión?",
        "viaje_brasil": "¿Has viajado a Brasil en las últimas 2 semanas?",
        "contacto_dengue": "¿Tuviste contacto con algún caso confirmado de Dengue?",
        "lugar": "¿En qué ciudad te encuentras actualmente?",
        "estacion": "¿En qué época del año estamos?",
        "yes": "Sí",
        "no": "No",
        "corrientes": "Corrientes",
        "otra_ubicacion": "Otra ubicación",
        "verano": "Verano",
        "invierno": "Invierno",
        "diagnosis_complete": "✅ Evaluación completada. Procesando tu diagnóstico...",
        "evaluation_complete_detailed": "✅ Evaluación completada. A continuación verás el análisis detallado con ambos enfoques (determinístico y probabilístico)."
    },
    "en": {
        "greeting": "👋 Hello, I'm your diagnostic assistant. Do you currently have a fever?",
        "temperature": "🌡️ What is your temperature? (in °C, example: 38.5)",
        "presents": "Do you have {desc}?",
        "dolor_retroocular": "Do you feel pain behind your eyes (retro-orbital pain)?",
        "mialgia": "Do you have intense muscle pain?",
        "anosmia": "Have you lost your sense of smell (anosmia)?",
        "dolor_abdominal_intenso": "⚠️ Do you have intense and continuous abdominal pain?",
        "sangrado_mucosas": "⚠️ Have you noticed bleeding in gums or nose?",
        "disnea": "⚠️ Do you feel shortness of breath or difficulty breathing?",
        "asma": "Do you have a history of asthma?",
        "hipertension": "Do you suffer from hypertension?",
        "viaje_brasil": "Have you traveled to Brazil in the last 2 weeks?",
        "contacto_dengue": "Have you had contact with a confirmed Dengue case?",
        "lugar": "What city are you currently in?",
        "estacion": "What season is it?",
        "yes": "Yes",
        "no": "No",
        "corrientes": "Corrientes",
        "otra_ubicacion": "Other location",
        "verano": "Summer",
        "invierno": "Winter",
        "diagnosis_complete": "✅ Evaluation completed. Processing your diagnosis...",
        "evaluation_complete_detailed": "✅ Evaluation completed. Below you will see the detailed analysis with both approaches (deterministic and probabilistic)."
    }
}

# Description translations for dynamic symptoms
DESC_TRANSLATIONS = {
    "es": {
        "Dolor detrás de los ojos": "Dolor detrás de los ojos",
        "Tos seca o productiva": "Tos seca o productiva",
        "Odinofagia": "Odinofagia (dolor de garganta)",
        "Dolor muscular rompehuesos": "Dolor muscular rompehuesos",
        "Pérdida de olfato": "Pérdida de olfato"
    },
    "en": {
        "Dolor detrás de los ojos": "pain behind the eyes",
        "Tos seca o productiva": "dry or productive cough",
        "Odinofagia": "odynophagia (sore throat)",
        "Dolor muscular rompehuesos": "breakbone muscle pain",
        "Pérdida de olfato": "loss of smell"
    }
}

# Load Knowledge Base
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_PATH = os.path.join(BASE_DIR, 'data', 'reglas_infectologia.json')

def load_kb():
    try:
        with open(KB_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading KB: {e}")
        return {}

KB = load_kb()

def get_dynamic_questions(lang="es"):
    """Generate questions from JSON descriptions"""
    t = TRANSLATIONS[lang]
    desc_t = DESC_TRANSLATIONS[lang]
    questions = []
    
    # 1. Differential Diagnosis Questions (Dynamic)
    if KB and 'reglas_diagnostico_diferencial' in KB:
        for regla in KB['reglas_diagnostico_diferencial']:
            # Skip nexo_dengue as it's derived from specific questions
            if regla['sintoma'] == 'nexo_dengue':
                continue
            
            # Translate description
            desc = desc_t.get(regla['descripcion'], regla['descripcion'])
            questions.append({
                "id": regla['sintoma'],
                "question": t["presents"].format(desc=desc),
                "type": "boolean",
                "options": [t["yes"], t["no"]]
            })
    
    # 2. Add explicit questions for symptoms not in differential rules but in model
    additional_symptoms = ["dolor_retroocular", "mialgia", "anosmia"]
    
    # Only add if not already in dynamic questions
    existing_ids = {q["id"] for q in questions}
    for symptom_id in additional_symptoms:
        if symptom_id not in existing_ids:
            questions.append({
                "id": symptom_id,
                "question": t[symptom_id],
                "type": "boolean",
                "options": [t["yes"], t["no"]]
            })
    
    return questions

def get_static_start(lang="es"):
    t = TRANSLATIONS[lang]
    return [
        {
            "id": "fiebre",
            "question": t["greeting"],
            "type": "boolean",
            "options": [t["yes"], t["no"]]
        },
        {
            "id": "temperatura",
            "question": t["temperature"],
            "type": "number",
            "options": None,
            "condition": lambda data: data.get("fiebre", False)
        }
    ]

def get_static_alarms(lang="es"):
    t = TRANSLATIONS[lang]
    return [
        {
            "id": "dolor_abdominal_intenso",
            "question": t["dolor_abdominal_intenso"],
            "type": "boolean",
            "options": [t["yes"], t["no"]]
        },
        {
            "id": "sangrado_mucosas",
            "question": t["sangrado_mucosas"],
            "type": "boolean",
            "options": [t["yes"], t["no"]]
        },
        {
            "id": "disnea",
            "question": t["disnea"],
            "type": "boolean",
            "options": [t["yes"], t["no"]]
        }
    ]

def get_static_context(lang="es"):
    t = TRANSLATIONS[lang]
    return [
        {
            "id": "asma",
            "question": t["asma"],
            "type": "boolean",
            "options": [t["yes"], t["no"]]
        },
        {
            "id": "hipertension",
            "question": t["hipertension"],
            "type": "boolean",
            "options": [t["yes"], t["no"]]
        },
        {
            "id": "viaje_brasil",
            "question": t["viaje_brasil"],
            "type": "boolean",
            "options": [t["yes"], t["no"]]
        },
        {
            "id": "contacto_dengue",
            "question": t["contacto_dengue"],
            "type": "boolean",
            "options": [t["yes"], t["no"]]
        },
        {
            "id": "lugar",
            "question": t["lugar"],
            "type": "choice",
            "options": [t["corrientes"], t["otra_ubicacion"]]
        },
        {
            "id": "estacion",
            "question": t["estacion"],
            "type": "choice",
            "options": [t["verano"], t["invierno"]]
        }
    ]

def get_question_flow(lang="es"):
    """Build the full question flow for a specific language"""
    return (get_static_start(lang) + 
            get_dynamic_questions(lang) + 
            get_static_alarms(lang) + 
            get_static_context(lang))

def create_session(lang="es") -> str:
    """Create a new chat session"""
    session_id = str(uuid4())
    sessions[session_id] = {
        "current_step": 0,
        "data": {},
        "messages": [],
        "lang": lang,
        "question_flow": get_question_flow(lang)
    }
    return session_id

def get_next_question(session_id: str) -> Optional[dict]:
    """Get the next question based on current state"""
    if session_id not in sessions:
        return None
    
    session = sessions[session_id]
    question_flow = session["question_flow"]
    current_step = session["current_step"]
    
    # Check if we've finished all questions
    if current_step >= len(question_flow):
        return None
    
    # Get next question, skip if condition not met
    while current_step < len(question_flow):
        question = question_flow[current_step]
        condition = question.get("condition")
        
        if condition is None or condition(session["data"]):
            return {
                "question": question["question"],
                "type": question["type"],
                "options": question["options"],
                "question_id": question["id"]
            }
        
        # Skip this question, move to next
        session["current_step"] += 1
        current_step += 1
    
    return None  # No more questions

def process_answer(session_id: str, answer: str) -> dict:
    """Process user answer and return next question or diagnosis"""
    if session_id not in sessions:
        return {"error": "Session not found"}
    
    session = sessions[session_id]
    question_flow = session["question_flow"]
    current_question = question_flow[session["current_step"]]
    
    # Store the answer
    question_id = current_question["id"]
    
    # Convert answer to appropriate type
    if current_question["type"] == "boolean":
        session["data"][question_id] = answer.lower() in ["sí", "si", "yes", "true", "1"]
    elif current_question["type"] == "number":
        try:
            session["data"][question_id] = float(answer.replace(",", "."))
        except ValueError:
            session["data"][question_id] = None
    elif current_question["type"] == "choice":
        if question_id == "lugar":
            session["data"][question_id] = "Corrientes" if "corrientes" in answer.lower() else "Otro"
        elif question_id == "estacion":
            session["data"][question_id] = "Verano" if "verano" in answer.lower() else "Invierno"
    
    # Add to message history
    session["messages"].append({
        "role": "user",
        "content": answer
    })
    
    # Move to next question
    session["current_step"] += 1
    
    # Get next question
    next_q = get_next_question(session_id)
    
    if next_q:
        session["messages"].append({
            "role": "assistant",
            "content": next_q["question"],
            "options": next_q.get("options")
        })
        return {
            "next_question": next_q,
            "completed": False
        }
    else:
        # Diagnostic complete, run inference
        from backend.agents.deterministic import run_deterministic_agent
        from backend.agents.probabilistic import run_probabilistic_agent
        
        # Ensure all 15 fields have defaults before diagnosis
        complete_data = {
            "fiebre": session["data"].get("fiebre", False),
            "temperatura": session["data"].get("temperatura"),
            "tos": session["data"].get("tos", False),
            "dolor_garganta": session["data"].get("dolor_garganta", False),
            "dolor_retroocular": session["data"].get("dolor_retroocular", False),
            "mialgia": session["data"].get("mialgia", False),
            "anosmia": session["data"].get("anosmia", False),
            "asma": session["data"].get("asma", False),
            "hipertension": session["data"].get("hipertension", False),
            "viaje_brasil": session["data"].get("viaje_brasil", False),
            "contacto_dengue": session["data"].get("contacto_dengue", False),
            "lugar": session["data"].get("lugar", "Otro"),
            "estacion": session["data"].get("estacion", "Verano"),
            "dolor_abdominal_intenso": session["data"].get("dolor_abdominal_intenso", False),
            "sangrado_mucosas": session["data"].get("sangrado_mucosas", False),
            "disnea": session["data"].get("disnea", False)
        }
        
        lang = session.get("lang", "es")
        diagnosis_det = run_deterministic_agent(complete_data, lang)
        diagnosis_prob = run_probabilistic_agent(complete_data, lang)
        
        t = TRANSLATIONS.get(lang, TRANSLATIONS["es"])
        result_message = t["evaluation_complete_detailed"]
        
        session["messages"].append({
            "role": "assistant",
            "content": result_message.strip()
        })
        
        return {
            "completed": True,
            "diagnosis": {
                "deterministic": diagnosis_det,
                "probabilistic": diagnosis_prob
            },
            "message": result_message.strip()
        }

def get_session_messages(session_id: str) -> List[dict]:
    """Get all messages from a session"""
    if session_id not in sessions:
        return []
    return sessions[session_id]["messages"]
