"""
Red Bayesiana Dual COVID-19 vs Dengue
Modelo completo con TODOS los síntomas del conocimiento médico
"""

try:
    from pgmpy.models import DiscreteBayesianNetwork as BayesianNetwork
except ImportError:
    from pgmpy.models import BayesianNetwork

from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination
import numpy as np

# Translations for probabilistic analysis
TRANSLATIONS = {
    "es": {
        "bayesian_inference": "Inferencia Bayesiana con {count} síntomas: {symptoms}. Red completa COVID-Dengue.",
        "symptoms_evaluated": "síntomas",
        "complete_network": "Red completa COVID-Dengue",
        "note": "Las probabilidades se obtienen por inferencia exacta en la red (VariableElimination), no por suma directa de pesos.",
        "unknown": "Desconocido"
    },
    "en": {
        "bayesian_inference": "Bayesian Inference with {count} symptoms: {symptoms}. Complete COVID-Dengue network.",
        "symptoms_evaluated": "symptoms",
        "complete_network": "Complete COVID-Dengue network",
        "note": "Probabilities are obtained by exact inference in the network (VariableElimination), not by direct sum of weights.",
        "unknown": "Unknown"
    }
}

# Symptom name translations for Bayesian network
SYMPTOM_NAMES = {
    "es": {
        "Fiebre": "Fiebre",
        "Tos": "Tos",
        "DolorGarganta": "Dolor de Garganta",
        "DolorRetroocular": "Dolor Retroocular",
        "Mialgia": "Mialgia",
        "Anosmia": "Anosmia",
        "Disnea": "Disnea",
    },
    "en": {
        "Fiebre": "Fever",
        "Tos": "Cough",
        "DolorGarganta": "Sore Throat",
        "DolorRetroocular": "Retro-Orbital Pain",
        "Mialgia": "Myalgia",
        "Anosmia": "Anosmia",
        "Disnea": "Dyspnea",
    }
}

# ====== CONSTRUCCIÓN DE RED BAYESIANA DUAL ======
# Estructura: 
# - Nodos Raíz: Contexto Epidemiológico (Estacion, Lugar, Viaje, Contacto)
# - Nodos Enfermedad: COVID, Dengue (ambos dependen del contexto)
# - Nodos Síntomas: Cada síntoma depende de COVID y/o Dengue

model = BayesianNetwork([
    # Contexto epidemiológico influye en ambas enfermedades
    ('Estacion', 'Dengue'),
    ('Lugar', 'Dengue'),
    ('Viaje', 'Dengue'),
    ('Contacto', 'Dengue'),
    # COVID es independiente del contexto en este modelo (circulación global)
    # Pero podríamos agregar dependencias si fuera necesario
    
    # Síntomas dependen de las enfermedades
    ('Dengue', 'Fiebre'),
    ('COVID', 'Fiebre'),
    ('Dengue', 'Tos'),
    ('COVID', 'Tos'),
    ('Dengue', 'DolorGarganta'),
    ('COVID', 'DolorGarganta'),
    ('Dengue', 'DolorRetroocular'),
    ('COVID', 'DolorRetroocular'),
    ('Dengue', 'Mialgia'),
    ('COVID', 'Mialgia'),
    ('Dengue', 'Anosmia'),
    ('COVID', 'Anosmia'),
    ('Dengue', 'Disnea'),
    ('COVID', 'Disnea')
])

# ====== DEFINICIÓN DE CPDs ======

# --- Contexto Epidemiológico (Prior Probabilities) ---
cpd_estacion = TabularCPD(variable='Estacion', variable_card=2, values=[[0.5], [0.5]])
cpd_lugar = TabularCPD(variable='Lugar', variable_card=2, values=[[0.5], [0.5]])
cpd_viaje = TabularCPD(variable='Viaje', variable_card=2, values=[[0.8], [0.2]])
cpd_contacto = TabularCPD(variable='Contacto', variable_card=2, values=[[0.9], [0.1]])

# --- COVID (Prevalencia Base 2025: ~5% en población general) ---
cpd_covid = TabularCPD(variable='COVID', variable_card=2, values=[[0.95], [0.05]])

