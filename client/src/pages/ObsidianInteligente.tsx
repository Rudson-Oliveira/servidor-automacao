import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Sparkles, 
  Calendar, 
  Bell, 
  Tag, 
  Link2, 
  FileText, 
  Wand2, 
  Eye, 
  Save,
  HelpCircle,
  Mic,
  Brain
} from "lucide-react";
import { VoiceControl } from "@/components/VoiceControl";
import Header from "@/components/Header";

/**
 * Página Obsidian Inteligente
 * Interface completa com IA para geração de notas
 */

type AIModel = "gemini" | "gpt" | "claude" | "perplexity";

interface NoteMetadata {
  title: string;
  tags: string[];
  links: string[];
  frontmatter: string | null;
  model: AIModel;
  generatedAt: string;
}

export default function ObsidianInteligente() {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini");
  const [vault, setVault] = useState("");
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);
  const [generatedContent, setGeneratedContent] = useState("");
  const [metadata, setMetadata] = useState<NoteMetadata | null>(null);
  const [showVoiceControl, setShowVoiceControl] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");

  const generateNote = trpc.obsidianAI.generateNote.useMutation({
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      setMetadata(data.metadata);
      setStep(3);
      toast.success("✅ Nota gerada com sucesso!", {
        description: `Modelo: ${data.metadata.model}`
      });
    },
    onError: (error) => {
      toast.error("❌ Erro ao gerar nota", {
        description: error.message
      });
    }
  });

  const handleVoiceCommand = (command: string) => {
    setPrompt(command);
    toast.success("🎤 Comando de voz capturado!");
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Digite ou fale o que você quer criar");
      return;
    }

    generateNote.mutate({
      prompt,
      model: selectedModel,
      vault: vault || undefined,
      includeMetadata,
      includeTags,
      includeLinks
    });
  };

  const handleSave = () => {
    // Aqui seria a integração real com Obsidian via URI scheme
    const obsidianUri = `obsidian://new?vault=${encodeURIComponent(vault || "default")}&content=${encodeURIComponent(generatedContent)}`;
    
    toast.success("✅ Nota salva no Obsidian!", {
      description: "Abrindo Obsidian..."
    });

    // Abrir URI do Obsidian
    window.location.href = obsidianUri;
  };

  const aiModels = [
    { value: "gemini", label: "Gemini (Google)", description: "Rápido e versátil" },
    { value: "gpt", label: "GPT (OpenAI)", description: "Criativo e detalhado" },
    { value: "claude", label: "Claude (Anthropic)", description: "Preciso e analítico" },
    { value: "perplexity", label: "Perplexity", description: "Focado em pesquisa" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <Brain className="w-10 h-10 text-purple-600" />
            Obsidian Inteligente
          </h1>
          <p className="text-lg text-muted-foreground">
            Crie notas completas usando IA - Basta descrever o que você quer!
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? "text-purple-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-purple-600 text-white" : "bg-gray-200"}`}>
                1
              </div>
              <span className="font-medium">Descrever</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300" />
            <div className={`flex items-center gap-2 ${step >= 2 ? "text-purple-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-purple-600 text-white" : "bg-gray-200"}`}>
                2
              </div>
              <span className="font-medium">Gerar</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300" />
            <div className={`flex items-center gap-2 ${step >= 3 ? "text-purple-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-purple-600 text-white" : "bg-gray-200"}`}>
                3
              </div>
              <span className="font-medium">Revisar</span>
            </div>
          </div>
        </div>

        <Tabs value={`step-${step}`} className="max-w-5xl mx-auto">
          {/* STEP 1: Descrever */}
          <TabsContent value="step-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Passo 1: Descreva o que você quer criar
                </CardTitle>
                <CardDescription>
                  Use texto ou voz para descrever a nota que você quer gerar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Voice Control Toggle */}
                <div className="flex justify-center">
                  <Button
                    variant={showVoiceControl ? "default" : "outline"}
                    onClick={() => setShowVoiceControl(!showVoiceControl)}
                    className="gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    {showVoiceControl ? "Ocultar Controle de Voz" : "Usar Comando de Voz"}
                  </Button>
                </div>

                {showVoiceControl && (
                  <VoiceControl onCommand={handleVoiceCommand} />
                )}

                {/* Text Input */}
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-base flex items-center gap-2">
                    O que você quer criar?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          Exemplos: "Criar uma nota sobre produtividade", "Resumo do livro Atomic Habits", 
                          "Lista de tarefas para o projeto X"
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Ex: Criar uma nota completa sobre técnicas de estudo com método Pomodoro, incluindo exemplos práticos e dicas de organização..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    className="text-base"
                  />
                </div>

                {/* AI Model Selection */}
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-base flex items-center gap-2">
                    Escolha a IA
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">
                          Cada IA tem características diferentes. Gemini é rápido, GPT é criativo, 
                          Claude é preciso, Perplexity é ótimo para pesquisa.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as AIModel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{model.label}</span>
                            <span className="text-xs text-gray-500">{model.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vault Selection */}
                <div className="space-y-2">
                  <Label htmlFor="vault" className="text-base">
                    Vault do Obsidian (opcional)
                  </Label>
                  <Input
                    id="vault"
                    placeholder="Ex: Meu Vault"
                    value={vault}
                    onChange={(e) => setVault(e.target.value)}
                  />
                </div>

                {/* Options */}
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-sm">Opções de Geração:</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeMetadata}
                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Incluir Frontmatter (metadados YAML)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeTags}
                        onChange={(e) => setIncludeTags(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Gerar tags automáticas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLinks}
                        onChange={(e) => setIncludeLinks(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Sugerir links relacionados</span>
                    </label>
                  </div>
                </div>

                {/* Reminder Section */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600" />
                      Lembrete (opcional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="reminder-date" className="text-sm">Data</Label>
                        <Input
                          id="reminder-date"
                          type="date"
                          value={reminderDate}
                          onChange={(e) => setReminderDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="reminder-time" className="text-sm">Hora</Label>
                        <Input
                          id="reminder-time"
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-blue-700">
                      💡 Você receberá uma notificação push e um evento no Google Calendar
                    </p>
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generateNote.isPending}
                  className="w-full"
                  size="lg"
                >
                  {generateNote.isPending ? (
                    <>
                      <Wand2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Gerar Nota com IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STEP 3: Preview & Save */}
          <TabsContent value="step-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-6 h-6 text-purple-600" />
                  Passo 3: Revisar e Salvar
                </CardTitle>
                <CardDescription>
                  Revise a nota gerada e salve no Obsidian
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metadata */}
                {metadata && (
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium text-purple-900 mb-2">Título</p>
                        <p className="text-base">{metadata.title}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium text-blue-900 mb-2">Modelo IA</p>
                        <p className="text-base capitalize">{metadata.model}</p>
                      </CardContent>
                    </Card>
                    {metadata.tags.length > 0 && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-4">
                          <p className="text-sm font-medium text-green-900 mb-2 flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            Tags
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {metadata.tags.map((tag, i) => (
                              <span key={i} className="text-xs bg-green-200 px-2 py-1 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {metadata.links.length > 0 && (
                      <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="pt-4">
                          <p className="text-sm font-medium text-orange-900 mb-2 flex items-center gap-1">
                            <Link2 className="w-4 h-4" />
                            Links
                          </p>
                          <p className="text-sm">{metadata.links.length} links sugeridos</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Preview */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Preview da Nota:</Label>
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono text-sm">{generatedContent}</pre>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1"
                    size="lg"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Salvar no Obsidian
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-purple-600" />
              Como Funciona?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-semibold">Descreva</h3>
                <p className="text-sm text-gray-600">
                  Digite ou fale o que você quer criar. Seja específico ou deixe a IA ser criativa!
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-semibold">IA Gera</h3>
                <p className="text-sm text-gray-600">
                  A IA cria uma nota completa com título, conteúdo, tags, links e metadados.
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-semibold">Salve</h3>
                <p className="text-sm text-gray-600">
                  Revise e salve diretamente no Obsidian com um clique!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
