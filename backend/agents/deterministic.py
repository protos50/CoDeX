"""
Sistema Experto Híbrido - Agente Infectólogo V2 (2025)
Implementa un Motor de Inferencia basado en Conocimiento Externo (JSON)
y Lógica de Puntuación Ponderada (COVIDENGUE Score).
"""

import json
import os

# Translations for diagnostic messages
TRANSLATIONS = {
    "es": {
        "start": "--- INICIO DIAGNÓSTICO HÍBRIDO V2 ---",
        "evaluating_alarms": "[1] Evaluando Signos de Alarma:",
        "alarm_activated": "⚠️ ALARMA ACTIVADA",
        "calculating_scores": "[2] Calculando Scores (COVID vs Dengue):",
        "final_scores": "[SCORES FINALES] Dengue: {dengue} | COVID: {covid}",
        "medical_emergency": "⚠️ URGENCIA MÉDICA",
        "scores": "Scores: Dengue {dengue} vs COVID {covid}.",
        "high_fever": "Fiebre Alta ({temp}°C): Dengue({weight:+})",
        "hyperpyrexia": "Hiperpirexia ({temp}°C): Dengue({weight:+})",
        "low_fever": "Febrícula ({temp}°C): Dengue({weight:+})",
        "severe_case": "CASO GRAVE DE {disease} (Signos de Alarma)",
        "high_probability_dengue": "Alta Probabilidad de DENGUE",
        "high_probability_covid": "Alta Probabilidad de COVID-19",
        "dual_suspicion": "Sospecha Dual / Co-infección posible",
        "dengue_covid_indeterminate": "DENGUE/COVID (Indeterminado)",
        "dengue_justification": "Score Dengue ({dengue}) supera significativamente a COVID ({covid}). Predominio de nexo epidemiológico y síntomas específicos.",
        "covid_justification": "Score COVID ({covid}) supera significativamente a Dengue ({dengue}). Predominio de síntomas respiratorios.",
        "dual_justification": "Scores similares (Dengue: {dengue}, COVID: {covid}). No se puede descartar ninguna patología.",
        "dengue_action": "Solicitar NS1/PCR Dengue. Aislamiento vectorial.",
        "covid_action": "Hisopado PCR. Aislamiento respiratorio.",
        "dual_action": "Solicitar panel viral completo (Dengue + COVID).",
        "clinical_control": "Control Clínico",
        "indeterminate": "Indeterminado",
    },
    "en": {
        "start": "--- START HYBRID DIAGNOSIS V2 ---",
        "evaluating_alarms": "[1] Evaluating Alarm Signs:",
        "alarm_activated": "⚠️ ALARM ACTIVATED",
        "calculating_scores": "[2] Calculating Scores (COVID vs Dengue):",
        "final_scores": "[FINAL SCORES] Dengue: {dengue} | COVID: {covid}",
        "medical_emergency": "⚠️ MEDICAL EMERGENCY",
        "scores": "Scores: Dengue {dengue} vs COVID {covid}.",
        "high_fever": "High Fever ({temp}°C): Dengue({weight:+})",
        "hyperpyrexia": "Hyperpyrexia ({temp}°C): Dengue({weight:+})",
        "low_fever": "Low-Grade Fever ({temp}°C): Dengue({weight:+})",
        "severe_case": "SEVERE CASE OF {disease} (Alarm Signs)",
        "high_probability_dengue": "High Probability of DENGUE",
        "high_probability_covid": "High Probability of COVID-19",
        "dual_suspicion": "Dual Suspicion / Possible Co-infection",
        "dengue_covid_indeterminate": "DENGUE/COVID (Indeterminate)",
        "dengue_justification": "Dengue score ({dengue}) significantly exceeds COVID ({covid}). Predominance of epidemiological link and specific symptoms.",
        "covid_justification": "COVID score ({covid}) significantly exceeds Dengue ({dengue}). Predominance of respiratory symptoms.",
        "dual_justification": "Similar scores (Dengue: {dengue}, COVID: {covid}). Cannot rule out either pathology.",
        "dengue_action": "Request NS1/PCR Dengue test. Vector isolation.",
        "covid_action": "PCR swab. Respiratory isolation.",
        "dual_action": "Request complete viral panel (Dengue + COVID).",
        "clinical_control": "Clinical Follow-up",
        "indeterminate": "Indeterminate",
    }
}

