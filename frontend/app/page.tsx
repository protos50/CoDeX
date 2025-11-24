"use client"

import { useState } from "react"
import { DiagnosticForm } from "@/components/diagnostic-form"
import { ChatInterface } from "@/components/chat-interface"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Globe } from "lucide-react"
import { translations, type Language } from "@/lib/i18n"

export default function Home() {
  const [activeMode, setActiveMode] = useState<"form" | "chat">("form")
  const [language, setLanguage] = useState<Language>("es")
  const t = translations[language]

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-gradient-to-r from-white to-secondary/30">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setLanguage(language === "es" ? "en" : "es")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-medical-primary/30 hover:bg-medical-primary/5 transition-all font-medium text-foreground shadow-sm hover:shadow-md"
            >
              <Globe className="h-4 w-4" />
              {language === "es" ? "English" : "Español"}
            </button>
          </div>

          <header className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground font-sans">{t.header}</h1>
                <p className="text-lg text-muted-foreground font-medium mt-1">{t.subheader}</p>
              </div>
            </div>
          </header>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as "form" | "chat")} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-secondary/80 backdrop-blur-sm p-1">
            <TabsTrigger
              value="form"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              📋 {t.tabForm}
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              💬 {t.tabChat}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-0">
            <DiagnosticForm language={language} />
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <ChatInterface language={language} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
