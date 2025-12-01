import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Bug,
  RefreshCw,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgentLogsProps {
  agentId: number;
  autoRefresh?: boolean;
}

type LogLevel = "debug" | "info" | "warning" | "error";

export default function AgentLogs({ agentId, autoRefresh = true }: AgentLogsProps) {
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");

  const { data: logs, isLoading, refetch } = trpc.desktopControl.listLogs.useQuery(
    {
      agentId,
      level: levelFilter === "all" ? undefined : levelFilter,
      limit: 50,
    },
    {
      refetchInterval: autoRefresh ? 5000 : false,
    }
  );

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case "debug":
        return <Bug className="h-4 w-4 text-gray-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "debug":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Logs de Atividade</CardTitle>
            <CardDescription>Timeline de eventos do Desktop Agent</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={levelFilter}
              onValueChange={(value) => setLevelFilter(value as LogLevel | "all")}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getLevelIcon(log.level)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getLevelColor(log.level)}`}
                      >
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm break-words">{log.message}</p>
                    
                    {/* Metadata */}
                    {log.metadata && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          Ver detalhes
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {typeof log.metadata === "string"
                            ? log.metadata
                            : JSON.stringify(JSON.parse(log.metadata), null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Command ID */}
                    {log.commandId && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Comando #{log.commandId}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {levelFilter !== "all"
                  ? `Nenhum log de nível "${levelFilter}" encontrado para este agent.`
                  : "Este agent ainda não gerou nenhum log de atividade."}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