# --- DENGUE (Depende de Contexto Epidemiológico) ---
# Parents: Contacto, Estacion, Lugar, Viaje (orden alfabético)
values_dengue = []
for contacto in [0, 1]:
    for estacion in [0, 1]:
        for lugar in [0, 1]:
            for viaje in [0, 1]:
                # Lógica probabilística
                p_dengue = 0.01  # Probabilidad base muy baja
                
                if contacto == 1:
                    p_dengue = 0.85  # Contacto directo - evidencia fuerte
                elif viaje == 1:
                    p_dengue = 0.55  # Viaje a zona endémica
                elif lugar == 1 and estacion == 1:
                    p_dengue = 0.20  # Corrientes + Verano
                elif lugar == 1:
                    p_dengue = 0.08  # Corrientes otras estaciones
                
                values_dengue.append([1 - p_dengue, p_dengue])

flat_dengue = np.array(values_dengue).T.tolist()
cpd_dengue = TabularCPD(
    variable='Dengue', 
    variable_card=2, 
    values=flat_dengue,
    evidence=['Contacto', 'Estacion', 'Lugar', 'Viaje'],
    evidence_card=[2, 2, 2, 2]
)

# --- SÍNTOMAS (Dependen de COVID y Dengue) ---
# Formato: P(Síntoma | COVID=0,Dengue=0), P(Síntoma | COVID=1,Dengue=0), 
#          P(Síntoma | COVID=0,Dengue=1), P(Síntoma | COVID=1,Dengue=1)

# FIEBRE: Muy común en ambas (90% Dengue, 80% COVID)
cpd_fiebre = TabularCPD(
    variable='Fiebre', variable_card=2,
    values=[
        [0.95, 0.20, 0.10, 0.05],  # P(NoFiebre) cols: (D0,C0),(D0,C1),(D1,C0),(D1,C1)
        [0.05, 0.80, 0.90, 0.95]   # P(Fiebre)
    ],
    evidence=['Dengue', 'COVID'],
    evidence_card=[2, 2]
)

# TOS: Característico de COVID (70%), raro en Dengue (10%)
cpd_tos = TabularCPD(
    variable='Tos', variable_card=2,
    values=[
        [0.90, 0.30, 0.85, 0.25],  # P(NoTos)
        [0.10, 0.70, 0.15, 0.75]   # P(Tos)
    ],
    evidence=['Dengue', 'COVID'],
    evidence_card=[2, 2]
)

# DOLOR DE GARGANTA: Moderado en COVID (50%), poco en Dengue (20%)
cpd_garganta = TabularCPD(
    variable='DolorGarganta', variable_card=2,
    values=[
        [0.85, 0.50, 0.75, 0.40],  # P(No)
        [0.15, 0.50, 0.25, 0.60]   # P(Si)
    ],
    evidence=['Dengue', 'COVID'],
    evidence_card=[2, 2]
)

# DOLOR RETROOCULAR: MUY específico de Dengue (70%), raro en COVID (5%)
cpd_retroocular = TabularCPD(
    variable='DolorRetroocular', variable_card=2,
    values=[
        [0.98, 0.93, 0.25, 0.20],  # P(No)
        [0.02, 0.07, 0.75, 0.80]   # P(Si)
    ],
    evidence=['Dengue', 'COVID'],
    evidence_card=[2, 2]
)

# MIALGIA: Muy intenso en Dengue (80%), moderado en COVID (40%)
cpd_mialgia = TabularCPD(
    variable='Mialgia', variable_card=2,
    values=[
        [0.90, 0.60, 0.15, 0.10],  # P(No)
        [0.10, 0.40, 0.85, 0.90]   # P(Si)
    ],
    evidence=['Dengue', 'COVID'],
    evidence_card=[2, 2]
)

# ANOSMIA: MUY específico de COVID (60%), no ocurre en Dengue
cpd_anosmia = TabularCPD(
    variable='Anosmia', variable_card=2,
    values=[
        [0.99, 0.35, 0.97, 0.30],  # P(No)
        [0.01, 0.65, 0.03, 0.70]   # P(Si)
    ],
    evidence=['Dengue', 'COVID'],
    evidence_card=[2, 2]
)

# DISNEA: Complicación de COVID (30%), raro en Dengue (10%)
cpd_disnea = TabularCPD(
    variable='Disnea', variable_card=2,
    values=[
        [0.95, 0.65, 0.88, 0.60],  # P(No)
        [0.05, 0.35, 0.12, 0.40]   # P(Si)
    ],
    evidence=['Dengue', 'COVID'],
    evidence_card=[2, 2]
)

