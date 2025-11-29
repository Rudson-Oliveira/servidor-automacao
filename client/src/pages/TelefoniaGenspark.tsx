import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Phone, 
  Clock, 
  Settings, 
  BarChart3, 
  MessageSquare,
  Users,
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Copy,
  Check,
  Play,
  Calendar,
  TrendingUp
} from "lucide-react";
import Header from "@/components/Header";

/**
 * Página de Telefonia com Genspark
 * Atendimento telefônico inteligente via IA
 */

export default function TelefoniaGenspark() {
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);
  const [testMessage, setTestMessage] = useState("");

  const { data: phoneData, isLoading: phoneLoading } = trpc.telephony.getPhoneNumber.useQuery();
  const { data: configData, isLoading: configLoading } = trpc.telephony.getConfig.useQuery();
  const { data: statsData } = trpc.telephony.getStatistics.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });
  const { data: callHistory } = trpc.telephony.getCallHistory.useQuery({
    limit: 10,
  });
  const { data: templates } = trpc.telephony.getUseCaseTemplates.useQuery();

  const updateConfig = trpc.telephony.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("✅ Configuração atualizada!");
    },
    onError: (error) => {
      toast.error("❌ Erro ao atualizar", {
        description: error.message,
      });
    },
  });

  const testCall = trpc.telephony.testCall.useMutation({
    onSuccess: (data) => {
      toast.success("✅ Teste concluído!", {
        description: `Resposta: ${data.response}`,
      });
    },
  });

  const applyTemplate = trpc.telephony.applyTemplate.useMutation({
    onSuccess: () => {
      toast.success("✅ Template aplicado!");
    },
  });

  const handleCopyPhone = () => {
    if (phoneData?.phoneNumber) {
      navigator.clipboard.writeText(phoneData.phoneNumber);
      setCopied(true);
      toast.success("📋 Número copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestCall = () => {
    if (!testMessage.trim()) {
      toast.error("Digite uma mensagem para testar");
      return;
    }

    testCall.mutate({ message: testMessage });
  };

  if (phoneLoading || configLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <Phone className="w-10 h-10 text-blue-600" />
            Telefonia Genspark
          </h1>
          <p className="text-lg text-muted-foreground">
            Atendimento telefônico inteligente 24/7 com IA
          </p>
        </div>

        {/* Phone Number Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="w-6 h-6 text-blue-600" />
              Seu Número de Telefone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-white rounded-lg p-6 border-2 border-blue-300">
              <div>
                <p className="text-sm text-gray-600 mb-1">Número para Atendimento Automático:</p>
                <p className="text-3xl font-bold text-blue-600">{phoneData?.phoneNumber}</p>
              </div>
              <Button
                onClick={handleCopyPhone}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              💡 Compartilhe este número com seus clientes para atendimento automático 24 horas por dia!
            </p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <PhoneIncoming className="w-4 h-4" />
                  Total de Chamadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statsData.totalCalls}</div>
                <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  Concluídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{statsData.completedCalls}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {((statsData.completedCalls / statsData.totalCalls) * 100).toFixed(1)}% de sucesso
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duração Média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.floor(statsData.averageDuration / 60)}min</div>
                <p className="text-xs text-gray-500 mt-1">
                  {statsData.averageDuration % 60}s por chamada
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  Transferidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{statsData.transferredCalls}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {((statsData.transferredCalls / statsData.totalCalls) * 100).toFixed(1)}% para humano
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Calendar className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Como Funciona</CardTitle>
                <CardDescription>
                  Sistema completo de atendimento telefônico com inteligência artificial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <PhoneIncoming className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">1. Cliente Liga</h3>
                    <p className="text-sm text-gray-600">
                      Cliente liga para o número configurado
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">2. IA Atende</h3>
                    <p className="text-sm text-gray-600">
                      Sistema converte áudio em texto e processa
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-2">3. Genspark Processa</h3>
                    <p className="text-sm text-gray-600">
                      IA gera resposta inteligente e contextual
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Phone className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="font-semibold mb-2">4. Cliente Ouve</h3>
                    <p className="text-sm text-gray-600">
                      Resposta convertida em áudio e reproduzida
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Call */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-6 h-6 text-yellow-600" />
                  Testar Atendimento
                </CardTitle>
                <CardDescription>
                  Simule uma chamada para ver como a IA responde
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-message">Mensagem do Cliente:</Label>
                  <Textarea
                    id="test-message"
                    placeholder="Ex: Gostaria de agendar uma consulta para amanhã às 14h"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleTestCall}
                  disabled={testCall.isPending}
                  className="w-full"
                >
                  {testCall.isPending ? "Processando..." : "Testar Agora"}
                </Button>
                {testCall.data && (
                  <div className="bg-white border-2 border-yellow-300 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Resposta da IA:</p>
                    <p className="text-base">{testCall.data.response}</p>
                    {testCall.data.shouldTransfer && (
                      <p className="text-sm text-orange-600 mt-2">
                        ⚠️ Chamada seria transferida para atendente humano
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mensagens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="welcome-message">Mensagem de Boas-Vindas:</Label>
                  <Textarea
                    id="welcome-message"
                    defaultValue={configData?.welcomeMessage}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="after-hours-message">Mensagem Fora do Horário:</Label>
                  <Textarea
                    id="after-hours-message"
                    defaultValue={configData?.afterHoursMessage}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horário de Funcionamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ativar Restrição de Horário</Label>
                  <Switch defaultChecked={configData?.businessHours.enabled} />
                </div>
                {Object.entries(configData?.businessHours.schedule || {}).map(([day, schedule]) => (
                  <div key={day} className="flex items-center gap-4 border-b pb-3">
                    <div className="w-32">
                      <Switch defaultChecked={schedule.enabled} />
                      <span className="ml-2 capitalize">{day}</span>
                    </div>
                    <Input type="time" defaultValue={schedule.start} className="w-32" />
                    <span>até</span>
                    <Input type="time" defaultValue={schedule.end} className="w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transferência para Humano</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Permitir Transferência</Label>
                  <Switch defaultChecked={configData?.transferToHuman.enabled} />
                </div>
                <div>
                  <Label>Palavras-chave para Transferir:</Label>
                  <Input
                    defaultValue={configData?.transferToHuman.keywords.join(", ")}
                    placeholder="atendente, humano, pessoa"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separe por vírgula. Quando detectadas, a chamada será transferida.
                  </p>
                </div>
                <div>
                  <Label>Número para Transferência:</Label>
                  <Input
                    type="tel"
                    placeholder="+55 11 9XXXX-XXXX"
                    defaultValue={configData?.transferToHuman.phoneNumber}
                  />
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" size="lg">
              Salvar Configurações
            </Button>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Chamadas</CardTitle>
                <CardDescription>Últimas 10 chamadas recebidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {callHistory?.calls.map((call) => (
                    <div
                      key={call.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <PhoneIncoming className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold">{call.from}</span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            call.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : call.status === "transferred"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {call.status === "completed"
                            ? "Concluída"
                            : call.status === "transferred"
                              ? "Transferida"
                              : "Falhou"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(call.startTime).toLocaleString("pt-BR")} • {call.duration}s
                        </p>
                        <p className="italic">"{call.transcript}"</p>
                        <p className="text-blue-600">IA: {call.aiResponse}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="grid md:grid-cols-2 gap-6">
              {templates?.templates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        Mensagem de Boas-Vindas:
                      </p>
                      <p className="text-sm italic">"{template.welcomeMessage}"</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        Palavras-chave:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.keywords.map((keyword, i) => (
                          <span
                            key={i}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => applyTemplate.mutate({ templateId: template.id })}
                      disabled={applyTemplate.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      Aplicar Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
