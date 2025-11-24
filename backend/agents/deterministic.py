"""
Sistema Experto Determinístico - Agente Infectólogo
Implementa un Motor de Inferencia con Encadenamiento Hacia Adelante (Forward Chaining)

Arquitectura de Sistema Experto:
1. Base de Conocimiento (REGLAS) - Conocimiento médico declarativo
2. Motor de Inferencia (MotorEncadenamientoAdelante) - Algoritmo de razonamiento
3. Base de Hechos (Working Memory) - Estado del paciente
"""

# ============================================================================
# 1. BASE DE CONOCIMIENTO (Separada del Motor)
# ============================================================================
# Reglas médicas del TP4 en formato declarativo
REGLAS = [
    {
        'id': 'R1',
        'nombre': 'Detección COVID por síntomas respiratorios',
        'condiciones': ['fiebre', 'sintomas_respiratorios'],
        'conclusion': 'sospecha_covid',
        'prioridad': 1
    },
    {
        'id': 'R2',
        'nombre': 'Paciente de riesgo COVID',
        'condiciones': ['sospecha_covid', 'comorbilidades'],
        'conclusion': 'paciente_riesgo_covid',
        'prioridad': 2
    },
    {
        'id': 'R3',
        'nombre': 'Nexo epidemiológico Dengue',
        'condiciones': ['exposicion_dengue'],
        'conclusion': 'nexo_dengue',
        'prioridad': 1
    },
    {
        'id': 'R4',
        'nombre': 'Zona endémica Dengue',
        'condiciones': ['corrientes', 'verano'],
        'conclusion': 'zona_endemica',
        'prioridad': 1
    },
    {
        'id': 'R5',
        'nombre': 'Diagnóstico prioritario Dengue (Resolución de Conflicto TP4)',
        'condiciones': ['sospecha_covid', 'nexo_dengue', 'zona_endemica', 'paciente_riesgo_covid'],
        'conclusion': 'diagnostico_dengue_prioritario',
        'prioridad': 3
    },
    {
        'id': 'R6',
        'nombre': 'Diagnóstico Dengue sin COVID',
        'condiciones': ['nexo_dengue', 'zona_endemica'],
        'conclusion': 'diagnostico_dengue',
        'prioridad': 2
    },
    {
        'id': 'R7',
        'nombre': 'Diagnóstico COVID sin Dengue',
        'condiciones': ['sospecha_covid'],
        'conclusion': 'diagnostico_covid',
        'prioridad': 1
    }
]


# ============================================================================
# 2. MOTOR DE INFERENCIA (Forward Chaining Engine)
# ============================================================================
class MotorEncadenamientoAdelante:
    """
    Motor de Inferencia con Encadenamiento Hacia Adelante
    
    Algoritmo:
    1. Inicia con hechos conocidos (síntomas del paciente)
    2. CICLO: Busca reglas cuyas condiciones se cumplan
    3. Aplica regla → Deriva nuevo hecho
    4. Repite hasta que no se puedan derivar más hechos
    5. Retorna diagnóstico basado en hechos derivados
    """
    
    def __init__(self, base_conocimiento):
        self.reglas = sorted(base_conocimiento, key=lambda r: r['prioridad'], reverse=True)
        self.hechos = set()
        self.traza_razonamiento = []  # Para explicabilidad
    
    def ejecutar(self, hechos_iniciales):
        """
        Ciclo de inferencia principal
        """
        self.hechos = set(hechos_iniciales)
        self.traza_razonamiento = [f"[INICIO] Hechos iniciales: {', '.join(sorted(hechos_iniciales))}"]
        
        cambios = True
        iteracion = 0
        
        # CICLO DE INFERENCIA (Forward Chaining Loop)
        while cambios:
            iteracion += 1
            cambios = False
            self.traza_razonamiento.append(f"\n--- Iteración {iteracion} ---")
            
            for regla in self.reglas:
                # Pattern Matching: ¿Se cumplen todas las condiciones?
                if self._regla_aplicable(regla):
                    # Conflict Resolution: ¿Ya derivamos esta conclusión?
                    if regla['conclusion'] not in self.hechos:
                        # Aplicar regla: Derivar nuevo hecho
                        self.hechos.add(regla['conclusion'])
                        self.traza_razonamiento.append(
                            f"[{regla['id']}] {regla['nombre']} → {regla['conclusion']}"
                        )
                        cambios = True  # Continuar ciclo
        
        self.traza_razonamiento.append(f"\n[FIN] Hechos derivados finales: {', '.join(sorted(self.hechos))}")
        return self.hechos
    
    def _regla_aplicable(self, regla):
        """Verifica si todas las condiciones de la regla están en los hechos"""
        return all(cond in self.hechos for cond in regla['condiciones'])
    
    def obtener_traza(self):
        """Retorna el razonamiento paso a paso (explicabilidad)"""
        return '\n'.join(self.traza_razonamiento)


