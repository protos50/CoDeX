"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import { DecisionTree } from "@/components/decision-tree"
import type { Language } from "@/lib/i18n"
import { translations } from "@/lib/i18n"

interface DiagnosticResultsProps {
  results: {
    deterministic: {
      clasificacion: string
      justificacion: string
      accion: string
      razonamiento: string
    }
    probabilistic: {
      dengue_probability: number
      covid_probability: number
      both_probability: number
      analysis: string
      sintomas_evaluados?: string[]
      contexto_epidemiologico?: {
        lugar: string
        estacion: string
        viaje_brasil: boolean
        contacto_dengue: boolean
      }
      detalles_componentes?: {
        contexto: Record<string, number>
        sintomas: Record<string, number>
        nota_metodo: string
      }
    }
  }
  language: Language
}

export function DiagnosticResults({ results, language }: DiagnosticResultsProps) {
  const t = translations[language]
  const [traceOpen, setTraceOpen] = useState(false)
  const [treeOpen, setTreeOpen] = useState(false)

  return (
    <div className="space-y-6">
      <Alert className="border-accent bg-accent/5">
        <Info className="h-4 w-4 text-accent" />
        <AlertDescription className="text-sm leading-relaxed text-foreground">
          <strong>{t.methodComparison}</strong>
          <br />
          <span className="text-muted-foreground">
            <strong>{t.deterministicAnalysis}:</strong> {t.deterministicDesc}
            <br />
            <strong>{t.probabilisticAnalysis}:</strong> {t.probabilisticDesc}
            <br />
            {t.bothValidDesc}
          </span>
        </AlertDescription>
      </Alert>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <h3 className="text-xl font-semibold">{t.deterministicAnalysis}</h3>
          <p className="text-sm text-primary-foreground/80 mt-1">{t.deterministicSubtitle}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">{t.classification}</h4>
            <p className="text-muted-foreground leading-relaxed">{results.deterministic.clasificacion}</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t.justification}</h4>
            <p className="text-muted-foreground leading-relaxed">{results.deterministic.justificacion}</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">{t.recommendedAction}</h4>
            <p className="text-muted-foreground leading-relaxed font-medium">{results.deterministic.accion}</p>
          </div>

          <Collapsible open={traceOpen} onOpenChange={setTraceOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm">
              {traceOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {t.inferenceTrace}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="bg-secondary p-4 rounded-lg font-mono text-xs md:text-sm overflow-x-auto leading-relaxed border border-border">
                <pre className="whitespace-pre-wrap text-muted-foreground">{results.deterministic.razonamiento}</pre>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={treeOpen} onOpenChange={setTreeOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm">
              {treeOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {t.decisionTree}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <DecisionTree trace={results.deterministic.razonamiento} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="bg-accent text-accent-foreground p-6 rounded-t-lg">
          <h3 className="text-xl font-semibold">{t.probabilisticAnalysis}</h3>
          <p className="text-sm text-accent-foreground/80 mt-1">{t.probabilisticSubtitle}</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Dengue Card */}
            <Card className="border-2 border-[#f97316]/20 bg-[#f97316]/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.dengue}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-[#f97316]">
                    {results.probabilistic.dengue_probability.toFixed(2)}%
                  </div>
                  <Progress
                    value={results.probabilistic.dengue_probability}
                    className="h-2 bg-[#f97316]/20"
                    indicatorClassName="bg-[#f97316]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* COVID Card */}
            <Card className="border-2 border-[#0891b2]/20 bg-[#0891b2]/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.covid}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-[#0891b2]">
                    {results.probabilistic.covid_probability.toFixed(2)}%
                  </div>
                  <Progress
                    value={results.probabilistic.covid_probability}
                    className="h-2 bg-[#0891b2]/20"
                    indicatorClassName="bg-[#0891b2]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Coinfection Card */}
            <Card className="border-2 border-[#8b5cf6]/20 bg-[#8b5cf6]/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t.coinfection}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-[#8b5cf6]">
                    {results.probabilistic.both_probability.toFixed(2)}%
                  </div>
                  <Progress
                    value={results.probabilistic.both_probability}
                    className="h-2 bg-[#8b5cf6]/20"
                    indicatorClassName="bg-[#8b5cf6]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-secondary p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">{results.probabilistic.analysis}</p>
          </div>

          {results.probabilistic.detalles_componentes && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm mt-2">
                <ChevronRight className="h-4 w-4" />
                {t.bayesianDetails}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <p>
                    {t.bayesianNote}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{t.contextUsed}</h4>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>{t.location}: {results.probabilistic.contexto_epidemiologico?.lugar}</li>
                      <li>{t.season}: {results.probabilistic.contexto_epidemiologico?.estacion}</li>
                      <li>{t.recentBrazilTrip}: {results.probabilistic.contexto_epidemiologico?.viaje_brasil ? (language === "es" ? "Sí" : "Yes") : "No"}</li>
                      <li>{t.dengueContact}: {results.probabilistic.contexto_epidemiologico?.contacto_dengue ? (language === "es" ? "Sí" : "Yes") : "No"}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{t.symptomsConsidered}</h4>
                    <p className="mb-1">
                      {t.active}: {results.probabilistic.sintomas_evaluados?.length || 0} 
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {results.probabilistic.sintomas_evaluados?.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-background/60 border border-dashed border-border rounded-lg p-3 text-[11px] text-muted-foreground">
                  {results.probabilistic.detalles_componentes.nota_metodo}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  )
}
