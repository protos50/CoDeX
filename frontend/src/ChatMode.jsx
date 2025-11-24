import { useState, useEffect, useRef } from 'react'

const API_URL = 'http://localhost:8000'

function ChatMode() {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startChat = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/chat/start`, {
        method: 'POST'
      })
      const data = await response.json()
      
      setSessionId(data.session_id)
      setCurrentQuestion(data.question)
      setMessages([{
        role: 'assistant',
        content: data.question.question,
        options: data.question.options
      }])
      setIsCompleted(false)
    } catch (error) {
      console.error('Error starting chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendAnswer = async (answer) => {
    if (!sessionId) return

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: answer }])
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/chat/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      })
      const data = await response.json()

      if (data.completed) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          diagnosis: data.diagnosis
        }])
        setIsCompleted(true)
        setCurrentQuestion(null)
      } else {
        setCurrentQuestion(data.next_question)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.next_question.question,
          options: data.next_question.options
        }])
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetChat = () => {
    setSessionId(null)
    setMessages([])
    setCurrentQuestion(null)
    setIsCompleted(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-xl flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">💬 Diagnóstico Conversacional</h2>
          <p className="text-sm text-white/80">Triaje médico paso a paso</p>
        </div>
        {sessionId && (
          <button
            onClick={resetChat}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
          >
            Reiniciar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!sessionId ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🩺</div>
            <h3 className="text-xl font-semibold mb-2">Bienvenido al Triaje Inteligente</h3>
            <p className="text-gray-600 mb-6">Te haré algunas preguntas para evaluar tu situación</p>
            <button
              onClick={startChat}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Iniciando...' : 'Comenzar Evaluación'}
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
                
                {/* Show diagnosis details if available */}
                {msg.diagnosis && (
                  <div className="mt-4 space-y-4">
                    {/* Deterministic Analysis */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                        ⚙️ Análisis Determinístico
                        <span className="text-xs font-normal text-gray-500">(Basado en Reglas)</span>
                      </h3>
                      {msg.diagnosis.deterministic && (
                        <div className="space-y-2 text-sm">
                          <div className="p-2 bg-white rounded">
                            <div className="font-semibold text-gray-700">Clasificación:</div>
                            <div className="text-gray-800">{msg.diagnosis.deterministic.clasificacion}</div>
                          </div>
                          <div className="p-2 bg-white rounded">
                            <div className="font-semibold text-gray-700">Justificación:</div>
                            <div className="text-gray-800">{msg.diagnosis.deterministic.justificacion}</div>
                          </div>
                          <div className="p-2 bg-white rounded">
                            <div className="font-semibold text-gray-700">Acción:</div>
                            <div className="text-gray-800">{msg.diagnosis.deterministic.accion}</div>
                          </div>
                          {msg.diagnosis.deterministic.razonamiento && (
                            <details className="p-2 bg-blue-50 rounded cursor-pointer">
                              <summary className="font-semibold text-gray-700 cursor-pointer hover:text-blue-600">
                                🧠 Traza del Motor de Inferencia
                              </summary>
                              <pre className="text-xs mt-2 whitespace-pre-wrap font-mono bg-gray-900 text-green-400 p-2 rounded border border-blue-200 overflow-x-auto">
                                {msg.diagnosis.deterministic.razonamiento}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Probabilistic Analysis */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                        📊 Análisis Probabilístico
                        <span className="text-xs font-normal text-gray-500">(Red Bayesiana)</span>
                      </h3>
                      {msg.diagnosis.probabilistic && !msg.diagnosis.probabilistic.error && (
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 bg-orange-50 rounded border border-orange-200">
                              <div className="font-semibold text-gray-700 text-xs">🦟 Dengue</div>
                              <div className="text-lg font-bold text-orange-600 mt-1">
                                {msg.diagnosis.probabilistic.dengue_probability}%
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-orange-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${msg.diagnosis.probabilistic.dengue_probability}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                              <div className="font-semibold text-gray-700 text-xs">🦠 COVID-19</div>
                              <div className="text-lg font-bold text-blue-600 mt-1">
                                {msg.diagnosis.probabilistic.covid_probability}%
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                                  style={{ width: `${msg.diagnosis.probabilistic.covid_probability}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="p-2 bg-purple-50 rounded border border-purple-200">
                              <div className="font-semibold text-gray-700 text-xs">🔀 Ambas</div>
                              <div className="text-lg font-bold text-purple-600 mt-1">
                                {msg.diagnosis.probabilistic.both_probability}%
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-purple-600 h-1.5 rounded-full transition-all"
                                  style={{ width: `${msg.diagnosis.probabilistic.both_probability}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="p-2 bg-white rounded text-gray-700">
                            {msg.diagnosis.probabilistic.analysis}
                          </div>
                        </div>
                      )}
                      {msg.diagnosis.probabilistic?.error && (
                        <div className="p-2 bg-red-50 text-red-700 rounded text-sm">
                          Error: {msg.diagnosis.probabilistic.error}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Options */}
      {currentQuestion && !isCompleted && (
        <div className="border-t p-4 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {currentQuestion.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => sendAnswer(option)}
                disabled={loading}
                className="px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition disabled:opacity-50"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completed state */}
      {isCompleted && (
        <div className="border-t p-4 bg-green-50 text-center">
          <p className="text-green-700 font-semibold mb-2">✅ Evaluación Completada</p>
          <button
            onClick={resetChat}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Nueva Evaluación
          </button>
        </div>
      )}
    </div>
  )
}

export default ChatMode
