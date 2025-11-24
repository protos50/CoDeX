"use client"

import { useCallback, useEffect, useState } from "react"
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
} from "reactflow"
import "reactflow/dist/style.css"
import { Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DecisionTreeProps {
  trace: string
}

interface ScoreData {
  symptom: string
  covidScore: number
  dengueScore: number
}

export function DecisionTree({ trace }: DecisionTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const { parsedNodes, parsedEdges } = parseTraceToFlow(trace)
    setNodes(parsedNodes)
    setEdges(parsedEdges)
  }, [trace, setNodes, setEdges])

  const toggleFullscreen = () => {
    const element = document.getElementById("decision-tree-container")
    if (!element) return

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  return (
    <div id="decision-tree-container" className="relative h-[600px] bg-gray-50 rounded-lg border-2 border-gray-200">
      <Button
        onClick={toggleFullscreen}
        variant="outline"
        size="sm"
        className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="h-4 w-4 mr-1" />
            Salir
          </>
        ) : (
          <>
            <Maximize2 className="h-4 w-4 mr-1" />
            Pantalla Completa
          </>
        )}
      </Button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.5}
        maxZoom={2}
      >
        <Background color="#94a3b8" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data.type === "start") return "#22c55e"
            if (node.data.type === "alarm") return "#ef4444"
            if (node.data.type === "score") return "#3b82f6"
            if (node.data.type === "final") return "#f59e0b"
            return "#9ca3af"
          }}
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  )
}

