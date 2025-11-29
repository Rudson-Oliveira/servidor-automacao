import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Wand2, Play, Save, FileText, Mail, Calendar, Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { VoiceControl } from "@/components/VoiceControl";

/**
 * Página de Automações Simplificadas para Usuários Leigos
 * Interface acessível com wizard passo-a-passo e tooltips explicativos
 */

type AutomationTemplate = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  steps: string[];
  example: string;
};

const templates: AutomationTemplate[] = [
  {
    id: "organizar-downloads",
    name: "Organizar Downloads",
    description: "Organize automaticamente seus arquivos baixados por tipo (documentos, imagens, vídeos)",
    icon: <FileText className="w-6 h-6" />,
    category: "Arquivos",
    steps: [
      "Escolha a pasta de Downloads",
      "Selecione os tipos de arquivo para organizar",
      "Defina onde cada tipo será movido",
      "Ative a automação"
    ],
    example: "PDFs vão para 'Documentos', fotos para 'Imagens', etc."
  },
  {
    id: "enviar-email-diario",
    name: "Email Diário",
    description: "Envie um email automático todos os dias com um resumo das suas tarefas",
    icon: <Mail className="w-6 h-6" />,
    category: "Comunicação",
    steps: [
      "Digite seu email",
      "Escolha o horário do envio",
      "Escreva o que quer no email",
      "Ative a automação"
    ],
    example: "Todo dia às 8h você recebe um email com suas tarefas do dia"
  },
  {
    id: "lembrete-reuniao",
    name: "Lembrete de Reunião",
    description: "Receba um aviso antes de cada reunião do seu calendário",
    icon: <Bell className="w-6 h-6" />,
    category: "Produtividade",
    steps: [
      "Conecte seu calendário",
      "Escolha quanto tempo antes quer ser avisado",
      "Escolha como quer ser avisado (som, notificação, email)",
      "Ative a automação"
    ],
    example: "15 minutos antes de cada reunião você recebe uma notificação"
  },
  {
    id: "backup-automatico",
    name: "Backup Automático",
    description: "Faça cópias de segurança dos seus arquivos importantes automaticamente",
    icon: <Save className="w-6 h-6" />,
    category: "Segurança",
    steps: [
      "Escolha quais pastas fazer backup",
      "Escolha onde salvar o backup",
      "Defina a frequência (diário, semanal, mensal)",
      "Ative a automação"
    ],
    example: "Todo domingo à noite seus documentos são copiados para o Google Drive"
  }
];

export default function AutomacoesSimples() {
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showVoiceControl, setShowVoiceControl] = useState(false);

  const handleVoiceCommand = (command: string) => {
    // Processar comando de voz e mapear para template
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes("organizar") && lowerCommand.includes("download")) {
      handleSelectTemplate(templates[0]);
      toast.success("✅ Automação selecionada por voz!");
    } else if (lowerCommand.includes("email")) {
      handleSelectTemplate(templates[1]);
      toast.success("✅ Automação selecionada por voz!");
    } else if (lowerCommand.includes("lembrete") || lowerCommand.includes("reunião")) {
      handleSelectTemplate(templates[2]);
      toast.success("✅ Automação selecionada por voz!");
    } else if (lowerCommand.includes("backup")) {
      handleSelectTemplate(templates[3]);
      toast.success("✅ Automação selecionada por voz!");
    } else {
      toast.info("🎯 Comando não reconhecido. Tente: 'organizar downloads', 'enviar email', 'lembrete de reunião' ou 'backup automático'");
    }
  };

  const handleSelectTemplate = (template: AutomationTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep(0);
    setFormData({});
  };

  const handleNextStep = () => {
    if (selectedTemplate && currentStep < selectedTemplate.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleActivate();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleActivate = () => {
    toast.success("✅ Automação ativada com sucesso!", {
      description: `A automação "${selectedTemplate?.name}" está funcionando agora.`
    });
    setSelectedTemplate(null);
    setCurrentStep(0);
    setFormData({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Wand2 className="w-10 h-10 text-indigo-600" />
            Automações Simples
          </h1>
          <p className="text-lg text-gray-600">
            Configure automações sem precisar de conhecimento técnico
          </p>
        </div>

        {/* Voice Control Toggle */}
        <div className="flex justify-center mb-6">
          <Button
            variant={showVoiceControl ? "default" : "outline"}
            size="lg"
            onClick={() => setShowVoiceControl(!showVoiceControl)}
            className="gap-2"
          >
            <Wand2 className="w-5 h-5" />
            {showVoiceControl ? "Ocultar Controle de Voz" : "Ativar Controle de Voz"}
          </Button>
        </div>

        {/* Voice Control Component */}
        {showVoiceControl && (
          <div className="mb-8">
            <VoiceControl onCommand={handleVoiceCommand} />
          </div>
        )}

        {!selectedTemplate ? (
          /* Template Selection */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-indigo-400"
                onClick={() => handleSelectTemplate(template)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                        {template.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{template.name}</CardTitle>
                        <span className="text-sm text-gray-500">{template.category}</span>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">Como funciona:</p>
                        <p className="text-sm">{template.example}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    {template.description}
                  </CardDescription>
                  <Button className="w-full" variant="default">
                    <Play className="w-4 h-4 mr-2" />
                    Configurar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Wizard Steps */
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                  {selectedTemplate.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl">{selectedTemplate.name}</CardTitle>
                  <CardDescription className="text-base">
                    Passo {currentStep + 1} de {selectedTemplate.steps.length}
                  </CardDescription>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / selectedTemplate.steps.length) * 100}%` }}
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Current Step */}
              <div className="bg-indigo-50 p-6 rounded-lg border-2 border-indigo-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    {currentStep + 1}
                  </span>
                  {selectedTemplate.steps[currentStep]}
                </h3>

                {/* Dynamic Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="input-field" className="text-base flex items-center gap-2">
                      Digite aqui
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            {selectedTemplate.steps[currentStep]} - {selectedTemplate.example}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input 
                      id="input-field"
                      placeholder={`Ex: ${selectedTemplate.example}`}
                      className="text-base mt-2"
                      value={formData[`step-${currentStep}`] || ""}
                      onChange={(e) => setFormData({ ...formData, [`step-${currentStep}`]: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Example Box */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2">💡 Exemplo:</p>
                <p className="text-sm text-yellow-700">{selectedTemplate.example}</p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                {currentStep > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handlePreviousStep}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                )}
                <Button 
                  onClick={handleNextStep}
                  className="flex-1"
                >
                  {currentStep === selectedTemplate.steps.length - 1 ? "Ativar Automação" : "Próximo"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-indigo-600" />
              Precisa de Ajuda?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Não se preocupe! Aqui você não precisa saber programação. Basta seguir os passos e preencher as informações que pedimos.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Clique no ícone <HelpCircle className="w-4 h-4 inline" /> para ver explicações detalhadas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Cada automação tem exemplos práticos para você entender melhor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>Você pode cancelar a qualquer momento e tentar novamente</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
