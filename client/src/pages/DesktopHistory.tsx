import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Página de Histórico de Comandos com Timeline Visual
 * Exibe todas as ações executadas no Desktop Control System
 */
export default function DesktopHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  // Buscar comandos (usando endpoint existente)
  const { data: commands, isLoading } = trpc.desktopControl.listCommands.useQuery({
    limit: 100,
  });

  // Buscar agents para filtro
  const { data: agents } = trpc.desktopControl.listAgents.useQuery();

  // Filtrar comandos
  const filteredCommands = commands?.filter((cmd: any) => {
    if (searchQuery && !cmd.command.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "all" && cmd.status !== statusFilter) {
      return false;
    }
    if (severityFilter !== "all" && cmd.severity !== severityFilter) {
      return false;
    }
    if (agentFilter !== "all" && cmd.agentId !== parseInt(agentFilter)) {
      return false;
    }
    return true;
  });

  // Calcular estatísticas
  const stats = {
    total: filteredCommands?.length || 0,
    success: filteredCommands?.filter((c: any) => c.status === "completed").length || 0,
    failed: filteredCommands?.filter((c: any) => c.status === "failed").length || 0,
    pending: filteredCommands?.filter((c: any) => c.status === "pending").length || 0,
  };

  // Exportar para CSV
  const handleExportCSV = () => {
    if (!filteredCommands || filteredCommands.length === 0) {
      toast.error("Nenhum comando para exportar");
      return;
    }

    const headers = ["ID", "Comando", "Agent", "Status", "Severidade", "Data", "Resultado"];
    const rows = filteredCommands.map((cmd: any) => [
      cmd.id,
      cmd.command,
      cmd.agentId,
      cmd.status,
      cmd.severity,
      new Date(cmd.createdAt).toLocaleString("pt-BR"),
      cmd.result || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historico-comandos-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("Histórico exportado com sucesso!");
  };

  // Exportar para JSON
  const handleExportJSON = () => {
    if (!filteredCommands || filteredCommands.length === 0) {
      toast.error("Nenhum comando para exportar");
      return;
    }

    const json = JSON.stringify(filteredCommands, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historico-comandos-${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    toast.success("Histórico exportado com sucesso!");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      low: "secondary",
      medium: "default",
      high: "destructive",
      critical: "destructive",
    };
    return <Badge variant={variants[severity] || "outline"}>{severity}</Badge>;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Comandos</h1>
          <p className="text-muted-foreground mt-1">
            Timeline completa de todas as ações executadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleExportJSON}>
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">
              Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">
              Falhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar comando..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Severidades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Agents</SelectItem>
                {agents?.map((agent: any) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.deviceName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Ações</CardTitle>
          <CardDescription>
            {filteredCommands?.length || 0} comandos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : filteredCommands && filteredCommands.length > 0 ? (
            <div className="space-y-4">
              {filteredCommands.map((cmd: any, index: number) => (
                <div
                  key={cmd.id}
                  className="flex gap-4 pb-4 border-b last:border-b-0"
                >
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className="rounded-full p-2 bg-accent">
                      {getStatusIcon(cmd.status)}
                    </div>
                    {index < filteredCommands.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Terminal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {cmd.command}
                          </code>
                          {getSeverityBadge(cmd.severity)}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>
                            <strong>Agent:</strong> {cmd.agentId} •{" "}
                            <strong>Status:</strong> {cmd.status}
                          </p>
                          {cmd.result && (
                            <p className="mt-1">
                              <strong>Resultado:</strong> {cmd.result}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(cmd.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum comando encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
