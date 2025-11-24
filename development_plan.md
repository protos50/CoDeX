Para cumplir con el **Trabajo Práctico 4 (TP4)**, debemos seguir una metodología de Ingeniería del Conocimiento. Basándome en los documentos teóricos que subiste (especialmente "Tema 2 y 3 \- integración 2025" y las guías de PAMA/REAS), he elaborado un **Plan de Desarrollo Paso a Paso** para tu Agente Inteligente Médico Infectólogo.  
Este plan cubre desde el diseño conceptual hasta la implementación de los enfoques (determinístico y probabilístico).  
---

### **Fase 1: Análisis y Modelado (Diseño del Agente)**

Antes de escribir código, debemos definir "quién" es el agente y "cómo" interactúa con el mundo.

#### **1.1. Definición de Tablas REAS**

*Define las capacidades y limitaciones.*

* **Rendimiento (Performance):** Diagnóstico correcto (Dengue vs. COVID-19 vs. Ambas). Precisión en la recomendación (aislamiento, testeo).  
* **Entorno (Environment):** Centro de emergencias en Corrientes, Argentina. Contexto epidemiológico: Verano (alta prevalencia Dengue), circulación activa de COVID-19, brote cercano.  
* **Actuadores:** Emitir diagnóstico, recomendar derivación, solicitar estudios complementarios, ajustar probabilidad.  
* **Sensores:** Entrada de datos del paciente (Síntomas: fiebre, tos; Historia: viaje a Brasil, contacto estrecho; Epidemiología: ubicación, estación del año).

#### **1.2. Definición de Descriptor PAMA (Percepción \- Acción)**

*Específico para el caso del TP4.*

| Percepción (Entradas) | Acción (Salidas del Agente) |
| :---- | :---- |
| **Síntomas:** Fiebre, tos, dolor de garganta. | Identificar síndrome febril / respiratorio. |
| **Antecedentes:** Asma, medicación presión. | Marcar como "Paciente de Riesgo" (COVID). |
| **Epidemiología:** Vive en Corrientes, Verano. | Aumentar probabilidad base de Dengue. |
| **Historia:** Viaje a Brasil \+ Contacto Dengue. | **Clasificar:** Alta Sospecha de Dengue. |
| **Evaluación Global:** | **Diagnóstico Final:** Sospechoso Dengue y/o COVID. Reducir probabilidad COVID si síntomas son muy específicos de Dengue, o mantener ambos. |

---

### **Fase 2: Enfoque Determinístico (Sistemas Basados en Reglas)**

Aquí "hardcodeamos" la lógica experta usando reglas SI ... ENTONCES.

#### **2.1. Extracción de Reglas (Knowledge Engineering)**

Basado en el texto del TP4, estas son las reglas lógicas que tu sistema debe tener:

1. **Regla Base COVID:** SI (Fiebre Y Tos Y Dolor Garganta) $\\rightarrow$ Posible COVID.  
2. **Regla Riesgo COVID:** SI (Posible COVID Y (Asma O Hipertensión)) $\\rightarrow$ COVID Riesgo Alto.  
3. **Regla Base Dengue:** SI (Fiebre Y (Dolor Muscular O Dolor Cabeza...)) $\\rightarrow$ Posible Dengue. *(Nota: El TP no menciona dolor muscular explícitamente en el paciente, pero es implícito en Dengue, nos centraremos en el nexo).*  
4. **Regla Nexo Dengue:** SI (Viaje a Brasil O Contacto con Enfermo Dengue) $\\rightarrow$ Nexo Epidemiológico Positivo.  
5. **Regla Contexto:** SI (Reside en Corrientes Y Temporada=Verano) $\\rightarrow$ Zona Endémica.  
6. **Regla de Inferencia Final (La del TP):**  
   * SI (Síntomas Compatibles) Y (Nexo Epidemiológico Positivo) Y (Zona Endémica) $\\rightarrow$ **Diagnóstico: Alta Probabilidad Dengue**.  
   * *Lógica de conflicto:* Si el nexo de Dengue es muy fuerte, el sistema puede priorizar Dengue sobre COVID, aunque comparta fiebre.

#### **2.2. Representación Gráfica**

Debes dibujar un **Árbol de Decisión**.

* *Raíz:* ¿Tiene Fiebre?  
* *Rama 1:* ¿Tiene síntomas respiratorios (tos)? \-\> Posible COVID.  
* *Rama 2:* ¿Tiene nexo epidemiológico (viaje/contacto)? \-\> Posible Dengue.  
* *Hoja:* Si cumple ambas \-\> Evaluar prevalencia local (Corrientes) \-\> Decidir prioridad.

#### **2.3. Implementación (Prototipo)**

Te recomiendo usar **Python** con la librería **Experta** (basada en CLIPS) o **Pyke**, como sugieren tus apuntes.  
**Estructura de código sugerida (Pseudocódigo/Python):**

Python

