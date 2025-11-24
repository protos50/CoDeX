from pgmpy.models import BayesianNetwork
# Note: pgmpy recent versions might have renamed/deprecated BayesianNetwork.
# If you encounter an ImportError regarding BayesianNetwork, try importing DiscreteBayesianNetwork instead.
# However, standard pgmpy usually uses BayesianNetwork. 
# The error log showed: "ImportError: BayesianNetwork has been deprecated. Please use DiscreteBayesianNetwork instead."
# So we will switch to that.

try:
    from pgmpy.models import DiscreteBayesianNetwork as BayesianNetwork
except ImportError:
    from pgmpy.models import BayesianNetwork

from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination
import numpy as np

# 1. Define the Model Structure
# Dengue depends on: Season, Location, Travel, Contact
# Symptoms depend on: Dengue (simplified for this TP)
model = BayesianNetwork([
    ('Estacion', 'Dengue'),
    ('Lugar', 'Dengue'),
    ('Viaje', 'Dengue'),
    ('Contacto', 'Dengue'),
    ('Dengue', 'Fiebre'),
    ('Dengue', 'DolorCabeza') 
])

# 2. Define CPDs (Conditional Probability Distributions)

# Estacion: 0=Invierno, 1=Verano
cpd_estacion = TabularCPD(variable='Estacion', variable_card=2, values=[[0.5], [0.5]])

# Lugar: 0=Otro, 1=Corrientes
cpd_lugar = TabularCPD(variable='Lugar', variable_card=2, values=[[0.5], [0.5]])

# Viaje: 0=No, 1=Si
cpd_viaje = TabularCPD(variable='Viaje', variable_card=2, values=[[0.8], [0.2]])

# Contacto: 0=No, 1=Si
cpd_contacto = TabularCPD(variable='Contacto', variable_card=2, values=[[0.9], [0.1]])

# Dengue (The Target)
# Depends on 4 parents. This creates a large table (2^4 = 16 columns).
# Logic: If (Corrientes AND Verano) OR (Viaje) OR (Contacto) -> High Prob.
# We will simplify for the prototype with a smaller dependency or manual values.
# Let's define it:
# Order of parents: Contacto, Estacion, Lugar, Viaje (pgmpy sorts alphabetically usually, but let's be explicit)
# Actually, defining a 16-value array manually is error-prone here.
# Let's simplify the network for the TP demonstration:
# RiskFactor -> Dengue
# RiskFactor combines Context + Travel + Contact.

# RE-DESIGN FOR ROBUSTNESS:
# Let's make 'RiesgoEpidemiologico' a node that summarizes the inputs.
# But pgmpy handles multi-parents fine. Let's just do it.
# Parents: Contacto(2), Estacion(2), Lugar(2), Viaje(2). Total 16 combinations.
# We want High Prob when Contact=1 OR Viaje=1 OR (Lugar=1 AND Estacion=1).

# Let's generate the values programmatically to be safe.
# Iterating all combinations of parents to set P(Dengue=1)
values_dengue = []
for contacto in [0, 1]:
    for estacion in [0, 1]:
        for lugar in [0, 1]:
            for viaje in [0, 1]:
                # Logic for P(Dengue=True)
                p_dengue = 0.01 # Base very low
                
                if contacto == 1:
                    p_dengue = 0.90 # Strongest evidence
                elif viaje == 1:
                    p_dengue = 0.60 # Strong evidence
                elif lugar == 1 and estacion == 1:
                    p_dengue = 0.15 # Contextual risk (Endemic zone)
                
                values_dengue.append([1 - p_dengue, p_dengue])

# Flatten the list for pgmpy (it expects a flat list of values)
# But wait, pgmpy expects values to be [P(D=0), P(D=1)] for each column.
# We need to structure it correctly.
# The order of evidence in TabularCPD is the order of `evidence` list.
flat_values = np.array(values_dengue).T.tolist() # Transpose to get [[all P(0)], [all P(1)]]

cpd_dengue = TabularCPD(
    variable='Dengue', 
    variable_card=2, 
    values=flat_values,
    evidence=['Contacto', 'Estacion', 'Lugar', 'Viaje'],
    evidence_card=[2, 2, 2, 2]
)

# Symptoms (Evidence of effect)
# P(Fiebre | Dengue)
cpd_fiebre = TabularCPD(variable='Fiebre', variable_card=2, 
                        values=[[0.7, 0.1],  # P(NoFiebre)
                                [0.3, 0.9]], # P(Fiebre)
                        evidence=['Dengue'], evidence_card=[2])

# P(DolorCabeza | Dengue)
cpd_cabeza = TabularCPD(variable='DolorCabeza', variable_card=2, 
                        values=[[0.6, 0.2], 
                                [0.4, 0.8]],
                        evidence=['Dengue'], evidence_card=[2])

# Add CPDs
model.add_cpds(cpd_estacion, cpd_lugar, cpd_viaje, cpd_contacto, cpd_dengue, cpd_fiebre, cpd_cabeza)

# Check model
assert model.check_model()

# Inference Engine
inference = VariableElimination(model)

def run_probabilistic_agent(patient_data):
    # Map input data to network evidence
    evidence = {}
    
    # Mappings
    evidence['Estacion'] = 1 if patient_data['estacion'] == 'Verano' else 0
    evidence['Lugar'] = 1 if patient_data['lugar'] == 'Corrientes' else 0
    evidence['Viaje'] = 1 if patient_data['viaje_brasil'] else 0
    evidence['Contacto'] = 1 if patient_data['contacto_dengue'] else 0
    evidence['Fiebre'] = 1 if patient_data['fiebre'] else 0
    
    # Run Inference
    try:
        result = inference.query(variables=['Dengue'], evidence=evidence)
        prob_dengue = result.values[1] # Probability of Dengue=1
        prob_covid = 1 - prob_dengue  # Complementary probability
        
        # Probabilidad de coinfección (asumiendo independencia)
        # P(Dengue AND COVID) = P(Dengue) * P(COVID)
        prob_both = prob_dengue * prob_covid
        
        return {
            "dengue_probability": round(float(prob_dengue) * 100, 2),
            "covid_probability": round(float(prob_covid) * 100, 2),
            "both_probability": round(float(prob_both) * 100, 2),
            "analysis": "Inferencia Bayesiana basada en evidencia epidemiológica."
        }
    except Exception as e:
        return {"error": str(e)}
