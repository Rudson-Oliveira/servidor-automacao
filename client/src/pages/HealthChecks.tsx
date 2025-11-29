import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, CheckCircle2, XCircle, AlertCircle, Server, Database, Cpu, HardDrive } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useState, useEffect } from "react";

interface HealthCheck {
  id: string;
  name: string;
  component: string;
  status: "healthy" | "degraded" | "unhealthy";
  responseTime: number;
  lastCheck: Date;
  uptime: number;
  icon: typeof Server;
}

export default function HealthChecks() {
  const { user, loading, isAuthenticated } = useAuth();
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHealthChecks = () => {
    // Simular health checks (substituir por dados reais da API)
    const mockChecks: HealthCheck[] = [
      {
        id: "1",
        name: "Servidor API",
        component: "api-server",
        status: "healthy",
        responseTime: 45,
        lastCheck: new Date(),
        uptime: 99.9,
        icon: Server
      },
      {
        id: "2",
        name: "Banco de Dados",
        component: "database",
        status: "healthy",
        responseTime: 12,
        lastCheck: new Date(),
        uptime: 99.8,
        icon: Database
      },
      {
        id: "3",
        name: "CPU",
        component: "cpu",
        status: "healthy",
        responseTime: 8,
        lastCheck: new Date(),
        uptime: 100,
        icon: Cpu
      },
      {
        id: "4",
        name: "Disco",
        component: "disk",
        status: "degraded",
        responseTime: 120,
        lastCheck: new Date(),
        uptime: 98.5,
        icon: HardDrive
      }
    ];
    setHealthChecks(mockChecks);
  };

  useEffect(() => {
    loadHealthChecks();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadHealthChecks, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadHealthChecks();
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Autenticação Necessária</CardTitle>
            <CardDescription>Faça login para acessar os Health Checks</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <a href={getLoginUrl()}>Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: HealthCheck["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "unhealthy":
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: HealthCheck["status"]) => {
    const variants = {
      healthy: "default",
      degraded: "secondary",
      unhealthy: "destructive"
    } as const;

    const labels = {
      healthy: "Saudável",
      degraded: "Degradado",
      unhealthy: "Crítico"
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getStatusColor = (status: HealthCheck["status"]) => {
    switch (status) {
      case "healthy":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "unhealthy":
        return "text-red-500";
    }
  };

  const healthyCount = healthChecks.filter(c => c.status === "healthy").length;
  const degradedCount = healthChecks.filter(c => c.status === "degraded").length;
  const unhealthyCount = healthChecks.filter(c => c.status === "unhealthy").length;
  const overallStatus = unhealthyCount > 0 ? "unhealthy" : degradedCount > 0 ? "degraded" : "healthy";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">Health Checks</h1>
              <p className="text-xs text-muted-foreground">Monitoramento de Saúde do Sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              <span className="ml-2">Atualizar</span>
            </Button>
            <span className="text-sm text-muted-foreground">Olá, {user?.name || "Usuário"}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status Geral do Sistema</CardTitle>
                <CardDescription>Resumo da saúde de todos os componentes</CardDescription>
              </div>
              {getStatusBadge(overallStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{healthyCount}</p>
                  <p className="text-sm text-muted-foreground">Saudáveis</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{degradedCount}</p>
                  <p className="text-sm text-muted-foreground">Degradados</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{unhealthyCount}</p>
                  <p className="text-sm text-muted-foreground">Críticos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Health Checks */}
        <div className="grid gap-6 md:grid-cols-2">
          {healthChecks.map((check) => {
            const Icon = check.icon;
            return (
              <Card key={check.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 ${getStatusColor(check.status)}`} />
                      <div>
                        <CardTitle className="text-base">{check.name}</CardTitle>
                        <CardDescription className="text-xs">{check.component}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(check.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tempo de Resposta</span>
                      <span className="font-medium">{check.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Uptime</span>
                      <span className="font-medium">{check.uptime}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Última Verificação</span>
                      <span className="font-medium text-xs">
                        {check.lastCheck.toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
