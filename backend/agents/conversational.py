from typing import Dict, Optional, List
from uuid import uuid4

# Session storage (in production, use Redis or DB)
sessions: Dict[str, dict] = {}

# Question flow definition
QUESTION_FLOW = [
    {
        "id": "fiebre",
        "question": "👋 Hola, soy tu asistente de diagnóstico. ¿Tienes fiebre actualmente?",
        "type": "boolean",
        "options": ["Sí", "No"]
    },
    {
        "id": "tos",
        "question": "¿Presentas tos?",
        "type": "boolean",
        "options": ["Sí", "No"],
        "condition": lambda data: data.get("fiebre") == True  # Solo si tiene fiebre
    },
    {
        "id": "dolor_garganta",
        "question": "¿Dolor de garganta?",
        "type": "boolean",
        "options": ["Sí", "No"],
        "condition": lambda data: data.get("fiebre") == True
    },
    {
        "id": "asma",
        "question": "¿Tienes antecedentes de asma?",
        "type": "boolean",
        "options": ["Sí", "No"]
    },
    {
        "id": "hipertension",
        "question": "¿Sufres de hipertensión?",
        "type": "boolean",
        "options": ["Sí", "No"]
    },
    {
        "id": "viaje_brasil",
        "question": "¿Has viajado a Brasil en las últimas 2 semanas?",
        "type": "boolean",
        "options": ["Sí", "No"]
    },
    {
        "id": "contacto_dengue",
        "question": "¿Tuviste contacto con algún caso confirmado de Dengue?",
        "type": "boolean",
        "options": ["Sí", "No"]
    },
    {
        "id": "lugar",
        "question": "¿En qué ciudad te encuentras actualmente?",
        "type": "choice",
        "options": ["Corrientes", "Otra ubicación"]
    },
    {
        "id": "estacion",
        "question": "¿En qué época del año estamos?",
        "type": "choice",
        "options": ["Verano", "Invierno"]
    }
]

def create_session() -> str:
    """Create a new chat session"""
    session_id = str(uuid4())
    sessions[session_id] = {
        "current_step": 0,
        "data": {},
        "messages": []
    }
    return session_id

def get_next_question(session_id: str) -> Optional[dict]:
    """Get the next question based on current state"""
    if session_id not in sessions:
        return None
    
    session = sessions[session_id]
    current_step = session["current_step"]
    
    # Check if we've finished all questions
    if current_step >= len(QUESTION_FLOW):
        return None
    
    # Get next question, skip if condition not met
    while current_step < len(QUESTION_FLOW):
        question = QUESTION_FLOW[current_step]
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
    current_question = QUESTION_FLOW[session["current_step"]]
    
    # Store the answer
    question_id = current_question["id"]
    
    # Convert answer to appropriate type
    if current_question["type"] == "boolean":
        session["data"][question_id] = answer.lower() in ["sí", "si", "yes", "true", "1"]
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
        
        diagnosis_det = run_deterministic_agent(session["data"])
        diagnosis_prob = run_probabilistic_agent(session["data"])
        
        result_message = f"""
🔬 **Diagnóstico Completo**

**Análisis Determinístico:**
- {diagnosis_det.get('clasificacion', 'N/A')}
- {diagnosis_det.get('justificacion', 'N/A')}

**Análisis Probabilístico:**
- Probabilidad de Dengue: {diagnosis_prob.get('dengue_probability', 0)}%

**Recomendación:**
{diagnosis_det.get('accion', 'Consultar con médico')}
        """
        
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
