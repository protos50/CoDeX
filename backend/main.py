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
    tos: bool
    dolor_garganta: bool
    asma: bool
    hipertension: bool
    viaje_brasil: bool
    contacto_dengue: bool
    lugar: str  # "Corrientes"
    estacion: str # "Verano"

@app.get("/")
def read_root():
    return {"status": "Online", "system": "Agente Infectólogo TP4"}

@app.post("/diagnose")
def diagnose(patient: PatientData):
    # 1. Deterministic Analysis
    try:
        det_result = run_deterministic_agent(patient.dict())
    except Exception as e:
        det_result = {"error": str(e)}

    # 2. Probabilistic Analysis
    try:
        prob_result = run_probabilistic_agent(patient.dict())
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
def start_chat():
    """Initialize a new chat session"""
    session_id = create_session()
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