# Symptom name translations
SYMPTOM_NAMES = {
    "es": {
        "tos": "tos",
        "dolor_garganta": "dolor_garganta",
        "dolor_retroocular": "dolor_retroocular",
        "mialgia": "mialgia",
        "nexo_dengue": "nexo_dengue",
        "anosmia": "anosmia",
        "dolor_abdominal_intenso": "dolor_abdominal_intenso",
        "sangrado_mucosas": "sangrado_mucosas",
        "disnea": "disnea",
        "zona_endemica": "zona_endemica",
        "corrientes_no_verano": "corrientes_no_verano",
    },
    "en": {
        "tos": "cough",
        "dolor_garganta": "sore_throat",
        "dolor_retroocular": "retro_orbital_pain",
        "mialgia": "myalgia",
        "nexo_dengue": "dengue_link",
        "anosmia": "anosmia",
        "dolor_abdominal_intenso": "severe_abdominal_pain",
        "sangrado_mucosas": "mucosal_bleeding",
        "disnea": "dyspnea",
        "zona_endemica": "endemic_zone",
        "corrientes_no_verano": "corrientes_off_season",
    }
}

# Ruta al archivo de conocimiento
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_PATH = os.path.join(BASE_DIR, 'data', 'reglas_infectologia.json')

class AgenteDiagnosticoHibrido:
    def __init__(self, ruta_kb=KB_PATH, lang="es"):
        self.kb = self.cargar_conocimiento(ruta_kb)
        self.lang = lang
        self.t = TRANSLATIONS.get(lang, TRANSLATIONS["es"])
        self.score_covid = 0
        self.score_dengue = 0
        self.evidencia = {}
        self.traza = []

    def cargar_conocimiento(self, ruta):
        try:
            with open(ruta, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error cargando KB: {e}")
            return {}

    def percibir_paciente(self, datos_paciente):
        """
        Recibe un diccionario con los síntomas del paciente.
        Mapea los datos del frontend al formato interno del agente.
        """
        # Mapeo de datos del frontend a evidencia interna
        self.evidencia = {
            'tos': datos_paciente.get('tos', False),
            'dolor_garganta': datos_paciente.get('dolor_garganta', False),
            'nexo_dengue': datos_paciente.get('viaje_brasil', False) or datos_paciente.get('contacto_dengue', False),
            # Asumimos valores por defecto para síntomas nuevos no presentes en el frontend actual
            'dolor_retroocular': datos_paciente.get('dolor_retroocular', False),
            'anosmia': datos_paciente.get('anosmia', False),
            'mialgia': datos_paciente.get('mialgia', False),
            'dolor_abdominal_intenso': datos_paciente.get('dolor_abdominal_intenso', False),
            'sangrado_mucosas': datos_paciente.get('sangrado_mucosas', False),
            'disnea': datos_paciente.get('disnea', False)
        }
        
        # Contexto epidemiológico
        lugar = datos_paciente.get('lugar', 'Otro')
        estacion = datos_paciente.get('estacion', 'Verano')
        
        # Zona endémica: Corrientes + Verano
        self.evidencia['zona_endemica'] = (lugar == 'Corrientes' and estacion == 'Verano')
        self.evidencia['corrientes_no_verano'] = (lugar == 'Corrientes' and estacion != 'Verano')
        
        # Lógica difusa para fiebre
        # Si el frontend envía temperatura numérica, usarla; sino, asumir valores típicos
        if datos_paciente.get('fiebre'):
            # Asumimos fiebre alta típica (38.0-39.5°C) con variabilidad
            # En una implementación real, el frontend debería enviar temperatura exacta
            self.evidencia['fiebre_valor'] = datos_paciente.get('temperatura', 38.5)
        else:
            self.evidencia['fiebre_valor'] = 36.5

        self.score_covid = 0
        self.score_dengue = 0
        self.traza = [self.t["start"]]

    def inferir_diagnostico(self):
        diagnostico = {
            "clasificacion": self.t["indeterminate"],
            "justificacion": "",
            "accion": self.t["clinical_control"],
            "razonamiento": ""
        }

        # 1. Evaluación de Signos de Alarma (Reglas Deterministas de Alta Prioridad)
        es_grave = False
        alertas = []
        
        self.traza.append(f"\n{self.t['evaluating_alarms']}")
        if self.kb:
            for regla in self.kb.get('reglas_signos_alarma', []):
                if self.evidencia.get(regla['condicion']) is True:
                    # Get translated message if available
                    mensaje = regla.get(f'mensaje_{self.lang}', regla.get('mensaje'))
                    alertas.append(mensaje)
                    # Get translated action if available
                    accion = regla.get(f'accion_{self.lang}', regla.get('accion'))
                    diagnostico['accion'] = accion
                    es_grave = True
                    # Translate condition name
                    condition_name = SYMPTOM_NAMES.get(self.lang, SYMPTOM_NAMES["es"]).get(regla['condicion'], regla['condicion'])
                    self.traza.append(f"  {self.t['alarm_activated']}: {condition_name} -> {mensaje}")

        # 2. Evaluación Diferencial (Reglas Ponderadas / Probabilísticas)
        self.traza.append(f"\n{self.t['calculating_scores']}")
        if self.kb:
            for regla in self.kb.get('reglas_diagnostico_diferencial', []):
                sintoma = regla['sintoma']
                if self.evidencia.get(sintoma) is True:
                    self.score_covid += regla['peso_covid']
                    self.score_dengue += regla['peso_dengue']
                    # Translate symptom name
                    symptom_name = SYMPTOM_NAMES.get(self.lang, SYMPTOM_NAMES["es"]).get(sintoma, sintoma)
                    self.traza.append(f"  -> {symptom_name}: COVID({regla['peso_covid']:+}) | Dengue({regla['peso_dengue']:+})")

            # 3. Lógica Difusa para Fiebre
            temp = self.evidencia.get('fiebre_valor', 36.5)
            # Si temp es None, usar default
            if temp is None:
                temp = 38.5  # Fiebre alta típica
            logica_fiebre = self.kb.get('logica_difusa_fiebre', {})
            
            if temp >= logica_fiebre.get('hiperpirexia', {}).get('min', 39.6):
                peso_extra = logica_fiebre['hiperpirexia']['peso_extra_dengue']
                self.score_dengue += peso_extra
                self.traza.append(f"  -> {self.t['hyperpyrexia'].format(temp=temp, weight=peso_extra)}")
            elif temp >= logica_fiebre.get('alta', {}).get('min', 38.0):
                peso_extra = logica_fiebre['alta']['peso_extra_dengue']
                self.score_dengue += peso_extra
                self.traza.append(f"  -> {self.t['high_fever'].format(temp=temp, weight=peso_extra)}")
            elif temp >= logica_fiebre.get('baja', {}).get('min', 37.0):
                peso_extra = logica_fiebre['baja']['peso_extra_dengue']
                if peso_extra > 0:
                    self.score_dengue += peso_extra
                    self.traza.append(f"  -> {self.t['low_fever'].format(temp=temp, weight=peso_extra)}")
            
            # 4. Evaluación de Contexto Epidemiológico
            for regla in self.kb.get('reglas_contexto_epidemiologico', []):
                condicion = regla['condicion']
                if self.evidencia.get(condicion) is True:
                    self.score_covid += regla['peso_covid']
                    self.score_dengue += regla['peso_dengue']
                    # Get translated description if available
                    desc = regla.get(f'descripcion_{self.lang}', regla.get('descripcion'))
                    self.traza.append(f"  -> {desc}: COVID({regla['peso_covid']:+}) | Dengue({regla['peso_dengue']:+})")

        self.traza.append(f"\n{self.t['final_scores'].format(dengue=self.score_dengue, covid=self.score_covid)}")

        # 4. Conclusión Final
        if es_grave:
            # Determinar la enfermedad base aunque sea caso grave
            if self.score_dengue > self.score_covid:
                enfermedad_base = "DENGUE"
            elif self.score_covid > self.score_dengue:
                enfermedad_base = "COVID-19"
            else:
                enfermedad_base = self.t["dengue_covid_indeterminate"]
            
            diagnostico['clasificacion'] = self.t["severe_case"].format(disease=enfermedad_base)
            diagnostico['justificacion'] = f"{self.t['medical_emergency']} - {' '.join(alertas)} {self.t['scores'].format(dengue=self.score_dengue, covid=self.score_covid)}"
        elif self.score_dengue > self.score_covid + 3:
            diagnostico['clasificacion'] = self.t["high_probability_dengue"]
            diagnostico['justificacion'] = self.t["dengue_justification"].format(dengue=self.score_dengue, covid=self.score_covid)
            diagnostico['accion'] = self.t["dengue_action"]
        elif self.score_covid > self.score_dengue + 3:
            diagnostico['clasificacion'] = self.t["high_probability_covid"]
            diagnostico['justificacion'] = self.t["covid_justification"].format(covid=self.score_covid, dengue=self.score_dengue)
            diagnostico['accion'] = self.t["covid_action"]
        else:
            diagnostico['clasificacion'] = self.t["dual_suspicion"]
            diagnostico['justificacion'] = self.t["dual_justification"].format(dengue=self.score_dengue, covid=self.score_covid)
            diagnostico['accion'] = self.t["dual_action"]

        diagnostico['razonamiento'] = "\n".join(self.traza)
        return diagnostico

def run_deterministic_agent(patient_data, lang="es"):
    """
    Wrapper para mantener compatibilidad con la API existente.
    """
    agente = AgenteDiagnosticoHibrido(lang=lang)
    agente.percibir_paciente(patient_data)
    return agente.inferir_diagnostico()
