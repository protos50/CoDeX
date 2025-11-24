import collections.abc
# Patch for Python 3.10+ compatibility (experta/frozendict issue)
if not hasattr(collections, 'Mapping'):
    collections.Mapping = collections.abc.Mapping

from experta import *

# 1. DEFINICIÓN DE HECHOS (La "Memoria de Trabajo")
class Sintomas(Fact):
    """Síntomas reportados por el paciente"""
    pass

class Antecedentes(Fact):
    """Historial médico y epidemiológico (viajes, contactos)"""
    pass

class Contexto(Fact):
    """Datos del entorno (lugar, clima, brotes)"""
    pass

# 2. DEFINICIÓN DEL MOTOR DE INFERENCIA (El "Cerebro")
class AgenteInfectologo(KnowledgeEngine):

    # --- REGLAS DE COVID-19 ---
    @Rule(Sintomas(fiebre=True), OR(Sintomas(tos=True), Sintomas(dolor_garganta=True)))
    def evaluar_sintomas_covid(self):
        # Si tiene fiebre y tos/garganta, activamos la sospecha de COVID
        self.declare(Fact(sospecha_covid=True))
        print("[SISTEMA] -> Detectados síntomas compatibles con infección respiratoria (COVID-19).")

    @Rule(Fact(sospecha_covid=True), OR(Antecedentes(asma=True), Antecedentes(hipertension=True)))
    def evaluar_riesgo_covid(self):
        # Si ya es sospechoso y tiene comorbilidades, es paciente de riesgo
        self.declare(Fact(paciente_riesgo=True))
        print("[SISTEMA] -> ALERTA: Paciente con factores de riesgo (Asma/HTA).")

    # --- REGLAS DE DENGUE ---
    @Rule(OR(Antecedentes(viaje_brasil=True), Antecedentes(contacto_dengue=True)))
    def evaluar_nexo_dengue(self):
        # Viaje a zona endémica o contacto estrecho activa el nexo
        self.declare(Fact(nexo_dengue=True))
        print("[SISTEMA] -> Detectado Nexo Epidemiológico fuerte para Dengue.")

    @Rule(Contexto(lugar='Corrientes'), Contexto(estacion='Verano'))
    def evaluar_contexto_endemico(self):
        self.declare(Fact(zona_endemica=True))
        print("[SISTEMA] -> Contexto ambiental favorable para Dengue (Corrientes/Verano).")

    # --- REGLA DE RESOLUCIÓN DE CONFLICTO (Lógica del TP4) ---
    # Esta regla modela la decisión del médico de "ajustar la clasificación"
    # basada en la evidencia fuerte de Dengue, a pesar de los síntomas respiratorios.
    @Rule(Fact(sospecha_covid=True), 
          Fact(nexo_dengue=True), 
          Fact(zona_endemica=True),
          Fact(paciente_riesgo=True))
    def diagnostico_final_integrado(self):
        print("\n" + "="*40)
        print("   INFORME FINAL DEL AGENTE")
        print("="*40)
        print("CLASIFICACIÓN: SOSPECHOSO DE DENGUE (Alta Probabilidad) y COVID-19.")
        print("JUSTIFICACIÓN:")
        print("1. El paciente presenta síntomas respiratorios y factores de riesgo (Asma).")
        print("2. Sin embargo, el Nexo Epidemiológico (Brasil/Contacto) y el Contexto (Corrientes/Brote)")
        print("   aumentan drásticamente la probabilidad a posteriori de Dengue.")
        print("-" * 40)
        print("ACCIÓN RECOMENDADA:")
        print("-> Aislamiento mixto (Vectorial y Respiratorio).")
        print("-> Priorizar Test NS1 para Dengue y PCR para COVID.")
        print("-> Monitoreo estricto por comorbilidades.")
        
# 3. BLOQUE PRINCIPAL: VALIDACIÓN DEL CASO DEL TP4
if __name__ == "__main__":
    # Instanciamos el agente
    engine = AgenteInfectologo()
    engine.reset() # Prepara la memoria de trabajo

    print("--- INICIANDO SIMULACIÓN DE CASO TP4 ---")
    print("Paciente: Masculino, 35 años, Reside en Corrientes.")
    
    # CARGA DE DATOS (PERCEPCIÓN)
    # Contexto del TP: Corrientes, Verano, Brote cercano
    engine.declare(Contexto(lugar='Corrientes', estacion='Verano', brote_cercano=True))
    
    # Síntomas del TP: Fiebre, tos, dolor de garganta
    engine.declare(Sintomas(fiebre=True, tos=True, dolor_garganta=True))
    
    # Antecedentes del TP: Asma, medicación presión, viaje a Brasil, contacto dengue
    engine.declare(Antecedentes(asma=True, hipertension=True, viaje_brasil=True, contacto_dengue=True))

    # EJECUCIÓN (EL AGENTE "PIENSA")
    engine.run()
