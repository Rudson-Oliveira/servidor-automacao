import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Monitor, 
  Activity, 
  Clock, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Terminal,
  Camera,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import AgentLogs from "@/components/AgentLogs";
import AgentCommands from "@/components/AgentCommands";

interface Agent {
  id: number;
  deviceName: string | null;
  platform: string | null;
  version: string | null;
  status: "online" | "offline" | "busy" | "error";
  lastPing: Date | null;
  ipAddress: string | null;
  isOnline: boolean;
  timeSinceLastPing: number;
  createdAt: Date;
}

export default function DashboardDesktopAgents() {
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Query para listar agents
  const { data: agents, isLoading, refetch } = trpc.desktopControl.listAgents.useQuery(
    undefined,
    {
      refetchInterval: autoRefresh ? 5000 : false, // Atualizar a cada 5 segundos
    }
  );

  // Query para estatísticas
  const { data: stats } = trpc.desktopControl.getStats.useQuery(undefined, {
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Auto-selecionar primeiro agent se houver
  useEffect(() => {
    if (agents && agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0].id);
    }
  }, [agents, selectedAgent]);

  const getStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-gray-500";
      case "busy":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: Agent["status"]) => {
    switch (status) {
      case "online":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "offline":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "busy":
        return <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPlatformIcon = (platform: string | null) => {
    if (!platform) return <Monitor className="h-4 w-4" />;
    
    const p = platform.toLowerCase();
    if (p.includes("win")) return "🪟";
    if (p.includes("mac") || p.includes("darwin")) return "🍎";
    if (p.includes("linux")) return "🐧";
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Desktop Agents</h1>
            <p className="text-muted-foreground">
              Monitore e controle seus Desktop Agents em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Agents</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAgents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online</CardTitle>
                <Wifi className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.onlineAgents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comandos Executados</CardTitle>
                <Terminal className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCommands}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Screenshots</CardTitle>
                <Camera className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalScreenshots}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agent Details */}
        {selectedAgent && (
          <div className="grid gap-6 lg:grid-cols-2">
            <AgentCommands agentId={selectedAgent} autoRefresh={autoRefresh} />
            <AgentLogs agentId={selectedAgent} autoRefresh={autoRefresh} />
          </div>
        )}

        {/* Agents Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : agents && agents.length > 0 ? (
            agents.map((agent) => (
              <Card
                key={agent.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedAgent === agent.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">{getPlatformIcon(agent.platform)}</span>
                      {agent.deviceName || `Agent #${agent.id}`}
                    </CardTitle>
                    {getStatusIcon(agent.status)}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {agent.platform || "Unknown"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      v{agent.version || "1.0.0"}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(agent.status)} ${agent.isOnline ? "animate-pulse" : ""}`} />
                    <span className="text-sm font-medium capitalize">{agent.status}</span>
                  </div>

                  {/* Last Ping */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {agent.isOnline ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-gray-500" />
                    )}
                    <span>
                      {agent.lastPing
                        ? formatDistanceToNow(new Date(agent.lastPing), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : "Nunca conectado"}
                    </span>
                  </div>

                  {/* IP Address */}
                  {agent.ipAddress && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Monitor className="h-4 w-4" />
                      <span className="font-mono text-xs">{agent.ipAddress}</span>
                    </div>
                  )}

                  {/* Created At */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Criado{" "}
                      {formatDistanceToNow(new Date(agent.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum Desktop Agent conectado</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Instale e configure um Desktop Agent para começar a controlar seu computador remotamente.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