# ============================================================================
# 3. INTERFAZ CON LA API (run_deterministic_agent)
# ============================================================================
def run_deterministic_agent(patient_data):
    """
    Función principal que:
    1. Traduce datos del paciente a hechos médicos
    2. Ejecuta el motor de inferencia
    3. Interpreta los hechos derivados como diagnóstico
    """
    
    # Traducir datos del paciente a hechos (percepción → simbólico)
    hechos_paciente = _percepcion_a_hechos(patient_data)
    
    # Crear instancia del motor e inferir
    motor = MotorEncadenamientoAdelante(REGLAS)
    hechos_derivados = motor.ejecutar(hechos_paciente)
    
    # Interpretar resultado (hechos derivados → diagnóstico)
    resultado = _hechos_a_diagnostico(hechos_derivados)
    
    # Agregar traza de razonamiento para explicabilidad
    resultado['razonamiento'] = motor.obtener_traza()
    
    return resultado


def _percepcion_a_hechos(data):
    """Convierte entrada numérica/booleana a hechos simbólicos"""
    hechos = set()
    
    # Hechos básicos
    if data.get('fiebre'):
        hechos.add('fiebre')
    
    # Sintomas respiratorios (OR lógico)
    if data.get('tos') or data.get('dolor_garganta'):
        hechos.add('sintomas_respiratorios')
    
    # Comorbilidades (OR lógico)
    if data.get('asma') or data.get('hipertension'):
        hechos.add('comorbilidades')
    
    # Exposición a Dengue (OR lógico)
    if data.get('viaje_brasil') or data.get('contacto_dengue'):
        hechos.add('exposicion_dengue')
    
    # Contexto geográfico
    if data.get('lugar') == 'Corrientes':
        hechos.add('corrientes')
    
    # Contexto temporal
    if data.get('estacion') == 'Verano':
        hechos.add('verano')
    
    return hechos


def _hechos_a_diagnostico(hechos):
    """Interpreta los hechos derivados como respuesta médica"""
    
    # Prioridad 1: Diagnóstico de conflicto resuelto (TP4)
    if 'diagnostico_dengue_prioritario' in hechos:
        return {
            "clasificacion": "SOSPECHOSO DE DENGUE (Alta Probabilidad) y COVID-19",
            "justificacion": "Conflicto resuelto por Motor de Inferencia: Prioridad Dengue por Nexo Epidemiológico fuerte en Zona Endémica, sin descartar COVID por síntomas respiratorios y factores de riesgo.",
            "accion": "Aislamiento Mixto + Test NS1 (prioritario) + PCR COVID"
        }
    
    # Prioridad 2: Solo Dengue
    if 'diagnostico_dengue' in hechos:
        return {
            "clasificacion": "Sospecha de Dengue",
            "justificacion": "Nexo epidemiológico positivo en zona endémica.",
            "accion": "Test NS1 para Dengue"
        }
    
    # Prioridad 3: Solo COVID
    if 'diagnostico_covid' in hechos:
        return {
            "clasificacion": "Sospecha de COVID-19",
            "justificacion": "Síntomas respiratorios detectados sin evidencia fuerte de Dengue.",
            "accion": "Test PCR para COVID-19"
        }
    
    # Sin diagnóstico claro
    return {
        "clasificacion": "Indeterminado",
        "justificacion": "Datos insuficientes para clasificación.",
        "accion": "Evaluación clínica completa"
    }
