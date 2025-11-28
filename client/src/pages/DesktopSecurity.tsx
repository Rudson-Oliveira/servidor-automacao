import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Plus, Trash2, AlertTriangle, CheckCircle2, XCircle, Search } from "lucide-react";
import Header from "@/components/Header";
import { analyzeDangerousCommand, getSeverityColor, getSeverityIcon, getSeverityLabel } from "@shared/dangerousCommands";

/**
 * Página de gerenciamento de regras de segurança
 * 
 * Permite configurar whitelist/blacklist de comandos e
 * visualizar estatísticas de bloqueios.
 */

export default function DesktopSecurity() {
  // Estados
  const [testCommand, setTestCommand] = useState("");
  const [showAddRuleDialog, setShowAddRuleDialog] = useState(false);
  const [newRulePattern, setNewRulePattern] = useState("");
  const [newRuleDescription, setNewRuleDescription] = useState("");
  const [ruleType, setRuleType] = useState<"whitelist" | "blacklist">("blacklist");

  // Queries tRPC
  const { data: securityRules = [], refetch: refetchRules } = trpc.desktopControl.getSecurityRules.useQuery();
  const { data: stats } = trpc.desktopControl.getStats.useQuery();

  // Mutations
  const addRuleMutation = trpc.desktopControl.addSecurityRule.useMutation({
    onSuccess: () => {
      toast.success("Regra adicionada com sucesso");
      setShowAddRuleDialog(false);
      setNewRulePattern("");
      setNewRuleDescription("");
      refetchRules();
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar regra: ${error.message}`);
    },
  });

  const deleteRuleMutation = trpc.desktopControl.deleteSecurityRule.useMutation({
    onSuccess: () => {
      toast.success("Regra removida com sucesso");
      refetchRules();
    },
    onError: (error) => {
      toast.error(`Erro ao remover regra: ${error.message}`);
    },
  });

  // Handlers
  const handleAddRule = () => {
    if (!newRulePattern.trim()) {
      toast.error("Digite um padrão de comando");
      return;
    }

    addRuleMutation.mutate({
      type: ruleType,
      pattern: newRulePattern,
      description: newRuleDescription || undefined,
    });
  };

  const handleDeleteRule = (ruleId: number) => {
    if (confirm("Tem certeza que deseja remover esta regra?")) {
      deleteRuleMutation.mutate({ ruleId });
    }
  };

  // Testar comando
  const testResult = testCommand ? analyzeDangerousCommand(testCommand) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Gerenciamento de Segurança
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure regras de whitelist/blacklist e monitore comandos perigosos
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comandos Bloqueados</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.commands.failed}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.commands.failed / stats.commands.total) * 100).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comandos Permitidos</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.commands.completed}</div>
                <p className="text-xs text-muted-foreground">
                  Taxa de sucesso: {stats.commands.successRate}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regras Ativas</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityRules.length}</div>
                <p className="text-xs text-muted-foreground">
                  Regras configuradas
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Testador de Comandos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Testar Comando
            </CardTitle>
            <CardDescription>
              Verifique se um comando seria bloqueado pelas regras de segurança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-command">Comando para testar</Label>
              <Input
                id="test-command"
                placeholder='rm -rf /'
                value={testCommand}
                onChange={(e) => setTestCommand(e.target.value)}
              />
            </div>

            {testResult && (
              <div className="border rounded-lg p-4 space-y-3">
                {testResult.isDangerous ? (
                  <>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-600">Comando Perigoso Detectado</span>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Nível de Risco:</span>
                      <div className={`flex items-center gap-2 mt-1 ${getSeverityColor(testResult.severity)}`}>
                        <span className="text-xl">{getSeverityIcon(testResult.severity)}</span>
                        <span className="font-bold">{getSeverityLabel(testResult.severity)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Riscos Identificados:</span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {testResult.risks.map((risk, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{risk}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Comando Seguro</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regras de Segurança */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Regras de Segurança</CardTitle>
                <CardDescription>
                  Padrões de comandos que serão bloqueados ou permitidos
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddRuleDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Regra
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {securityRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma regra customizada configurada</p>
                <p className="text-sm mt-2">
                  As regras padrão do sistema continuam ativas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {securityRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={rule.type === "blacklist" ? "destructive" : "default"}>
                          {rule.type === "blacklist" ? "Bloqueado" : "Permitido"}
                        </Badge>
                        <code className="text-sm font-mono">{rule.pattern}</code>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={deleteRuleMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regras Padrão do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Regras Padrão do Sistema</CardTitle>
            <CardDescription>
              Padrões de comandos perigosos detectados automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-red-700 mb-2">🔴 Risco Crítico</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Exclusão recursiva forçada (rm -rf /)</li>
                  <li>Sobrescrita direta de disco (dd)</li>
                  <li>Formatação de disco</li>
                  <li>Desligamento/reinicialização forçada</li>
                  <li>Fork bombs e loops infinitos</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-red-600 mb-2">🚨 Alto Risco</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Exclusão de diretórios críticos do sistema</li>
                  <li>Permissões inseguras (chmod 777 /)</li>
                  <li>Execução de scripts remotos (curl | bash)</li>
                  <li>Modificação de firewall</li>
                  <li>Operações git destrutivas</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-orange-600 mb-2">⚠️ Risco Médio</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Exclusão de arquivos sem confirmação (rm -rf)</li>
                  <li>Encerramento forçado de processos (kill -9)</li>
                  <li>Modificação de usuários/grupos</li>
                  <li>Operações de banco de dados (DROP, TRUNCATE)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-yellow-600 mb-2">⚠️ Baixo Risco</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Varredura de rede (nmap)</li>
                  <li>Instalação de pacotes</li>
                  <li>Extração de arquivos com sobrescrita</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Adicionar Regra */}
      <Dialog open={showAddRuleDialog} onOpenChange={setShowAddRuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Regra</DialogTitle>
            <DialogDescription>
              Configure um novo padrão de comando para whitelist ou blacklist
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rule-type">Tipo de Regra</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={ruleType === "blacklist" ? "destructive" : "outline"}
                  onClick={() => setRuleType("blacklist")}
                  className="flex-1"
                >
                  Blacklist (Bloquear)
                </Button>
                <Button
                  variant={ruleType === "whitelist" ? "default" : "outline"}
                  onClick={() => setRuleType("whitelist")}
                  className="flex-1"
                >
                  Whitelist (Permitir)
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="rule-pattern">Padrão do Comando</Label>
              <Input
                id="rule-pattern"
                placeholder="rm -rf"
                value={newRulePattern}
                onChange={(e) => setNewRulePattern(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use regex para padrões complexos
              </p>
            </div>

            <div>
              <Label htmlFor="rule-description">Descrição (opcional)</Label>
              <Textarea
                id="rule-description"
                placeholder="Motivo para esta regra..."
                value={newRuleDescription}
                onChange={(e) => setNewRuleDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddRuleDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddRule}
              disabled={addRuleMutation.isPending || !newRulePattern.trim()}
            >
              {addRuleMutation.isPending ? "Adicionando..." : "Adicionar Regra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
