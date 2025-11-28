import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Download,
  Upload,
  Activity,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";

export default function AgentVersionsDashboard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newVersion, setNewVersion] = useState({
    version: "",
    changelog: "",
    isStable: true,
    isActive: true,
  });

  // Queries
  const { data: versions, refetch: refetchVersions } = trpc.agentVersions.listVersions.useQuery({
    includeInactive: true,
    includeBeta: true,
  });

  const { data: stats, refetch: refetchStats } = trpc.agentVersions.getVersionStats.useQuery();

  // Mutations
  const createVersionMutation = trpc.agentVersions.createVersion.useMutation({
    onSuccess: () => {
      toast.success("Versão criada com sucesso!");
      setIsCreateDialogOpen(false);
      setNewVersion({ version: "", changelog: "", isStable: true, isActive: true });
      refetchVersions();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Erro ao criar versão: ${error.message}`);
    },
  });

  const updateVersionMutation = trpc.agentVersions.updateVersion.useMutation({
    onSuccess: () => {
      toast.success("Versão atualizada!");
      refetchVersions();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteVersionMutation = trpc.agentVersions.deleteVersion.useMutation({
    onSuccess: () => {
      toast.success("Versão deletada!");
      refetchVersions();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleCreateVersion = () => {
    if (!newVersion.version || !newVersion.changelog) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createVersionMutation.mutate({
      version: newVersion.version,
      changelog: newVersion.changelog,
      isStable: newVersion.isStable,
      isActive: newVersion.isActive,
    });
  };

  const toggleVersionStatus = (version: string, isActive: boolean) => {
    updateVersionMutation.mutate({
      version,
      isActive: !isActive,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              🔄 Gestão de Versões - Desktop Agent
            </h1>
            <p className="text-slate-600">
              Controle de versões, distribuição e telemetria
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Versão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Versão</DialogTitle>
                <DialogDescription>
                  Adicione uma nova versão do Desktop Agent
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="version">Versão *</Label>
                  <Input
                    id="version"
                    placeholder="1.0.0"
                    value={newVersion.version}
                    onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="changelog">Changelog *</Label>
                  <Textarea
                    id="changelog"
                    placeholder="Descrição das mudanças..."
                    value={newVersion.changelog}
                    onChange={(e) => setNewVersion({ ...newVersion, changelog: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is-stable">Versão Estável</Label>
                  <Switch
                    id="is-stable"
                    checked={newVersion.isStable}
                    onCheckedChange={(checked) => setNewVersion({ ...newVersion, isStable: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is-active">Ativa</Label>
                  <Switch
                    id="is-active"
                    checked={newVersion.isActive}
                    onCheckedChange={(checked) => setNewVersion({ ...newVersion, isActive: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateVersion} disabled={createVersionMutation.isPending}>
                  {createVersionMutation.isPending ? "Criando..." : "Criar Versão"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Agents Ativos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalActiveAgents || 0}</div>
              <p className="text-xs text-slate-600 mt-1">
                Última hora
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Versões Disponíveis</CardTitle>
              <Download className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{versions?.length || 0}</div>
              <p className="text-xs text-slate-600 mt-1">
                Total de versões
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Atualizações (24h)</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.recentUpdates?.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0) || 0}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Últimas 24 horas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Version Distribution */}
        {stats?.versionDistribution && stats.versionDistribution.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Distribuição de Versões</CardTitle>
              <CardDescription>Agents ativos por versão</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats.versionDistribution as any[]).map((item: any) => (
                  <div key={item.version} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.version}</Badge>
                      <span className="text-sm text-slate-600">{item.count} agents</span>
                    </div>
                    <div className="w-48 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(item.count / stats.totalActiveAgents) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Versions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Todas as Versões</CardTitle>
                <CardDescription>Gerencie versões do Desktop Agent</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => { refetchVersions(); refetchStats(); }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {versions && versions.length > 0 ? (
                (versions as any[]).map((version: any) => (
                  <Card key={version.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{version.version}</h3>
                            {version.is_stable ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Estável
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Beta
                              </Badge>
                            )}
                            {version.is_active ? (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                Ativa
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500">
                                Inativa
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-slate-600 mb-3">{version.changelog}</p>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                            <div>📅 Lançamento: {new Date(version.release_date).toLocaleDateString()}</div>
                            <div>🐍 Python: {version.min_python_version}+</div>
                            {version.file_size && (
                              <div>📦 Tamanho: {(version.file_size / 1024).toFixed(2)} KB</div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleVersionStatus(version.version, version.is_active)}
                            disabled={updateVersionMutation.isPending}
                          >
                            {version.is_active ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Deletar versão ${version.version}?`)) {
                                deleteVersionMutation.mutate({ version: version.version });
                              }
                            }}
                            disabled={deleteVersionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Nenhuma versão encontrada</AlertTitle>
                  <AlertDescription>
                    Crie a primeira versão do Desktop Agent clicando em "Nova Versão"
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