\# Ejemplo conceptual usando lógica simple  
class AgenteInfectologo:  
    def \_\_init\_\_(self):  
        self.hechos \= {}

    def percibir(self, sintomas, antecedentes, contexto):  
        self.hechos \= {\*\*sintomas, \*\*antecedentes, \*\*contexto}

    def inferir(self):  
        sospecha\_dengue \= 0  
        sospecha\_covid \= 0  
          
        \# Reglas COVID  
        if self.hechos.get('fiebre') and self.hechos.get('tos'):  
            sospecha\_covid \+= 1  
        if self.hechos.get('asma'):  
            sospecha\_covid \+= 1 \# Factor de riesgo  
              
        \# Reglas Dengue (Determinísticas con peso lógico)  
        if self.hechos.get('fiebre'):   
            sospecha\_dengue \+= 1  
        if self.hechos.get('viaje\_brasil') or self.hechos.get('contacto\_dengue'):  
            sospecha\_dengue \+= 5 \# Regla fuerte del TP4  
        if self.hechos.get('lugar') \== 'Corrientes' and self.hechos.get('estacion') \== 'Verano':  
            sospecha\_dengue \+= 2 \# Contexto epidemiológico  
              
        return self.actuar(sospecha\_dengue, sospecha\_covid)

    def actuar(self, score\_dengue, score\_covid):  
        if score\_dengue \> score\_covid:  
            return "Diagnóstico: ALTA SOSPECHA DE DENGUE (Prioritario). Aislar y testear."  
        elif score\_covid \> 0:  
            return "Diagnóstico: Sospecha de COVID-19."  
        else:  
            return "Sin diagnóstico claro."

---

### **Fase 3: Enfoque Probabilístico (Teorema de Bayes)**

El TP4 pide transformar el enfoque anterior. Aquí ya no es SI/ENTONCES absoluto, sino que manejamos incertidumbre.

#### **3.1. Diseño de la Red Bayesiana**

Debes definir las probabilidades a priori y condicionales.

* $P(Dengue)$ en Corrientes en verano \= Alta (ej. 0.05).  
* $P(Fiebre | Dengue)$ \= Muy alta (0.90).  
* $P(Dengue | Contacto)$ \= El Teorema de Bayes actualizará la probabilidad a priori basándose en la evidencia del "Contacto" y el "Viaje".

#### **3.2. Herramienta**

Usa la librería **pgmpy** o **pyAgrum** (mencionadas en tus archivos).  
Lógica del cambio:  
En lugar de reglas rígidas, tu agente calculará:

$$P(Dengue | Síntomas, Viaje, Corrientes)$$

Si el resultado es \> 70%, clasifica como Dengue. Si el paciente de Corrientes llega en invierno, la probabilidad a priori baja automáticamente, cambiando el diagnóstico sin cambiar el código, solo los datos.  
---

### **Fase 4: Validación y Entrega**

#### **4.1. Caso de Prueba (El del TP4)**

Debes ejecutar tu agente con estos datos exactos:

* **Input:** {Fiebre: True, Tos: True, DolorGarganta: True, Edad: 35, Sexo: M, Lugar: Corrientes, Historial: Asma, Viaje: Brasil, Contacto: Dengue}.  
* **Output Esperado:** El sistema debe decir "Sospechoso de Dengue" (por el peso del viaje y contacto) pero **NO** descartar COVID (por la tos y asma), quizás sugiriendo "Coinfección probable" o "Priorizar test Dengue".

#### **4.2. Informe**

El TP pide exponer el proceso. Tu informe debe tener:

1. Tablas PAMA/REAS.  
2. El gráfico de las reglas (Árbol).  
3. Capturas de pantalla del código funcionando con el caso del paciente de 35 años.  
4. Explicación de por qué el enfoque probabilístico es mejor para el contexto epidemiológico (maneja mejor la incertidumbre de los brotes estacionales).

¿Quieres que genere el código funcional en Python para la **Parte Determinística** usando la librería Experta para que tengas el prototipo listo? te ayudará a avanzar rápido.

ejemplo:
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

otro aproach de prompt¡Excelente iniciativa\! Aquí tienes el Plan de Desarrollo Integral para tu Sistema Experto Médico Infectólogo, diseñado específicamente para cumplir con las consignas del Trabajo Práctico 4\.  
Este plan estructura el proceso desde el modelado teórico (PAMA/REAS) hasta la implementación del código prototipo.

### **Fase 1: Análisis y Modelado (El "Papel")**

Antes de programar, definimos el comportamiento del agente basándonos estrictamente en el texto del TP4.

#### **1.1. Tabla REAS (Rendimiento, Entorno, Actuadores, Sensores)**

*Define la estructura operativa del agente.*

