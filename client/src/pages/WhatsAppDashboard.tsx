import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Phone,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';

export default function WhatsAppDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton />
      <div className="container py-8">
        <WhatsAppDashboardContent />
      </div>
    </div>
  );
}

function WhatsAppDashboardContent() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: summary, refetch: refetchSummary } = trpc.whatsapp.getSystemSummary.useQuery(
    undefined,
    {
      refetchInterval: autoRefresh ? 5000 : false,
    }
  );

  const { data: templateStats } = trpc.whatsapp.getTemplateStats.useQuery(undefined, {
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-orange-500';
      case 'blocked':
        return 'bg-red-500';
      case 'quarantine':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-orange-100 text-orange-800',
      blocked: 'bg-red-100 text-red-800',
      quarantine: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              📱 Dashboard WhatsApp Anti-Bloqueio
            </h1>
            <p className="text-gray-600 mt-1">Sistema Inteligente de Recrutamento</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              size="sm"
            >
              {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
            </Button>

            <Button onClick={() => refetchSummary()} variant="outline" size="sm">
              🔄 Atualizar
            </Button>
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Números</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalNumbers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {summary?.activeNumbers || 0} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary?.sentToday || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.failedToday || 0} falhas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Na Fila</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary?.queuedMessages || 0}
              </div>
              <p className="text-xs text-muted-foreground">mensagens pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary?.sentToday && summary?.failedToday
                  ? (
                      ((summary.sentToday - summary.failedToday) / summary.sentToday) *
                      100
                    ).toFixed(1)
                  : '100'}
                %
              </div>
              <p className="text-xs text-muted-foreground">de entregas</p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {summary && summary.blockedNumbers > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção!</strong> {summary.blockedNumbers} número(s) bloqueado(s) ou em
              quarentena. Verifique o status abaixo.
            </AlertDescription>
          </Alert>
        )}

        {/* Guia Rápido */}
        <Card>
          <CardHeader>
            <CardTitle>📚 Guia Rápido - Como Evitar Bloqueios</CardTitle>
            <CardDescription>Boas práticas para o setor de recrutamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  FAÇA ✅
                </h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Personalize cada mensagem</li>
                  <li>• Espere 3-5 minutos entre envios</li>
                  <li>• Envie apenas em horário comercial (9h-18h)</li>
                  <li>• Use WhatsApp Business</li>
                  <li>• Varie o texto das mensagens</li>
                  <li>• Responda rapidamente quando candidato responde</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4" />
                  NÃO FAÇA ❌
                </h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Copiar e colar mesma mensagem</li>
                  <li>• Enviar mais de 80 mensagens/dia por número</li>
                  <li>• Enviar após 20h ou antes de 8h</li>
                  <li>• Usar links encurtados (bit.ly, etc)</li>
                  <li>• Ignorar respostas de candidatos</li>
                  <li>• Usar palavras como "urgente", "grátis"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Templates */}
        {templateStats && templateStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📝 Uso de Templates</CardTitle>
              <CardDescription>Distribuição de mensagens por template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templateStats.map(stat => (
                  <div key={stat.templateId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{stat.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {stat.usageCount} usos
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (stat.usageCount /
                                Math.max(...templateStats.map(s => s.usageCount))) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Links Úteis */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Recursos e Documentação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start" asChild>
                <a href="/whatsapp/templates" target="_blank">
                  📝 Gerenciar Templates
                </a>
              </Button>

              <Button variant="outline" className="justify-start" asChild>
                <a href="/whatsapp/numbers" target="_blank">
                  📱 Gerenciar Números
                </a>
              </Button>

              <Button variant="outline" className="justify-start" asChild>
                <a href="/docs/whatsapp" target="_blank">
                  📚 Documentação Completa
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Sistema desenvolvido para o Setor de Recrutamento da Hospitalar
            <br />
            Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
