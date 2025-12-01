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
  Terminal, 
  Camera,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Filter,
  Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgentCommandsProps {
  agentId: number;
  autoRefresh?: boolean;
}

type CommandStatus = "pending" | "sent" | "executing" | "completed" | "failed";

export default function AgentCommands({ agentId, autoRefresh = true }: AgentCommandsProps) {
  const [statusFilter, setStatusFilter] = useState<CommandStatus | "all">("all");

  const { data: commands, isLoading, refetch } = trpc.desktopControl.listCommands.useQuery(
    {
      agentId,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 30,
    },
    {
      refetchInterval: autoRefresh ? 5000 : false,
    }
  );

  const getStatusIcon = (status: CommandStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "sent":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "executing":
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: CommandStatus) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "executing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getCommandIcon = (commandType: string) => {
    switch (commandType) {
      case "screenshot":
        return <Camera className="h-4 w-4" />;
      case "shell":
        return <Terminal className="h-4 w-4" />;
      default:
        return <Terminal className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Comandos Executados</CardTitle>
            <CardDescription>Histórico de comandos enviados ao agent</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as CommandStatus | "all")}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="executing">Executando</SelectItem>
                <SelectItem value="completed">Completo</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
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
          ) : commands && commands.length > 0 ? (
            <div className="space-y-4">
              {commands.map((command) => (
                <div
                  key={command.id}
                  className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getCommandIcon(command.commandType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getStatusColor(command.status)}`}
                      >
                        {getStatusIcon(command.status)}
                        <span className="ml-1">{command.status.toUpperCase()}</span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {command.commandType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(command.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    {/* Command Data */}
                    {command.commandData && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Ver comando
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {typeof command.commandData === "string"
                            ? command.commandData
                            : JSON.stringify(JSON.parse(command.commandData), null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Result */}
                    {command.result && command.status === "completed" && (
                      <details className="mt-2">
                        <summary className="text-xs text-green-600 dark:text-green-400 cursor-pointer hover:text-green-700 dark:hover:text-green-300 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Ver resultado
                        </summary>
                        <pre className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded text-xs overflow-x-auto">
                          {typeof command.result === "string"
                            ? command.result
                            : JSON.stringify(JSON.parse(command.result), null, 2)}
                        </pre>
                      </details>
                    )}

                    {/* Error */}
                    {command.errorMessage && command.status === "failed" && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded">
                        <p className="text-xs text-red-600 dark:text-red-400">
                          <XCircle className="h-3 w-3 inline mr-1" />
                          {command.errorMessage}
                        </p>
                      </div>
                    )}

                    {/* Execution Time */}
                    {command.executionTimeMs && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {command.executionTimeMs}ms
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Terminal className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum comando encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {statusFilter !== "all"
                  ? `Nenhum comando com status "${statusFilter}" encontrado.`
                  : "Nenhum comando foi enviado para este agent ainda."}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
