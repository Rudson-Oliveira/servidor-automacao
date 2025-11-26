import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Shield,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppBlocked() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.whatsappProtection.getBlockStats.useQuery({
    days: 7,
  });

  const { data: blacklistData, refetch: refetchBlacklist } =
    trpc.whatsappProtection.listBlacklist.useQuery({
      limit: 50,
      offset: 0,
    });

  const { data: alertsData, refetch: refetchAlerts } =
    trpc.whatsappProtection.listActiveAlerts.useQuery();

  // Mutations
  const removeFromBlacklist = trpc.whatsappProtection.removeFromBlacklist.useMutation({
    onSuccess: () => {
      toast.success('Número removido da blacklist');
      refetchBlacklist();
      refetchStats();
    },
    onError: error => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resolveAlert = trpc.whatsappProtection.resolveAlert.useMutation({
    onSuccess: () => {
      toast.success('Alerta resolvido');
      refetchAlerts();
    },
    onError: error => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchStats();
      refetchBlacklist();
      refetchAlerts();
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, refetchStats, refetchBlacklist, refetchAlerts]);

  const reasonLabels: Record<string, string> = {
    blocked: 'Bloqueou',
    reported: 'Denunciou',
    invalid: 'Inválido',
    opt_out: 'Pediu Exclusão',
    manual: 'Manual',
  };

  const reasonColors: Record<string, 'destructive' | 'secondary' | 'outline' | 'default'> = {
    blocked: 'destructive',
    reported: 'destructive',
    invalid: 'secondary',
    opt_out: 'outline',
    manual: 'default',
  };

  const severityColors: Record<string, 'destructive' | 'default' | 'secondary'> = {
    critical: 'destructive',
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-red-600" />
              Proteção WhatsApp
            </h1>
            <p className="text-gray-600 mt-1">
              Sistema de detecção e prevenção de bloqueios
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}
              Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Bloqueados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {stats?.totalBlocked || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Últimos 7 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bloqueios Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {stats?.byReason?.blocked || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Usuários que bloquearam</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Denúncias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">
                {stats?.byReason?.reported || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Denunciados como spam</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Alertas Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {alertsData?.count || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Requerem atenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas Ativos */}
        {alertsData && alertsData.count > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <AlertTriangle className="w-5 h-5" />
                Alertas Ativos ({alertsData.count})
              </CardTitle>
              <CardDescription>Situações que requerem atenção imediata</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertsData.alerts.map(alert => (
                  <Alert key={alert.id} variant="default" className="bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <AlertTitle className="flex items-center gap-2">
                          <Badge variant={severityColors[alert.severity]}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          {alert.alertType.replace(/_/g, ' ').toUpperCase()}
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <p className="font-medium">Número: {alert.affectedNumber}</p>
                          <p className="text-sm mt-1">{alert.details}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </AlertDescription>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert.mutate({ alertId: alert.id })}
                      >
                        Resolver
                      </Button>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blacklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" />
              Lista de Bloqueios ({blacklistData?.total || 0})
            </CardTitle>
            <CardDescription>
              Números que bloquearam, denunciaram ou pediram para não receber mensagens
            </CardDescription>
          </CardHeader>
          <CardContent>
            {blacklistData && blacklistData.items.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Número Bloqueado</TableHead>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blacklistData.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.phone}</TableCell>
                        <TableCell>
                          <Badge variant={reasonColors[item.reason]}>
                            {reasonLabels[item.reason] || item.reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.blockedNumber || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.lastCampaign || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(item.blockedAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              removeFromBlacklist.mutate({ phone: item.phone })
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Ban className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum número bloqueado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guia Rápido */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">🛡️ Como Funciona a Proteção</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-2">
            <p>
              <strong>✅ Detecção Automática:</strong> Quando uma mensagem falha com erro de
              "bloqueado" ou "denunciado", o número é automaticamente adicionado à blacklist.
            </p>
            <p>
              <strong>📊 Score de Risco:</strong> Cada contato recebe um score de 0-100 baseado
              em taxa de falha, histórico de bloqueios e engajamento.
            </p>
            <p>
              <strong>🚨 Alertas Inteligentes:</strong> Se 3+ bloqueios ocorrem em 24h no mesmo
              número WhatsApp, um alerta crítico é gerado e você é notificado.
            </p>
            <p>
              <strong>🔒 Proteção Proativa:</strong> Números na blacklist NUNCA recebem
              mensagens, protegendo seus números WhatsApp de banimento.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
