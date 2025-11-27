import { useState, useEffect, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Pause, RefreshCw, Terminal, AlertTriangle, Info, Bug, XCircle } from "lucide-react";

/**
 * Componente de visualização de logs em tempo real
 * 
 * Funcionalidades:
 * - Polling automático a cada 5s
 * - Filtros por agent, tipo de comando, status
 * - Auto-scroll para logs mais recentes
 * - Botão para pausar/retomar auto-refresh
 */

interface LogsViewerProps {
  agentId?: number;
  commandId?: number;
  maxHeight?: string;
}

export default function LogsViewer({ agentId, commandId, maxHeight = "500px" }: LogsViewerProps) {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [filterLevel, setFilterLevel] = useState<"info" | "warning" | "error" | "debug" | "all">("all");
  const [filterAgentId, setFilterAgentId] = useState<number | undefined>(agentId);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Query de logs
  const { data: logs = [], refetch, isLoading } = trpc.desktopControl.listLogs.useQuery(
    {
      agentId: filterAgentId,
      commandId,
      level: filterLevel === "all" ? undefined : filterLevel,
      limit: 100,
    },
    {
      refetchInterval: isAutoRefresh ? 5000 : false, // Auto-refresh a cada 5s
      staleTime: 3000,
    }
  );

  // Query de agents para o filtro
  const { data: agents = [] } = trpc.desktopControl.listAgents.useQuery();

  // Auto-scroll para o final quando novos logs chegam
  useEffect(() => {
    if (isAutoRefresh && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isAutoRefresh]);

  // Ícone e cor por nível de log
  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "debug":
        return <Bug className="h-4 w-4 text-gray-500" />;
      default:
        return <Terminal className="h-4 w-4" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case "info":
        return <Badge className="bg-blue-500">Info</Badge>;
      case "debug":
        return <Badge variant="outline">Debug</Badge>;
      default:
        return <Badge>{level}</Badge>;
    }
  };

  // Formatar timestamp
  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Logs em Tempo Real
            </CardTitle>
            <CardDescription>
              Logs de execução dos comandos
              {isAutoRefresh && " (atualizando a cada 5s)"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant={isAutoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            >
              {isAutoRefresh ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Retomar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="filter-agent">Filtrar por Agent</Label>
            <Select
              value={filterAgentId?.toString() || "all"}
              onValueChange={(value) => setFilterAgentId(value === "all" ? undefined : Number(value))}
            >
              <SelectTrigger id="filter-agent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.deviceName || `Agent ${agent.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-level">Filtrar por Nível</Label>
            <Select
              value={filterLevel}
              onValueChange={(value) => setFilterLevel(value as any)}
            >
              <SelectTrigger id="filter-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Logs */}
        <div
          className="border rounded-lg p-4 bg-slate-950 text-slate-50 font-mono text-sm overflow-y-auto"
          style={{ maxHeight }}
        >
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-2 hover:bg-slate-900 rounded transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getLevelIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getLevelBadge(log.level)}
                      <span className="text-xs text-slate-400">
                        {formatTimestamp(log.createdAt)}
                      </span>
                      {log.agentId && (
                        <span className="text-xs text-slate-500">
                          Agent #{log.agentId}
                        </span>
                      )}
                      {log.commandId && (
                        <span className="text-xs text-slate-500">
                          Cmd #{log.commandId}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-200 break-words">
                      {log.message}
                    </div>
                    {log.metadata && (
                      <details className="mt-1">
                        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                          Metadata
                        </summary>
                        <pre className="text-xs text-slate-400 mt-1 overflow-x-auto">
                          {typeof log.metadata === "string"
                            ? log.metadata
                            : JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Rodapé com contadores */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {logs.length} log{logs.length !== 1 ? "s" : ""} exibido{logs.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3 text-blue-500" />
              {logs.filter((l) => l.level === "info").length}
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              {logs.filter((l) => l.level === "warning").length}
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              {logs.filter((l) => l.level === "error").length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
