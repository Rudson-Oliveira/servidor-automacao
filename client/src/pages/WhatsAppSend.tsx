import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppSend() {
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [message, setMessage] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [contacts, setContacts] = useState<Array<{ phone: string; name?: string; [key: string]: string | undefined }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, delivered: 0, read: 0, failed: 0, total: 0 });
  const [antiBlockAlert, setAntiBlockAlert] = useState<{ active: boolean; pauseTime: number } | null>(null);

  // Queries
  const { data: sessionsData } = trpc.whatsappWeb.listSessions.useQuery();

  // Parse CSV
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
      
      const parsed = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const contact: { phone: string; name?: string; [key: string]: string | undefined } = { phone: '' };
        headers.forEach((header, index) => {
          contact[header] = values[index];
        });
        return contact;
      }).filter(c => c.phone);

      setContacts(parsed);
      toast.success(`${parsed.length} contatos carregados`);
    };
    reader.readAsText(file);
  };

  // Simular envio (substituir por chamada real à API)
  const handleSend = async () => {
    if (!selectedSession) {
      toast.error('Selecione uma sessão WhatsApp');
      return;
    }
    if (contacts.length === 0) {
      toast.error('Carregue um arquivo CSV com contatos');
      return;
    }
    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    setIsSending(true);
    setProgress({ sent: 0, delivered: 0, read: 0, failed: 0, total: contacts.length });

    // Simular envio progressivo
    for (let i = 0; i < contacts.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s por mensagem
      
      // Simular resultado aleatório
      const random = Math.random();
      if (random > 0.9) {
        setProgress(prev => ({ ...prev, sent: prev.sent + 1, failed: prev.failed + 1 }));
      } else if (random > 0.7) {
        setProgress(prev => ({ ...prev, sent: prev.sent + 1, delivered: prev.delivered + 1 }));
      } else {
        setProgress(prev => ({ ...prev, sent: prev.sent + 1, delivered: prev.delivered + 1, read: prev.read + 1 }));
      }

      // Simular alerta anti-bloqueio
      if (i === Math.floor(contacts.length / 2)) {
        setAntiBlockAlert({ active: true, pauseTime: 300 }); // 5 minutos
        toast.warning('Modo anti-bloqueio ativado! Pausando envios...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Pausa de 3s (simulação)
        setAntiBlockAlert(null);
      }
    }

    setIsSending(false);
    toast.success('Envio concluído!');
  };

  const progressPercentage = progress.total > 0 ? (progress.sent / progress.total) * 100 : 0;

  return (
    <PageLayout
      title="Envio em Massa WhatsApp"
      description="Envie mensagens para múltiplos contatos com proteção anti-bloqueio"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuração */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
              <CardDescription>Configure a sessão e carregue os contatos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sessão WhatsApp */}
              <div>
                <Label htmlFor="session">Sessão WhatsApp</Label>
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger id="session">
                    <SelectValue placeholder="Selecione uma sessão" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionsData?.sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.id} ({session.phone}) - {session.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Upload CSV */}
              <div>
                <Label htmlFor="csv">Arquivo CSV</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="csv"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Formato: phone,name,vaga,empresa (primeira linha = cabeçalho)
                </p>
              </div>

              {/* Contatos Carregados */}
              {contacts.length > 0 && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Contatos Carregados</AlertTitle>
                  <AlertDescription>
                    {contacts.length} contatos prontos para envio
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Mensagem */}
          <Card>
            <CardHeader>
              <CardTitle>Mensagem</CardTitle>
              <CardDescription>Use variáveis como {`{{nome}}, {{vaga}}, {{empresa}}`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Olá {{nome}}! Temos uma vaga de {{vaga}} na {{empresa}}..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
              />

              {/* Preview */}
              {contacts.length > 0 && message && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs font-medium mb-2">Preview (primeiro contato):</p>
                  <p className="text-sm">
                    {message.replace(/\{\{(\w+)\}\}/g, (_, key) => contacts[0]?.[key] || `{{${key}}}`)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão Enviar */}
          <Button
            onClick={handleSend}
            disabled={isSending || !selectedSession || contacts.length === 0 || !message.trim()}
            className="w-full"
            size="lg"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar para {contacts.length} contatos
              </>
            )}
          </Button>
        </div>

        {/* Progresso e Estatísticas */}
        <div className="space-y-6">
          {/* Alerta Anti-Bloqueio */}
          {antiBlockAlert?.active && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>⚠️ Modo Anti-Bloqueio Ativado</AlertTitle>
              <AlertDescription>
                Risco de bloqueio detectado! Pausando envios por {Math.floor(antiBlockAlert.pauseTime / 60)} minutos
                para proteger seu número.
              </AlertDescription>
            </Alert>
          )}

          {/* Progresso */}
          <Card>
            <CardHeader>
              <CardTitle>Progresso</CardTitle>
              <CardDescription>Acompanhe o envio em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Enviadas</span>
                  <span className="font-medium">{progress.sent} / {progress.total}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Entregues</p>
                    <p className="text-lg font-bold">{progress.delivered}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lidas</p>
                    <p className="text-lg font-bold">{progress.read}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Falharam</p>
                    <p className="text-lg font-bold">{progress.failed}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                    <p className="text-lg font-bold">{progress.total - progress.sent}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">💡 Dicas de Uso</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-900 space-y-2">
              <p>
                <strong>✅ Variáveis:</strong> Use {`{{nome}}, {{vaga}}, {{empresa}}`} etc. As colunas do CSV
                viram variáveis automaticamente.
              </p>
              <p>
                <strong>🛡️ Anti-Bloqueio:</strong> O sistema pausa automaticamente se detectar risco de bloqueio.
                Respeite os tempos de pausa!
              </p>
              <p>
                <strong>📊 Formato CSV:</strong> Primeira linha = cabeçalhos (phone,name,vaga). Linhas seguintes = dados.
              </p>
              <p>
                <strong>⏱️ Velocidade:</strong> Envios são espaçados automaticamente (1-3s entre mensagens) para
                evitar bloqueios.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
