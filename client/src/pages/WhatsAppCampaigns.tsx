import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Play, Pause, X, Calendar, Clock, Users, Send } from 'lucide-react';
import { toast } from 'sonner';

type CampaignStatus = 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';

interface Campaign {
  id: number;
  name: string;
  status: CampaignStatus;
  scheduledStart: Date;
  scheduledEnd?: Date;
  totalContacts: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  allowedHoursStart: string;
  allowedHoursEnd: string;
  maxPerHour: number;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    name: 'Recrutamento Desenvolvedores - Janeiro',
    status: 'running',
    scheduledStart: new Date('2025-01-15T09:00:00'),
    scheduledEnd: new Date('2025-01-20T18:00:00'),
    totalContacts: 500,
    sent: 320,
    delivered: 305,
    read: 180,
    failed: 15,
    allowedHoursStart: '09:00',
    allowedHoursEnd: '18:00',
    maxPerHour: 50,
  },
  {
    id: 2,
    name: 'Campanha Marketing - Novos Produtos',
    status: 'scheduled',
    scheduledStart: new Date('2025-02-01T10:00:00'),
    totalContacts: 1000,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    allowedHoursStart: '10:00',
    allowedHoursEnd: '17:00',
    maxPerHour: 100,
  },
  {
    id: 3,
    name: 'Suporte - Pesquisa de Satisfação',
    status: 'completed',
    scheduledStart: new Date('2024-12-01T09:00:00'),
    scheduledEnd: new Date('2024-12-05T18:00:00'),
    totalContacts: 300,
    sent: 300,
    delivered: 295,
    read: 250,
    failed: 5,
    allowedHoursStart: '09:00',
    allowedHoursEnd: '18:00',
    maxPerHour: 30,
  },
];

export default function WhatsAppCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'all'>('all');

  const getStatusColor = (status: CampaignStatus) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      running: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getStatusLabel = (status: CampaignStatus) => {
    const labels = {
      scheduled: 'Agendada',
      running: 'Em Andamento',
      paused: 'Pausada',
      completed: 'Concluída',
      cancelled: 'Cancelada',
    };
    return labels[status];
  };

  const handlePause = (id: number) => {
    setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: 'paused' as CampaignStatus } : c));
    toast.success('Campanha pausada');
  };

  const handleResume = (id: number) => {
    setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: 'running' as CampaignStatus } : c));
    toast.success('Campanha retomada');
  };

  const handleCancel = (id: number) => {
    if (confirm('Tem certeza que deseja cancelar esta campanha?')) {
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: 'cancelled' as CampaignStatus } : c));
      toast.success('Campanha cancelada');
    }
  };

  const filteredCampaigns = filterStatus === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === filterStatus);

  return (
    <PageLayout
      title="Campanhas WhatsApp"
      description="Gerencie campanhas de envio em massa com agendamento automático"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as CampaignStatus | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="scheduled">Agendadas</SelectItem>
                <SelectItem value="running">Em Andamento</SelectItem>
                <SelectItem value="paused">Pausadas</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Campanha</DialogTitle>
                <DialogDescription>
                  Configure uma campanha de envio em massa com agendamento
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="campaign-name">Nome da Campanha</Label>
                  <Input id="campaign-name" placeholder="Ex: Recrutamento Janeiro 2025" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Data/Hora Início</Label>
                    <Input id="start-date" type="datetime-local" />
                  </div>
                  <div>
                    <Label htmlFor="end-date">Data/Hora Fim (opcional)</Label>
                    <Input id="end-date" type="datetime-local" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hour-start">Horário Permitido - Início</Label>
                    <Input id="hour-start" type="time" defaultValue="09:00" />
                  </div>
                  <div>
                    <Label htmlFor="hour-end">Horário Permitido - Fim</Label>
                    <Input id="hour-end" type="time" defaultValue="18:00" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="max-per-hour">Máximo de Mensagens por Hora</Label>
                  <Input id="max-per-hour" type="number" defaultValue="50" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recomendado: 30-100 mensagens/hora para evitar bloqueios
                  </p>
                </div>

                <div>
                  <Label htmlFor="csv-upload">Upload de Contatos (CSV)</Label>
                  <Input id="csv-upload" type="file" accept=".csv" />
                </div>

                <div>
                  <Label htmlFor="template">Template de Mensagem</Label>
                  <Textarea
                    id="template"
                    placeholder="Olá {{nome}}! Temos uma vaga de {{vaga}}..."
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  toast.success('Campanha criada com sucesso!');
                  setIsDialogOpen(false);
                }}>
                  Criar Campanha
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Campanhas */}
        <div className="grid gap-6">
          {filteredCampaigns.map((campaign) => {
            const progress = campaign.totalContacts > 0
              ? (campaign.sent / campaign.totalContacts) * 100
              : 0;

            return (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{campaign.name}</CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {campaign.scheduledStart.toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {campaign.allowedHoursStart} - {campaign.allowedHoursEnd}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {campaign.totalContacts} contatos
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                      {campaign.status === 'running' && (
                        <Button variant="outline" size="sm" onClick={() => handlePause(campaign.id)}>
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {campaign.status === 'paused' && (
                        <Button variant="outline" size="sm" onClick={() => handleResume(campaign.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {(campaign.status === 'running' || campaign.status === 'paused' || campaign.status === 'scheduled') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(campaign.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progresso */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">
                          {campaign.sent} / {campaign.totalContacts} ({progress.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{campaign.sent}</p>
                        <p className="text-xs text-muted-foreground">Enviadas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{campaign.delivered}</p>
                        <p className="text-xs text-muted-foreground">Entregues</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{campaign.read}</p>
                        <p className="text-xs text-muted-foreground">Lidas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{campaign.failed}</p>
                        <p className="text-xs text-muted-foreground">Falharam</p>
                      </div>
                    </div>

                    {/* Configurações */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                      <span>Máx: {campaign.maxPerHour}/hora</span>
                      <span>•</span>
                      <span>Taxa de sucesso: {((campaign.delivered / (campaign.sent || 1)) * 100).toFixed(1)}%</span>
                      <span>•</span>
                      <span>Taxa de leitura: {((campaign.read / (campaign.delivered || 1)) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredCampaigns.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma campanha encontrada.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
