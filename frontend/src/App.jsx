import { useState } from 'react'
import './App.css'
import ChatMode from './ChatMode'

const API_URL = 'http://localhost:8000'

function App() {
  const [mode, setMode] = useState('form') // 'form' or 'chat'
  const [formData, setFormData] = useState({
    fiebre: false,
    tos: false,
    dolor_garganta: false,
    asma: false,
    hipertension: false,
    viaje_brasil: false,
    contacto_dengue: false,
    lugar: 'Corrientes',
    estacion: 'Verano'
  })

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCheckboxChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.checked
    })
  }

  const handleSelectChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const loadTP4Case = () => {
    setFormData({
      fiebre: true,
      tos: true,
      dolor_garganta: true,
      asma: true,
      hipertension: true,
      viaje_brasil: true,
      contacto_dengue: true,
      lugar: 'Corrientes',
      estacion: 'Verano'
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/diagnose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Error en la solicitud')
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError('Error al conectar con el servidor. Asegúrate de que el backend esté corriendo en http://localhost:8000')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔬 Agente Infectólogo Dual</h1>
          <p className="text-white/80 mb-6">Sistema Experto: Determinístico + Probabilístico</p>
          
          {/* Mode Tabs */}
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={() => setMode('form')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                mode === 'form'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              📋 Formulario Completo
            </button>
            <button
              onClick={() => setMode('chat')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                mode === 'chat'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              💬 Chat Conversacional
            </button>
          </div>
        </header>

        {mode === 'chat' ? (
          <div className="max-w-3xl mx-auto">
            <ChatMode />
          </div>
        ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* FORMULARIO */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">📋 Datos del Paciente</h2>
              <button
                onClick={loadTP4Case}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Cargar Caso TP4
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Síntomas</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      name="fiebre"
                      checked={formData.fiebre}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4"
                    />
                    <span>Fiebre</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      name="tos"
                      checked={formData.tos}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4"
                    />
                    <span>Tos</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      name="dolor_garganta"
                      checked={formData.dolor_garganta}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4"
                    />
                    <span>Dolor de Garganta</span>
                  </label>
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Antecedentes</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      name="asma"
                      checked={formData.asma}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4"
                    />
                    <span>Asma</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      name="hipertension"
                      checked={formData.hipertension}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4"
                    />
                    <span>Hipertensión</span>
                  </label>
                </div>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Historial Epidemiológico</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      name="viaje_brasil"
                      checked={formData.viaje_brasil}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4"
                    />
                    <span>Viaje a Brasil (últimas 2 semanas)</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-700">
                    <input
                      type="checkbox"
                      name="contacto_dengue"
                      checked={formData.contacto_dengue}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4"
                    />
                    <span>Contacto con Dengue</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Contexto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-gray-700">Lugar</label>
                    <select
                      name="lugar"
                      value={formData.lugar}
                      onChange={handleSelectChange}
                      className="w-full border rounded px-3 py-2 text-gray-700 bg-white"
                    >
                      <option value="Corrientes">Corrientes</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-700">Estación</label>
                    <select
                      name="estacion"
                      value={formData.estacion}
                      onChange={handleSelectChange}
                      className="w-full border rounded px-3 py-2 text-gray-700 bg-white"
                    >
                      <option value="Verano">Verano</option>
                      <option value="Invierno">Invierno</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Analizando...' : '🔍 Diagnosticar'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>

          {/* RESULTADOS */}
          <div className="space-y-6">
            {/* INFO BANNER */}
            {results && (
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-l-4 border-purple-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Los modelos usan lógicas diferentes</h3>
                    <p className="text-sm text-gray-700">
                      <strong>Determinístico:</strong> Aplica reglas estrictas (SI/NO) para clasificar.
                      <strong className="ml-3">Probabilístico:</strong> Calcula probabilidades (0-100%) considerando todas las evidencias simultáneamente.
                      Ambos métodos son válidos y complementarios.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* DETERMINÍSTICO */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-purple-700 mb-4 flex items-center gap-2">
                ⚙️ Análisis Determinístico
                <span className="text-sm font-normal text-gray-500">(Basado en Reglas)</span>
              </h2>

              {results?.deterministic ? (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded">
                    <div className="font-semibold text-gray-700">Clasificación:</div>
                    <div className="text-lg mt-1 text-gray-800">{results.deterministic.clasificacion}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="font-semibold text-gray-700">Justificación:</div>
                    <div className="text-sm mt-1 text-gray-800">{results.deterministic.justificacion}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <div className="font-semibold text-gray-700">Acción Recomendada:</div>
                    <div className="text-sm mt-1 text-gray-800">{results.deterministic.accion}</div>
                  </div>
                  {results.deterministic.razonamiento && (
                    <details className="p-3 bg-blue-50 rounded cursor-pointer">
                      <summary className="font-semibold text-gray-700 cursor-pointer hover:text-blue-600">
                        🧠 Traza del Motor de Inferencia (Forward Chaining)
                      </summary>
                      <pre className="text-xs mt-2 whitespace-pre-wrap font-mono bg-gray-900 text-green-400 p-3 rounded border border-blue-200 overflow-x-auto">
                        {results.deterministic.razonamiento}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  Esperando diagnóstico...
                </div>
              )}
            </div>

            {/* PROBABILÍSTICO */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center gap-2">
                📊 Análisis Probabilístico
                <span className="text-sm font-normal text-gray-500">(Red Bayesiana)</span>
              </h2>

              {results?.probabilistic ? (
                <div className="space-y-3">
                  {results.probabilistic.error ? (
                    <div className="p-3 bg-red-50 text-red-700 rounded">
                      Error: {results.probabilistic.error}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-orange-50 rounded border border-orange-200">
                          <div className="font-semibold text-gray-700 text-sm">🦟 Dengue</div>
                          <div className="text-2xl font-bold text-orange-600 mt-1">
                            {results.probabilistic.dengue_probability}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full transition-all"
                              style={{ width: `${results.probabilistic.dengue_probability}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="font-semibold text-gray-700 text-sm">🦠 COVID-19</div>
                          <div className="text-2xl font-bold text-blue-600 mt-1">
                            {results.probabilistic.covid_probability}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${results.probabilistic.covid_probability}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded border border-purple-200">
                          <div className="font-semibold text-gray-700 text-sm">🔀 Ambas</div>
                          <div className="text-2xl font-bold text-purple-600 mt-1">
                            {results.probabilistic.both_probability}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all"
                              style={{ width: `${results.probabilistic.both_probability}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                        {results.probabilistic.analysis}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  Esperando análisis probabilístico...
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default App
