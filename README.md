# 🔬 Sistema Experto Médico Infectólogo - TP4

Sistema experto dual (Determinístico + Probabilístico) para diagnóstico de Dengue y COVID-19 con interfaz web moderna.

## 🎯 Características

- **Agente Determinístico**: Motor de reglas lógicas usando `durable_rules`
- **Agente Probabilístico**: Red Bayesiana con `pgmpy`
- **API REST**: Backend en FastAPI con documentación automática
- **Interfaz Web**: React + TailwindCSS con diseño moderno

## 🚀 Inicio Rápido

### Requisitos
- Python 3.10+
- Node.js 20+
- npm

### 1. Backend

```bash
# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
cd backend
uvicorn main:app --reload
```

El backend estará en `http://localhost:8000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará en `http://localhost:5173`

## 📖 Uso

1. Abre el navegador en `http://localhost:5173`
2. Click en "Cargar Caso TP4" para pre-cargar el caso de prueba
3. Click en "🔍 Diagnosticar"
4. Observa los resultados de ambos agentes:
   - **Determinístico**: Clasificación basada en reglas
   - **Probabilístico**: Porcentaje de probabilidad de Dengue

## 📁 Estructura

```
tp3_prototipo1/
├── backend/
│   ├── agents/
│   │   ├── deterministic.py  # Reglas lógicas
│   │   └── probabilistic.py  # Red Bayesiana
│   └── main.py               # API FastAPI
├── frontend/
│   └── src/
│       └── App.jsx           # Interfaz React
├── agente_reglas.py          # Prototipo original (experta)
└── requirements.txt
```

## 📚 Documentación

- **API Docs**: `http://localhost:8000/docs` (Swagger automático)
- **Walkthrough**: Revisar `walkthrough.md` para detalles completos

## 🧪 Caso de Prueba TP4

- Paciente: Masculino, 35 años, Corrientes
- Síntomas: Fiebre, tos, dolor de garganta
- Antecedentes: Asma, hipertensión
- Historia: Viaje a Brasil, contacto con Dengue
- Contexto: Verano en Corrientes

**Resultado Esperado**:
- Determinístico: "SOSPECHOSO DE DENGUE (Alta Probabilidad) y COVID-19"
- Probabilístico: ~90% probabilidad de Dengue

## 🔧 Tecnologías

- **Backend**: FastAPI, durable_rules, pgmpy, NumPy
- **Frontend**: React, Vite, TailwindCSS
- **Conceptos IA**: Sistemas Basados en Reglas, Redes Bayesianas, Teorema de Bayes

## 👨‍🎓 Trabajo Práctico

Este proyecto implementa:
- ✅ Diseño del agente (PAMA/REAS)
- ✅ Enfoque Determinístico (Reglas lógicas)
- ✅ Enfoque Probabilístico (Red Bayesiana)
- ✅ Validación con caso de estudio
- ✅ Interfaz de usuario separada de la lógica
