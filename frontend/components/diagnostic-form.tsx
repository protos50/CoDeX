"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DiagnosticResults } from "@/components/diagnostic-results"
import { Loader2, AlertTriangle } from "lucide-react"
import { translations, type Language } from "@/lib/i18n"

interface FormData {
  fiebre: boolean
  temperatura?: number | null
  tos: boolean
  dolor_garganta: boolean
  dolor_retroocular: boolean
  mialgia: boolean
  anosmia: boolean
  asma: boolean
  hipertension: boolean
  viaje_brasil: boolean
  contacto_dengue: boolean
  lugar: string
  estacion: string
  dolor_abdominal_intenso: boolean
  sangrado_mucosas: boolean
  disnea: boolean
}

const TP4_DATA: FormData = {
  fiebre: true,
  temperatura: 38.5,
  tos: true,
  dolor_garganta: true,
  dolor_retroocular: false,
  mialgia: true,
  anosmia: false,
  asma: true,
  hipertension: true,
  viaje_brasil: true,
  contacto_dengue: true,
  lugar: "Corrientes",
  estacion: "Verano",
  dolor_abdominal_intenso: false,
  sangrado_mucosas: false,
  disnea: false,
}

interface DiagnosticFormProps {
  language: Language
}

export function DiagnosticForm({ language }: DiagnosticFormProps) {
  const t = translations[language]

  const [formData, setFormData] = useState<FormData>({
    fiebre: false,
    temperatura: null,
    tos: false,
    dolor_garganta: false,
    dolor_retroocular: false,
    mialgia: false,
    anosmia: false,
    asma: false,
    hipertension: false,
    viaje_brasil: false,
    contacto_dengue: false,
    lugar: "Otro",
    estacion: "Verano",
    dolor_abdominal_intenso: false,
    sangrado_mucosas: false,
    disnea: false,
  })
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleCheckboxChange = (field: keyof FormData) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: !prev[field] }
      // Si desmarcan fiebre, limpiar temperatura
      if (field === 'fiebre' && prev.fiebre) {
        newData.temperatura = null
      }
      return newData
    })
  }

  const handleTemperatureChange = (value: string) => {
    const temp = value === '' ? null : parseFloat(value)
    setFormData((prev) => ({ ...prev, temperatura: temp }))
  }

  const handleSelectChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const loadTP4Case = () => {
    setFormData(TP4_DATA)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("http://localhost:8000/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, language }),
      })

      if (!response.ok) throw new Error("Error en la consulta")

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("[v0] Error al diagnosticar:", error)
      alert(t.error)
    } finally {
      setLoading(false)
    }
  }

  const hasUrgentSymptoms = formData.dolor_abdominal_intenso || formData.sangrado_mucosas || formData.disnea

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-lg border border-border/50">
        <div className="bg-gradient-to-r from-[#0d9488] to-[#06b6d4] text-white p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl">🩺</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{t.patientData}</h2>
              <p className="text-sm text-white/95 mt-1">{t.completeForm}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {hasUrgentSymptoms && (
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 animate-pulse shadow-lg">
                <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{t.urgentDetected}</span>
                </div>
                <p className="text-sm text-red-600">{t.urgentDescription}</p>
              </div>
            )}

            <div className="space-y-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-5 rounded-r-lg shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-lg text-amber-900">{t.urgentSymptoms}</h3>
              </div>
              <div className="space-y-3">
                {[
                  { id: "dolor_abdominal_intenso", label: t.abdominalPain || "Dolor abdominal intenso", icon: "🔥" },
                  { id: "sangrado_mucosas", label: t.bleeding, icon: "🩸" },
                  { id: "disnea", label: t.respiratoryDifficulty, icon: "🫁" },
                ].map(({ id, label, icon }) => (
                  <div
                    key={id}
                    className="flex items-center space-x-3 bg-white/60 rounded-lg p-3 hover:bg-white/90 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <Checkbox
                      id={id}
                      checked={formData[id as keyof FormData] as boolean}
                      onCheckedChange={() => handleCheckboxChange(id as keyof FormData)}
                      className="border-amber-600 data-[state=checked]:bg-amber-600 cursor-pointer"
                    />
                    <Label
                      htmlFor={id}
                      className="cursor-pointer text-base text-amber-900 font-medium flex items-center gap-2"
                    >
                      <span className="text-xl">{icon}</span>
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 p-5 rounded-lg border border-teal-100">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <span>🌡️</span>
                </div>
                {t.currentSymptoms}
              </h3>
              <div className="space-y-3">
                {[
                  { id: "fiebre", label: t.fever, icon: "🌡️" },
                  { id: "tos", label: t.cough, icon: "🤧" },
                  { id: "dolor_garganta", label: t.soreThroat, icon: "😷" },
                  { id: "dolor_retroocular", label: t.retroocularPain || "Dolor detrás de los ojos", icon: "👁️" },
                  { id: "mialgia", label: t.musclePain || "Dolor muscular intenso", icon: "💪" },
                  { id: "anosmia", label: t.lossOfSmell || "Pérdida de olfato", icon: "👃" },
                ].map(({ id, label, icon }) => (
                  <div
                    key={id}
                    className="flex items-center space-x-3 bg-white/70 rounded-lg p-3 hover:bg-white hover:shadow-md hover:scale-105 transition-all cursor-pointer group"
                  >
                    <Checkbox
                      id={id}
                      checked={formData[id as keyof FormData] as boolean}
                      onCheckedChange={() => handleCheckboxChange(id as keyof FormData)}
                      className="border-primary data-[state=checked]:bg-primary cursor-pointer"
                    />
                    <Label htmlFor={id} className="cursor-pointer text-base flex items-center gap-2 font-medium">
                      <span className="text-xl group-hover:scale-125 transition-transform">{icon}</span>
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
              
              {/* Input condicional de temperatura */}
              {formData.fiebre && (
                <div className="mt-4 bg-white/70 rounded-lg p-4 border-2 border-amber-200">
                  <Label htmlFor="temperatura" className="text-base font-medium text-amber-900 mb-2 block">
                    🌡️ {t.bodyTemperature}
                  </Label>
                  <Input
                    id="temperatura"
                    type="number"
                    step="0.1"
                    min="35"
                    max="43"
                    value={formData.temperatura ?? ''}
                    onChange={(e) => handleTemperatureChange(e.target.value)}
                    placeholder="Ej: 38.5"
                    className="bg-white border-amber-300 focus:border-amber-500"
                  />
                  <p className="text-xs text-amber-700 mt-1">
                    {t.enterTemperature}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-5 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span>💊</span>
                </div>
                {t.medicalHistory}
              </h3>
              <div className="space-y-3">
                {[
                  { id: "asma", label: t.asthma, icon: "🫁" },
                  { id: "hipertension", label: t.hypertension, icon: "💊" },
                ].map(({ id, label, icon }) => (
                  <div
                    key={id}
                    className="flex items-center space-x-3 bg-white/70 rounded-lg p-3 hover:bg-white hover:shadow-md hover:scale-105 transition-all cursor-pointer group"
                  >
                    <Checkbox
                      id={id}
                      checked={formData[id as keyof FormData] as boolean}
                      onCheckedChange={() => handleCheckboxChange(id as keyof FormData)}
                      className="border-primary data-[state=checked]:bg-primary cursor-pointer"
                    />
                    <Label htmlFor={id} className="cursor-pointer text-base flex items-center gap-2 font-medium">
                      <span className="text-xl group-hover:scale-125 transition-transform">{icon}</span>
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-5 rounded-lg border border-purple-100">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span>🌍</span>
                </div>
                {t.epidemiologicalContext}
              </h3>
              <div className="space-y-3">
                {[
                  { id: "viaje_brasil", label: t.recentBrazilTrip, icon: "✈️" },
                  { id: "contacto_dengue", label: t.dengueContact, icon: "🤝" },
                ].map(({ id, label, icon }) => (
                  <div
                    key={id}
                    className="flex items-center space-x-3 bg-white/70 rounded-lg p-3 hover:bg-white hover:shadow-md hover:scale-105 transition-all cursor-pointer group"
                  >
                    <Checkbox
                      id={id}
                      checked={formData[id as keyof FormData] as boolean}
                      onCheckedChange={() => handleCheckboxChange(id as keyof FormData)}
                      className="border-primary data-[state=checked]:bg-primary cursor-pointer"
                    />
                    <Label htmlFor={id} className="cursor-pointer text-base flex items-center gap-2 font-medium">
                      <span className="text-xl group-hover:scale-125 transition-transform">{icon}</span>
                      {label}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="space-y-2 bg-white/70 rounded-lg p-3 hover:bg-white hover:shadow-md transition-all">
                <Label htmlFor="lugar" className="flex items-center gap-2 font-medium">
                  <span className="text-xl">📍</span>
                  {t.location}
                </Label>
                <Select value={formData.lugar} onValueChange={(v) => handleSelectChange("lugar", v)}>
                  <SelectTrigger id="lugar" className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corrientes">Corrientes</SelectItem>
                    <SelectItem value="Otro">{language === "es" ? "Otro" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 bg-white/70 rounded-lg p-3 hover:bg-white hover:shadow-md transition-all">
                <Label htmlFor="estacion" className="flex items-center gap-2 font-medium">
                  <span className="text-xl">🌤️</span>
                  {t.season}
                </Label>
                <Select value={formData.estacion} onValueChange={(v) => handleSelectChange("estacion", v)}>
                  <SelectTrigger id="estacion" className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Verano">{t.summer}</SelectItem>
                    <SelectItem value="Invierno">{t.winter}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={loadTP4Case}
                className="flex-1 border-2 border-accent text-accent hover:bg-accent hover:text-white bg-white shadow-md hover:shadow-lg transition-all"
              >
                <span className="mr-2">📁</span>
                {t.loadTP4}
              </Button>
              {results && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResults(null)}
                  className="flex-1 border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white bg-white shadow-md hover:shadow-lg transition-all"
                >
                  <span className="mr-2">🔄</span>
                  Nuevo Diagnóstico
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-medical-primary to-medical-secondary hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.analyzing}
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔍</span>
                    {t.diagnose}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div>
        {results ? (
          <DiagnosticResults results={results} language={language} />
        ) : (
          <Card className="bg-gradient-to-br from-secondary/30 to-accent/10 backdrop-blur-sm shadow-lg border border-border/50 h-full flex items-center justify-center">
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🔬</div>
              <p className="text-muted-foreground text-lg">
                {t.completeFormPrompt} <br />
                <span className="font-semibold text-primary">{t.diagnose}</span>{" "}
                {language === "es" ? "para ver los resultados" : "to see results"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