# Agregar CPDs al modelo
model.add_cpds(
    cpd_estacion, cpd_lugar, cpd_viaje, cpd_contacto,
    cpd_covid, cpd_dengue,
    cpd_fiebre, cpd_tos, cpd_garganta, cpd_retroocular,
    cpd_mialgia, cpd_anosmia, cpd_disnea
)

# Validar modelo
assert model.check_model()

# Motor de inferencia
inference = VariableElimination(model)

def run_probabilistic_agent(patient_data, lang="es"):
    """
    Ejecuta inferencia bayesiana usando TODOS los síntomas disponibles
    """
    t = TRANSLATIONS.get(lang, TRANSLATIONS["es"])
    evidence = {}
    
    # --- Contexto Epidemiológico ---
    evidence['Estacion'] = 1 if patient_data.get('estacion') == 'Verano' else 0
    evidence['Lugar'] = 1 if patient_data.get('lugar') == 'Corrientes' else 0
    evidence['Viaje'] = 1 if patient_data.get('viaje_brasil', False) else 0
    evidence['Contacto'] = 1 if patient_data.get('contacto_dengue', False) else 0
    
    # --- Síntomas (TODOS) ---
    evidence['Fiebre'] = 1 if patient_data.get('fiebre', False) else 0
    evidence['Tos'] = 1 if patient_data.get('tos', False) else 0
    evidence['DolorGarganta'] = 1 if patient_data.get('dolor_garganta', False) else 0
    evidence['DolorRetroocular'] = 1 if patient_data.get('dolor_retroocular', False) else 0
    evidence['Mialgia'] = 1 if patient_data.get('mialgia', False) else 0
    evidence['Anosmia'] = 1 if patient_data.get('anosmia', False) else 0
    evidence['Disnea'] = 1 if patient_data.get('disnea', False) else 0
    
    try:
        # Inferir ambas enfermedades
        result_dengue = inference.query(variables=['Dengue'], evidence=evidence)
        result_covid = inference.query(variables=['COVID'], evidence=evidence)
        
        prob_dengue = float(result_dengue.values[1])
        prob_covid = float(result_covid.values[1])
        
        # Probabilidad de coinfección (eventos independientes)
        prob_both = prob_dengue * prob_covid
        
        # Análisis cualitativo: síntomas activados y resumen numérico
        sintomas_usados = [k for k, v in evidence.items() if v == 1 and k not in ['Estacion', 'Lugar', 'Viaje', 'Contacto']]
        
        # Translate symptom names for display
        symptom_translations = SYMPTOM_NAMES.get(lang, SYMPTOM_NAMES["es"])
        sintomas_usados_translated = [symptom_translations.get(s, s) for s in sintomas_usados]

        detalle_componentes = {
            "contexto": {
                "Estacion": evidence['Estacion'],
                "Lugar": evidence['Lugar'],
                "Viaje": evidence['Viaje'],
                "Contacto": evidence['Contacto'],
            },
            "sintomas": {
                "Fiebre": evidence['Fiebre'],
                "Tos": evidence['Tos'],
                "DolorGarganta": evidence['DolorGarganta'],
                "DolorRetroocular": evidence['DolorRetroocular'],
                "Mialgia": evidence['Mialgia'],
                "Anosmia": evidence['Anosmia'],
                "Disnea": evidence['Disnea'],
            },
            "nota_metodo": t["note"]
        }

        return {
            "dengue_probability": round(prob_dengue * 100, 2),
            "covid_probability": round(prob_covid * 100, 2),
            "both_probability": round(prob_both * 100, 2),
            "analysis": t["bayesian_inference"].format(count=len(sintomas_usados), symptoms=', '.join(sintomas_usados_translated)),
            "sintomas_evaluados": sintomas_usados,
            "contexto_epidemiologico": {
                "lugar": patient_data.get('lugar', t["unknown"]),
                "estacion": patient_data.get('estacion', t["unknown"]),
                "viaje_brasil": patient_data.get('viaje_brasil', False),
                "contacto_dengue": patient_data.get('contacto_dengue', False)
            },
            "detalles_componentes": detalle_componentes
        }
    except Exception as e:
        return {"error": str(e), "evidence": evidence}
