from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from backend.agents.deterministic import run_deterministic_agent
from backend.agents.probabilistic import run_probabilistic_agent

app = FastAPI(title="Agente Infectólogo Dual", version="1.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PatientData(BaseModel):
    fiebre: bool
    temperatura: Optional[float] = None
    tos: bool
    dolor_garganta: bool
    dolor_retroocular: Optional[bool] = False
    mialgia: Optional[bool] = False
    anosmia: Optional[bool] = False
    asma: bool
    hipertension: bool
    viaje_brasil: bool
    contacto_dengue: bool
    lugar: str  # "Corrientes" o "Otro"
    estacion: str  # "Verano" o "Invierno"
    dolor_abdominal_intenso: Optional[bool] = False
    sangrado_mucosas: Optional[bool] = False
    disnea: Optional[bool] = False
    language: Optional[str] = "es"  # Language for results

@app.get("/")
def read_root():
    return {"status": "Online", "system": "Agente Infectólogo TP4"}

@app.post("/diagnose")
def diagnose(patient: PatientData):
    # Convert to dict for agents
    patient_dict = patient.dict()
    lang = patient_dict.get('language', 'es')
    
    # 1. Deterministic Analysis
    try:
        det_result = run_deterministic_agent(patient_dict, lang)
    except Exception as e:
        det_result = {"error": str(e)}

    # 2. Probabilistic Analysis
    try:
        prob_result = run_probabilistic_agent(patient_dict, lang)
    except Exception as e:
        prob_result = {"error": str(e)}
    
    return {
        "deterministic": det_result,
        "probabilistic": prob_result
    }

# ===== CONVERSATIONAL ENDPOINTS =====
from backend.agents.conversational import (
    create_session, process_answer, get_next_question, get_session_messages
)

@app.post("/chat/start")
def start_chat(request: dict = None):
    """Initialize a new chat session"""
    lang = "es"  # default
    if request and "language" in request:
        lang = request["language"] if request["language"] in ["es", "en"] else "es"
    
    session_id = create_session(lang)
    first_question = get_next_question(session_id)
    
    return {
        "session_id": session_id,
        "question": first_question
    }

@app.post("/chat/{session_id}/message")
def send_message(session_id: str, message: dict):
    """Process a user message in the chat"""
    answer = message.get("answer", "")
    
    result = process_answer(session_id, answer)
    
    return result

@app.get("/chat/{session_id}/history")
def get_history(session_id: str):
    """Get chat history"""
    messages = get_session_messages(session_id)
    return {"messages": messages}