| Componente | Descripción para el Caso TP4 |
| :---- | :---- |
| **Rendimiento** | Precisión en la clasificación (Dengue vs COVID), rapidez en la recomendación de aislamiento, minimización de falsos negativos en pacientes de riesgo. |
| **Entorno** | Centro de emergencias en **Corrientes, Argentina**. Contexto: Verano (alta prevalencia Dengue), circulación de COVID, brote cercano. |
| **Actuadores** | Emitir diagnóstico ("Sospechoso Dengue/COVID"), recomendar derivación a sala de aislamiento, solicitar estudios (PCR, NS1). |
| **Sensores** | Datos ingresados por enfermería/médico: Síntomas (fiebre, tos), Historia clínica (asma, HTA), Epidemiología (viajes, contactos). |

#### **1.2. Descriptor PAMA (Percepción \- Acción)**

*Define el flujo de decisión específico del caso.*

| Percepción (Entrada) | Acción (Respuesta del Agente) |
| :---- | :---- |
| **Síntomas:** Fiebre, tos, dolor de garganta. | Detectar Síndrome Febril. Activar reglas de sospecha COVID (por tos/garganta). |
| **Antecedentes:** Asma, HTA. | Marcar bandera de "Paciente de Riesgo". |
| **Nexo:** Viaje a Brasil, Contacto Dengue. | **Inferencia Crítica:** Detectar Nexo Epidemiológico Fuerte para Dengue. |
| **Contexto:** Corrientes, Verano, Brote. | Aumentar prioridad/probabilidad de Dengue sobre COVID. |
| **Estado Final:** | **Clasificar:** "Sospechoso de Dengue (Prioritario) y COVID-19". Recomendar aislamiento vectorial y respiratorio. |

---

### **Fase 2: Diseño del Enfoque Determinístico (Reglas)**

El enfoque determinístico utiliza lógica "dura" (SI-ENTONCES). Estas son las reglas que implementaremos en el código:

1. **Regla de Infección Respiratoria:**  
   * SI (Fiebre Y (Tos O Dolor Garganta)) ENTONCES Posible COVID.  
2. **Regla de Riesgo:**  
   * SI (Posible COVID Y (Asma O Hipertensión)) ENTONCES COVID de Riesgo.  
3. **Regla de Nexo Dengue:**  
   * SI (Viaje a Brasil O Contacto con Dengue) ENTONCES Nexo Dengue Positivo.  
4. **Regla de Contexto Epidemiológico:**  
   * SI (Lugar \== "Corrientes" Y Estación \== "Verano") ENTONCES Zona Endémica.  
5. **Regla de Resolución de Conflicto (La clave del TP4):**  
   * SI (Posible COVID) Y (Nexo Dengue Positivo) Y (Zona Endémica) ENTONCES **Diagnóstico Principal: Dengue**. (El agente "ajusta la clasificación" como pide la consigna).

---

### **Fase 3: Implementación del Prototipo (Código)**

Para el desarrollo, utilizaremos **Python** con la librería **experta** (una implementación moderna de CLIPS, muy usada en cátedras de IA simbólica). Este código representa el **Agente Inteligente completo** capaz de resolver el caso planteado.  
**Instrucciones previas:** Necesitarás instalar la librería con pip install experta.

ejemplo: from experta import *

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

### **Fase 4: Evolución al Enfoque Probabilístico**

El TP te pide "transformar" el agente a uno probabilístico. No necesitas reescribir todo el código, sino explicar el cambio de paradigma en tu informe.

1. **¿Qué cambia?**  
   * **Determinístico (Actual):** SI contacto\_dengue ENTONCES dengue \= VERDADERO. (Certeza absoluta, rígido).  
   * **Probabilístico (Propuesto):** SI contacto\_dengue ENTONCES P(Dengue) aumenta en 0.4.  
2. Modelo de Red Bayesiana (Concepto para el TP):  
   Imagina que cada síntoma suma "puntos" (probabilidad) a una hipótesis.  
   * *Probabilidad Base (Priori) en Corrientes/Verano:* 0.15  
   * *Evidencia 1 (Fiebre):* Sube a 0.30  
   * *Evidencia 2 (Viaje Brasil):* Sube a 0.75  
   * *Evidencia 3 (Contacto Dengue):* Sube a 0.92 (**Diagnóstico: Dengue**)

En el código anterior, esto se simularía cambiando los True/False por variables numéricas (0.0 a 1.0) y usando condicionales como if probabilidad \> 0.8: confirmar\_diagnostico().

### **Fase 5: Validación (Testing)**

Para validar tu TP, debes demostrar que el agente reacciona correctamente al caso.

* **Caso de Prueba:** El código provisto arriba (if \_\_name\_\_ \== "\_\_main\_\_":...) ya contiene precargados los datos exactos del paciente de 35 años de Corrientes.  
* **Resultado Esperado:** Al ejecutar el script, el sistema debe imprimir el reporte final identificando el conflicto entre los síntomas respiratorios y el nexo de Dengue, priorizando correctamente según el contexto, tal como lo haría el médico infectólogo humano descrito en el problema.