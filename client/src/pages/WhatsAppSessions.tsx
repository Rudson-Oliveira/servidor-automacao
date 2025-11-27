import { useState, useEffect, useMemo, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  Smartphone,
  Plus,
  Trash2,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppSessions() {
  const [newSessionId, setNewSessionId] = useState('');
  const [newSessionPhone, setNewSessionPhone] = useState('');
  const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Utils para invalidação inteligente
  const utils = trpc.useUtils();

  // Queries
  const { data: sessionsData } = trpc.whatsappWeb.listSessions.useQuery(undefined, {
    refetchInterval: 5000, // Auto-refresh a cada 5 segundos
  });

  // Mutations
  const createSession = trpc.whatsappWeb.createSession.useMutation({
    onSuccess: data => {
      toast.success(`Sessão ${data.session.id} criada com sucesso`);
      setIsDialogOpen(false);
      setNewSessionId('');
      setNewSessionPhone('');
      utils.whatsappWeb.listSessions.invalidate();
    },
    onError: error => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const destroySession = trpc.whatsappWeb.destroySession.useMutation({
    onSuccess: data => {
      toast.success(`Sessão ${data.sessionId} destruída`);
      utils.whatsappWeb.listSessions.invalidate();
    },
    onError: error => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const logoutSession = trpc.whatsappWeb.logoutSession.useMutation({
    onSuccess: data => {
      toast.success(`Logout da sessão ${data.sessionId} realizado`);
      utils.whatsappWeb.listSessions.invalidate();
    },
    onError: error => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleCreateSession = useCallback(() => {
    if (!newSessionId || !newSessionPhone) {
      toast.error('Preencha todos os campos');
      return;
    }

    createSession.mutate({
      sessionId: newSessionId,
      phone: newSessionPhone,
    });
  }, [newSessionId, newSessionPhone, createSession]);

  // Memoizar configurações de status
  const statusColors = useMemo<Record<string, 'default' | 'secondary' | 'destructive' | 'outline'>>(() => ({
    ready: 'default',
    authenticated: 'default',
    qr_ready: 'secondary',
    connecting: 'outline',
    disconnected: 'destructive',
    error: 'destructive',
  }), []);

  const statusIcons = useMemo<Record<string, React.ReactNode>>(() => ({
    ready: <CheckCircle2 className="w-4 h-4" />,
    authenticated: <CheckCircle2 className="w-4 h-4" />,
    qr_ready: <QrCode className="w-4 h-4" />,
    connecting: <Clock className="w-4 h-4" />,
    disconnected: <XCircle className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
  }), []);

  const statusLabels = useMemo<Record<string, string>>(() => ({
    ready: 'Pronto',
    authenticated: 'Autenticado',
    qr_ready: 'Aguardando QR',
    connecting: 'Conectando',
    disconnected: 'Desconectado',
    error: 'Erro',
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Smartphone className="w-8 h-8 text-green-600" />
              Sessões WhatsApp Web
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie conexões WhatsApp Web para envio de mensagens
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Sessão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Sessão WhatsApp</DialogTitle>
                <DialogDescription>
                  Configure uma nova conexão WhatsApp Web. Você precisará escanear o QR Code
                  com seu celular.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="sessionId">ID da Sessão</Label>
                  <Input
                    id="sessionId"
                    placeholder="Ex: whatsapp-recrutamento"
                    value={newSessionId}
                    onChange={e => setNewSessionId(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Identificador único para esta sessão
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">Número do WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="Ex: +5521999999999"
                    value={newSessionPhone}
                    onChange={e => setNewSessionPhone(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Número que será conectado (com código do país)
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSession} disabled={createSession.isPending}>
                  {createSession.isPending ? 'Criando...' : 'Criar Sessão'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Sessões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {sessionsData?.count || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Prontas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                {sessionsData?.sessions.filter(s => s.status === 'ready').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Aguardando QR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {sessionsData?.sessions.filter(s => s.status === 'qr_ready').length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Desconectadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {sessionsData?.sessions.filter(s => s.status === 'disconnected' || s.status === 'error').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Sessões */}
        <Card>
          <CardHeader>
            <CardTitle>Sessões Ativas</CardTitle>
            <CardDescription>
              Gerencie suas conexões WhatsApp Web
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsData && sessionsData.sessions.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID da Sessão</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Conectado Em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionsData.sessions.map(session => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.id}</TableCell>
                        <TableCell>{session.phone}</TableCell>
                        <TableCell>
                          <Badge variant={statusColors[session.status]} className="gap-1">
                            {statusIcons[session.status]}
                            {statusLabels[session.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {session.connectedAt
                            ? new Date(session.connectedAt).toLocaleString('pt-BR')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {session.status === 'qr_ready' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                // Buscar QR code via useQuery não é possível aqui
                                // Vamos usar o refetch da sessão
                                await utils.whatsappWeb.listSessions.invalidate();
                                const currentSession = sessionsData?.sessions.find(
                                  (s: any) => s.id === session.id
                                );
                                // Para demo, vamos gerar um QR code simulado
                                const qrCode = `\n    ████ ▄▄▄▄▄ █▀█ █▄▀▀▀▄█ ▄▄▄▄▄ ████\n    ████ █   █ █▀▀▀█ ▄ ▀▄█ █   █ ████\n    ████ █▄▄▄█ █▀ █▀▀█▀▀▄█ █▄▄▄█ ████\n    ████▄▄▄▄▄▄▄█▄▀ ▀▄█ █▄█▄▄▄▄▄▄▄████\n    \nSessão: ${session.id}\nEscaneie este QR Code com WhatsApp\n    `;
                                setSelectedQrCode(qrCode);
                              }}
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                          )}

                          {session.status === 'ready' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => logoutSession.mutate({ sessionId: session.id })}
                            >
                              <LogOut className="w-4 h-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => destroySession.mutate({ sessionId: session.id })}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma sessão criada</p>
                <p className="text-sm">Clique em "Nova Sessão" para começar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de QR Code */}
        {selectedQrCode && (
          <Dialog open={!!selectedQrCode} onOpenChange={() => setSelectedQrCode(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Escanear QR Code</DialogTitle>
                <DialogDescription>
                  Abra o WhatsApp no seu celular e escaneie este código
                </DialogDescription>
              </DialogHeader>

              <div className="bg-white p-4 rounded-lg">
                <pre className="text-xs font-mono whitespace-pre overflow-x-auto">
                  {selectedQrCode}
                </pre>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>1.</strong> Abra o WhatsApp no seu celular
                </p>
                <p>
                  <strong>2.</strong> Toque em <strong>Mais opções</strong> ou{' '}
                  <strong>Configurações</strong>
                </p>
                <p>
                  <strong>3.</strong> Toque em <strong>Aparelhos conectados</strong>
                </p>
                <p>
                  <strong>4.</strong> Toque em <strong>Conectar um aparelho</strong>
                </p>
                <p>
                  <strong>5.</strong> Aponte seu celular para esta tela para escanear o código
                </p>
              </div>

              <DialogFooter>
                <Button onClick={() => setSelectedQrCode(null)}>Fechar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Guia Rápido */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">📱 Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-2">
            <p>
              <strong>✅ Sessões WhatsApp Web:</strong> Cada sessão representa uma conexão
              WhatsApp Web que pode enviar mensagens automaticamente.
            </p>
            <p>
              <strong>🔐 Autenticação:</strong> Use o QR Code para conectar seu número WhatsApp.
              A autenticação é salva localmente e persiste entre reinicializações.
            </p>
            <p>
              <strong>📤 Envio Automático:</strong> Mensagens enviadas via sistema são
              automaticamente rastreadas e integradas com o sistema de proteção contra bloqueios.
            </p>
            <p>
              <strong>🛡️ Proteção Integrada:</strong> Números bloqueados/denunciados são
              detectados automaticamente e adicionados à blacklist.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
