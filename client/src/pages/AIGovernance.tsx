import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { 
  Bot, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Award,
  Ban,
  Eye,
  Play,
  Pause
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AIGovernance() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  
  const { data: clients, refetch: refetchClients } = trpc.aiGovernance.listClients.useQuery();
  const { data: clientDetails } = trpc.aiGovernance.getClientDetails.useQuery(
    { clientId: selectedClient! },
    { enabled: !!selectedClient }
  );

  const approveMutation = trpc.aiGovernance.approveClient.useMutation({
    onSuccess: () => {
      toast.success("IA aprovada com sucesso!");
      refetchClients();
    }
  });

  const suspendMutation = trpc.aiGovernance.suspendClient.useMutation({
    onSuccess: () => {
      toast.success("IA suspensa com sucesso!");
      refetchClients();
    }
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { color: "bg-green-500", icon: <CheckCircle2 className="h-3 w-3" />, label: "Ativa" },
      pending: { color: "bg-yellow-500", icon: <Clock className="h-3 w-3" />, label: "Pendente" },
      suspended: { color: "bg-orange-500", icon: <Pause className="h-3 w-3" />, label: "Suspensa" },
      banned: { color: "bg-red-500", icon: <Ban className="h-3 w-3" />, label: "Banida" }
    };
    const variant = variants[status as keyof typeof variants] || variants.pending;
    
    return (
      <Badge className={`${variant.color} text-white flex items-center gap-1`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      bronze: "bg-orange-700",
      silver: "bg-gray-400",
      gold: "bg-yellow-500",
      platinum: "bg-purple-500"
    };
    return (
      <Badge className={`${colors[tier as keyof typeof colors]} text-white flex items-center gap-1`}>
        <Award className="h-3 w-3" />
        {tier.toUpperCase()}
      </Badge>
    );
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    if (score >= 20) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Shield className="h-10 w-10 text-purple-400" />
              Governança de IAs
            </h1>
            <p className="text-slate-400 mt-2">
              Gerenciamento e monitoramento de IAs externas conectadas
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Bot className="h-4 w-4 mr-2" />
                Ver Políticas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Políticas de Uso - Versão 1.0.0</DialogTitle>
                <DialogDescription>
                  Regras obrigatórias para todas as IAs conectadas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Rate Limiting</h3>
                  <p className="text-sm text-slate-600">100 requisições por minuto</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Endpoints Permitidos</h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• /api/comet/*</li>
                    <li>• /api/skills/*</li>
                    <li>• /api/executar</li>
                    <li>• /api/conversar</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Ações Proibidas</h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Deletar usuários</li>
                    <li>• Modificar configurações do sistema</li>
                    <li>• Acessar dados de outras IAs</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Requisitos de Segurança</h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Todas as requisições devem usar HTTPS</li>
                    <li>• Tokens devem ser renovados a cada 24h</li>
                    <li>• Dados sensíveis devem ser criptografados</li>
                    <li>• Logs de auditoria são obrigatórios</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Total de IAs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{clients?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">IAs Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {clients?.filter(c => c.status === "active").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">
                {clients?.filter(c => c.status === "pending").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Suspensas/Banidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {clients?.filter(c => c.status === "suspended" || c.status === "banned").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* IAs List */}
          <Card className="lg:col-span-1 bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">IAs Registradas</CardTitle>
              <CardDescription className="text-slate-400">
                {clients?.length || 0} IAs no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {clients?.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client.clientId)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedClient === client.clientId
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bot className="h-5 w-5 text-purple-400" />
                          <div>
                            <h3 className="font-semibold text-white">{client.name}</h3>
                            {client.version && (
                              <p className="text-xs text-slate-500">v{client.version}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(client.status)}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Trust Score:</span>
                          <span className={`text-sm font-bold ${getTrustScoreColor(client.trustScore)}`}>
                            {client.trustScore}
                          </span>
                        </div>
                        {getTierBadge(client.tier)}
                      </div>

                      {client.totalViolations > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-orange-400">
                          <AlertTriangle className="h-3 w-3" />
                          {client.totalViolations} violações
                        </div>
                      )}
                    </div>
                  ))}

                  {!clients || clients.length === 0 && (
                    <p className="text-slate-500 text-center py-8">
                      Nenhuma IA registrada ainda
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Details Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedClient && clientDetails ? (
              <>
                {/* Client Info */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Bot className="h-6 w-6 text-purple-400" />
                          {clientDetails.client.name}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          {clientDetails.client.provider || "Provedor não especificado"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {clientDetails.client.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate({ clientId: selectedClient })}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                        )}
                        {clientDetails.client.status === "active" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => suspendMutation.mutate({ 
                              clientId: selectedClient,
                              reason: "Suspensão manual pelo administrador"
                            })}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Suspender
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Status</p>
                        <div className="mt-1">{getStatusBadge(clientDetails.client.status)}</div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Tier</p>
                        <div className="mt-1">{getTierBadge(clientDetails.client.tier)}</div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Trust Score</p>
                        <p className={`text-2xl font-bold ${getTrustScoreColor(clientDetails.client.trustScore)}`}>
                          {clientDetails.client.trustScore}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Total de Requisições</p>
                        <p className="text-2xl font-bold text-white">{clientDetails.client.totalRequests}</p>
                      </div>
                    </div>

                    {clientDetails.client.capabilities && clientDetails.client.capabilities.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Capacidades</p>
                        <div className="flex flex-wrap gap-2">
                          {clientDetails.client.capabilities.map((cap: string) => (
                            <Badge key={cap} variant="outline">{cap}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {clientDetails.client.acceptedPoliciesVersion && (
                      <div>
                        <p className="text-xs text-slate-500">Políticas Aceitas</p>
                        <p className="text-sm text-white">
                          Versão {clientDetails.client.acceptedPoliciesVersion} em{" "}
                          {new Date(clientDetails.client.acceptedPoliciesAt!).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="violations" className="w-full">
                  <TabsList className="bg-slate-900/50">
                    <TabsTrigger value="violations">
                      Violações ({clientDetails.violations.length})
                    </TabsTrigger>
                    <TabsTrigger value="score-history">
                      Histórico de Score
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="violations">
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">Violações Recentes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {clientDetails.violations.map((violation) => (
                              <div
                                key={violation.id}
                                className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className={`h-4 w-4 ${
                                      violation.severity === "critical" ? "text-red-500" :
                                      violation.severity === "high" ? "text-orange-500" :
                                      violation.severity === "medium" ? "text-yellow-500" :
                                      "text-blue-500"
                                    }`} />
                                    <span className="font-semibold text-white text-sm">
                                      {violation.violationType}
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {violation.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-400">{violation.description}</p>
                                {violation.endpoint && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    Endpoint: {violation.endpoint}
                                  </p>
                                )}
                                <p className="text-xs text-slate-600 mt-2">
                                  {new Date(violation.createdAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                            {clientDetails.violations.length === 0 && (
                              <p className="text-slate-500 text-center py-8">
                                Nenhuma violação registrada
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="score-history">
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">Histórico de Trust Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {clientDetails.scoreHistory.map((history) => (
                              <div
                                key={history.id}
                                className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    {history.change > 0 ? (
                                      <TrendingUp className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <TrendingDown className="h-5 w-5 text-red-500" />
                                    )}
                                    <div>
                                      <p className="text-sm font-semibold text-white">
                                        {history.previousScore} → {history.newScore}
                                      </p>
                                      <p className="text-xs text-slate-500">{history.reason}</p>
                                    </div>
                                  </div>
                                  <Badge className={history.change > 0 ? "bg-green-500" : "bg-red-500"}>
                                    {history.change > 0 ? "+" : ""}{history.change}
                                  </Badge>
                                </div>
                                {history.details && (
                                  <p className="text-xs text-slate-400 mt-2">{history.details}</p>
                                )}
                                <p className="text-xs text-slate-600 mt-2">
                                  {new Date(history.createdAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                            {clientDetails.scoreHistory.length === 0 && (
                              <p className="text-slate-500 text-center py-8">
                                Nenhum histórico disponível
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-20">
                  <div className="text-center text-slate-500">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione uma IA para ver os detalhes</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
