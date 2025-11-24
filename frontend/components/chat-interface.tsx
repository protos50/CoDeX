"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DiagnosticResults } from "@/components/diagnostic-results"
import { Loader2, Stethoscope, User } from "lucide-react"
import type { Language } from "@/lib/i18n"
import { translations } from "@/lib/i18n"

interface Message {
  role: "bot" | "user"
  content: string
  options?: string[] | null
  diagnosis?: any
}

interface Question {
  question: string
  type: string
  options: string[] | null
  question_id: string
}

export function ChatInterface({ language }: { language: Language }) {
  const t = translations[language]
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const startChat = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:8000/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      })

      if (!response.ok) throw new Error("Error al iniciar chat")

      const data = await response.json()
      setSessionId(data.session_id)
      setCurrentQuestion(data.question)
      setMessages([
        {
          role: "bot",
          content: data.question.question,
          options: data.question.options,
        },
      ])
      setIsCompleted(false)
    } catch (error) {
      console.error("Error starting chat:", error)
      setMessages([
        {
          role: "bot",
          content: t.errorBackend,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const sendAnswer = async (answer: string) => {
    if (!sessionId || !answer.trim()) return

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: answer }])
    setLoading(true)
    setInputValue("")

    try {
      const response = await fetch(`http://localhost:8000/chat/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      })

      if (!response.ok) throw new Error("Error al enviar respuesta")

      const data = await response.json()

      if (data.completed) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: data.message,
            diagnosis: data.diagnosis,
          },
        ])
        setIsCompleted(true)
        setCurrentQuestion(null)
      } else {
        setCurrentQuestion(data.next_question)
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: data.next_question.question,
            options: data.next_question.options,
          },
        ])
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: t.errorResponse,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = () => {
    setMessages([])
    setSessionId(null)
    setCurrentQuestion(null)
    setIsCompleted(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-medical-primary to-medical-secondary text-white py-4 px-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            {t.chatTitle}
          </h2>
        </div>
        <div className="p-6 bg-gradient-to-b from-white to-medical-light/20">
          {!sessionId ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🩺</div>
              <h3 className="text-xl font-semibold mb-2">{t.chatWelcome}</h3>
              <p className="text-gray-600 mb-6">{t.chatWelcomeDesc}</p>
              <Button
                onClick={startChat}
                disabled={loading}
                className="bg-medical-primary hover:bg-medical-primary/90 text-white px-6 py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {t.starting}
                  </>
                ) : (
                  t.startEvaluation
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-2">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "bot" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-medical-primary to-medical-secondary flex items-center justify-center shadow-md">
                        <Stethoscope className="h-4 w-4 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-md ${
                        msg.role === "bot"
                          ? "bg-white border border-medical-light text-foreground"
                          : "bg-gradient-to-br from-medical-primary to-medical-primary/90 text-white"
                      }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
                    </div>

                    {msg.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-md">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start gap-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-medical-primary to-medical-secondary flex items-center justify-center shadow-md">
                      <Stethoscope className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white border border-medical-light text-foreground rounded-2xl px-5 py-3 shadow-md">
                      <Loader2 className="h-5 w-5 animate-spin text-medical-primary" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {!isCompleted && !loading && currentQuestion && (
                <div className="space-y-3">
                  {currentQuestion.options && currentQuestion.type !== "number" ? (
                    <div className="flex gap-3 justify-end flex-wrap">
                      {currentQuestion.options.map((option) => (
                        <Button
                          key={option}
                          onClick={() => sendAnswer(option)}
                          className="bg-medical-primary hover:bg-medical-primary/90 text-white min-w-[100px] shadow-md hover:shadow-lg transition-shadow"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (inputValue.trim()) {
                          sendAnswer(inputValue.trim())
                        }
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        type={currentQuestion.type === "number" ? "number" : "text"}
                        step={currentQuestion.type === "number" ? "0.1" : undefined}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={currentQuestion.type === "number" ? t.tempExample : t.yourAnswer}
                        className="flex-1"
                        disabled={loading}
                        autoFocus
                      />
                      <Button type="submit" disabled={loading || !inputValue.trim()} className="bg-medical-primary">
                        {t.send}
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {messages.some((m) => m.diagnosis) && (
                <div className="mt-6 space-y-6">
                  <DiagnosticResults results={messages.find((m) => m.diagnosis)?.diagnosis || null} language={language} />
                  <Button
                    onClick={handleRestart}
                    className="w-full bg-medical-secondary hover:bg-medical-secondary/90 text-white"
                  >
                    🔄 {t.newEvaluation}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