function parseTraceToFlow(trace: string): { parsedNodes: Node[]; parsedEdges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Handle missing or invalid trace
  if (!trace || typeof trace !== 'string') {
    return { parsedNodes: nodes, parsedEdges: edges }
  }

  // Parse the trace sections
  const lines = trace.split("\n")
  let currentY = 0
  const ySpacing = 120
  const centerX = 400

  // 1. Start Node
  const startLine = lines.find((l) => l.includes("---") && (l.includes("INICIO") || l.includes("START")))
  const startLabel = startLine 
    ? (startLine.includes("START") ? "🩺 Start" : "🩺 Inicio")
    : "🩺 Inicio"
  const startSubLabel = startLine
    ? (startLine.includes("START") ? "Hybrid Diagnosis V2" : "Diagnóstico Híbrido V2")
    : "Diagnóstico Híbrido V2"

  nodes.push({
    id: "start",
    type: "default",
    position: { x: centerX, y: currentY },
    data: {
      label: (
        <div className="px-4 py-2 text-center">
          <div className="font-bold text-gray-800">{startLabel}</div>
          <div className="text-xs text-gray-600">{startSubLabel}</div>
        </div>
      ),
      type: "start",
    },
    style: {
      background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.25) 100%)",
      border: "2px solid rgba(34, 197, 94, 0.5)",
      borderRadius: "12px",
      width: 200,
      backdropFilter: "blur(10px)",
    },
  })
  currentY += ySpacing

  // 2. Parse Alarm Signs - match both languages
  const alarmSection = lines.find((l) => l.includes("[1]") && (l.includes("Evaluando") || l.includes("Evaluating")))
  const alarmLabel = alarmSection && alarmSection.includes("Evaluating") ? "⚠️ Alarm Signs" : "⚠️ Signos de Alarma"
  if (alarmSection) {
    const alarmLines = lines.filter((l) => l.includes("⚠️") && (l.includes("ALARMA ACTIVADA") || l.includes("ALARM ACTIVATED")))

    if (alarmLines.length > 0) {
      nodes.push({
        id: "alarm",
        type: "default",
        position: { x: centerX, y: currentY },
        data: {
          label: (
            <div className="px-4 py-2 text-center">
              <div className="font-bold text-red-900">{alarmLabel}</div>
              <div className="text-xs text-red-700 mt-1">
                {alarmLines.map((line, idx) => {
                  // Match both Spanish and English patterns
                  const match = line.match(/: ([\w_]+) ->/)
                  return match ? <div key={idx}>{match[1]}</div> : null
                })}
              </div>
            </div>
          ),
          type: "alarm",
        },
        style: {
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.25) 100%)",
          border: "2px solid rgba(239, 68, 68, 0.5)",
          borderRadius: "12px",
          width: 220,
          backdropFilter: "blur(10px)",
        },
      })

      edges.push({
        id: "e-start-alarm",
        source: "start",
        target: "alarm",
        animated: true,
        style: { stroke: "rgba(239, 68, 68, 0.6)", strokeWidth: 3 },
      })
      currentY += ySpacing
    } else {
      // No alarms, show normal evaluation
      const noAlarmLabel = lines.some(l => l.includes("Evaluating")) ? "✅ No Alarms" : "✅ Sin Alarmas"
      const evalLabel = lines.some(l => l.includes("Evaluating")) ? "Normal evaluation" : "Evaluación normal"
      
      nodes.push({
        id: "no-alarm",
        type: "default",
        position: { x: centerX, y: currentY },
        data: {
          label: (
            <div className="px-4 py-2 text-center">
              <div className="font-bold text-gray-700">{noAlarmLabel}</div>
              <div className="text-xs text-gray-600">{evalLabel}</div>
            </div>
          ),
          type: "normal",
        },
        style: {
          background: "rgba(241, 245, 249, 0.8)",
          border: "2px solid rgba(203, 213, 225, 0.6)",
          borderRadius: "12px",
          width: 180,
          backdropFilter: "blur(10px)",
        },
      })

      edges.push({
        id: "e-start-noalarm",
        source: "start",
        target: "no-alarm",
        style: { stroke: "rgba(100, 116, 139, 0.5)" },
      })
      currentY += ySpacing
    }
  }

  // 3. Parse Score Calculation
  const scoreLines = lines.filter((l) => l.match(/-> .+: COVID\([+-]\d+\) \| Dengue\([+-]\d+\)/))
  const scores: ScoreData[] = []

  scoreLines.forEach((line) => {
    const match = line.match(/-> (.+): COVID\(([+-]\d+)\) \| Dengue\(([+-]\d+)\)/)
    if (match) {
      scores.push({
        symptom: match[1].trim(),
        covidScore: parseInt(match[2]),
        dengueScore: parseInt(match[3]),
      })
    }
  })

  // Parse fever line separately - match both languages
  const feverLine = lines.find((l) => 
    (l.includes("Fiebre Alta") || l.includes("High Fever") || 
     l.includes("Hiperpirexia") || l.includes("Hyperpyrexia") ||
     l.includes("Febrícula") || l.includes("Low-Grade Fever"))
  )
  if (feverLine) {
    const match = feverLine.match(/(Fiebre Alta|High Fever|Hiperpirexia|Hyperpyrexia|Febrícula|Low-Grade Fever) \((.+?)°C\): Dengue\(([+-]\d+)\)/)
    if (match) {
      scores.push({
        symptom: `${match[1]} (${match[2]}°C)`,
        covidScore: 0,
        dengueScore: parseInt(match[3]),
      })
    }
  }

  // Create score nodes
  if (scores.length > 0) {
    const scoreNodeWidth = 280
    const startX = centerX - (scores.length * scoreNodeWidth) / 2

    scores.forEach((score, idx) => {
      const nodeId = `score-${idx}`
      const x = startX + idx * (scoreNodeWidth + 20)

      nodes.push({
        id: nodeId,
        type: "default",
        position: { x, y: currentY },
        data: {
          label: (
            <div className="px-3 py-2 text-center">
              <div className="font-bold text-gray-800 text-sm mb-1">{score.symptom}</div>
              <div className="flex gap-2 justify-center text-xs">
                <div className="bg-cyan-500/20 border border-cyan-500/40 px-2 py-1 rounded text-cyan-900 font-medium">
                  COVID: {score.covidScore > 0 ? "+" : ""}
                  {score.covidScore}
                </div>
                <div className="bg-orange-500/20 border border-orange-500/40 px-2 py-1 rounded text-orange-900 font-medium">
                  Dengue: {score.dengueScore > 0 ? "+" : ""}
                  {score.dengueScore}
                </div>
              </div>
            </div>
          ),
          type: "score",
        },
        style: {
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.18) 100%)",
          border: "2px solid rgba(59, 130, 246, 0.4)",
          borderRadius: "12px",
          width: scoreNodeWidth - 20,
          backdropFilter: "blur(10px)",
        },
      })

      edges.push({
        id: `e-prev-${nodeId}`,
        source: alarmSection && lines.some((l) => l.includes("⚠️ ALARMA")) ? "alarm" : "no-alarm",
        target: nodeId,
        style: { stroke: "rgba(100, 116, 139, 0.4)" },
      })
    })

    currentY += ySpacing + 40
  }

  // 4. Parse Final Scores - match both languages
  const finalScoreLine = lines.find((l) => (l.includes("[SCORES FINALES]") || l.includes("[FINAL SCORES]")))
  if (finalScoreLine) {
    const match = finalScoreLine.match(/Dengue: (-?\d+) \| COVID: (-?\d+)/)
    if (match) {
      const dengueScore = parseInt(match[1])
      const covidScore = parseInt(match[2])
      const isEnglish = finalScoreLine.includes("FINAL SCORES")
      const finalLabel = isEnglish ? "📊 Final Scores" : "📊 Scores Finales"

      nodes.push({
        id: "final-scores",
        type: "default",
        position: { x: centerX, y: currentY },
        data: {
          label: (
            <div className="px-6 py-3 text-center">
              <div className="font-bold text-gray-800 text-lg mb-2">{finalLabel}</div>
              <div className="flex gap-4 justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{dengueScore}</div>
                  <div className="text-xs text-gray-700">Dengue</div>
                </div>
                <div className="text-gray-400 text-2xl">|</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">{covidScore}</div>
                  <div className="text-xs text-gray-700">COVID</div>
                </div>
              </div>
            </div>
          ),
          type: "final",
        },
        style: {
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%)",
          border: "3px solid rgba(245, 158, 11, 0.5)",
          borderRadius: "16px",
          width: 280,
          backdropFilter: "blur(10px)",
        },
      })

      // Connect last score nodes to final
      if (scores.length > 0) {
        scores.forEach((_, idx) => {
          edges.push({
            id: `e-score${idx}-final`,
            source: `score-${idx}`,
            target: "final-scores",
            animated: true,
            style: { stroke: "rgba(245, 158, 11, 0.6)", strokeWidth: 2 },
          })
        })
      }
    }
  }

  return { parsedNodes: nodes, parsedEdges: edges }
}
