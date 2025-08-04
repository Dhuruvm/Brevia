import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Plus, Search, FileText, Users, ChevronRight, Activity, Zap } from "lucide-react";
import { AGENT_CONFIGS } from "@/lib/ai-agents";

export default function Home() {
  const [, navigate] = useLocation();

  const handleStartChat = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-6xl">🤖</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Brevia AI
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Autonomous AI agent system with specialized intelligence for research, notes, documents, and professional tasks
          </p>
        </div>

        {/* Quick Start */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Activity className="h-5 w-5" />
                Start Your AI Agent
              </CardTitle>
              <CardDescription>
                Our intelligent system will automatically select the best agent for your task
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button 
                size="lg" 
                onClick={handleStartChat}
                className="text-lg px-8"
              >
                <Zap className="mr-2 h-5 w-5" />
                Launch Brevia AI
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Agent Types */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-8">Available AI Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(AGENT_CONFIGS).map(([key, agent]) => (
              <Card 
                key={key}
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/30"
                onClick={handleStartChat}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-3xl mb-2">
                      {agent.icon}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="text-xl">{agent.name}</CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Capabilities:</p>
                    <div className="space-y-1">
                      {agent.capabilities.slice(0, 3).map((capability, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          • {capability}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Why Choose Brevia AI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 text-4xl">
                  🧠
                </div>
                <CardTitle className="text-lg">Autonomous Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Self-learning agents that adapt and improve with each task
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 text-4xl">
                  🔍
                </div>
                <CardTitle className="text-lg">Advanced Research</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Comprehensive research with source validation and academic-grade citations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 text-4xl">
                  📄
                </div>
                <CardTitle className="text-lg">Professional Output</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Generate publication-ready documents, reports, and presentations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Features */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-semibold text-center mb-8">Powered by Open Source</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🤗</span>
                  Hugging Face Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Powered by state-of-the-art language models including Llama, Mistral, and Phi-3
                </p>
                <div className="space-y-1">
                  <Badge variant="outline">Mistral 7B</Badge>
                  <Badge variant="outline">Phi-3 Medium</Badge>
                  <Badge variant="outline">BGE Embeddings</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  Real-time Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Live workflow tracking with step-by-step progress and quality metrics
                </p>
                <div className="space-y-1">
                  <Badge variant="outline">Live Progress</Badge>
                  <Badge variant="outline">Quality Scoring</Badge>
                  <Badge variant="outline">Performance Metrics</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}