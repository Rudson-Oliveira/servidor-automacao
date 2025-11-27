import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  Calendar,
  Repeat,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Página de Agendamento de Comandos
 * Permite criar e gerenciar comandos agendados
 */
export default function DesktopScheduler() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<string>("once");
  const utils = trpc.useUtils();

  // Buscar agendamentos
  const { data: schedules, isLoading } = trpc.scheduler.list.useQuery();

  // Buscar agents
  const { data: agents } = trpc.desktopControl.listAgents.useQuery();

  // Mutations
  const createMutation = trpc.scheduler.create.useMutation({
    onSuccess: () => {
      utils.scheduler.list.invalidate();
      setIsCreateDialogOpen(false);
      toast.success("Agendamento criado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao criar agendamento: ${error.message}`);
    },
  });

  const pauseMutation = trpc.scheduler.pause.useMutation({
    onSuccess: () => {
      utils.scheduler.list.invalidate();
      toast.success("Agendamento pausado");
    },
  });

  const resumeMutation = trpc.scheduler.resume.useMutation({
    onSuccess: () => {
      utils.scheduler.list.invalidate();
      toast.success("Agendamento retomado");
    },
  });

  const deleteMutation = trpc.scheduler.delete.useMutation({
    onSuccess: () => {
      utils.scheduler.list.invalidate();
      toast.success("Agendamento deletado");
    },
  });

  const handleCreateSchedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const agentId = parseInt(formData.get("agentId") as string);
    const command = formData.get("command") as string;
    const description = formData.get("description") as string;

    let scheduleConfig: any = {};

    if (scheduleType === "once") {
      scheduleConfig = {
        executeAt: formData.get("executeAt") as string,
      };
    } else if (scheduleType === "interval") {
      scheduleConfig = {
        intervalMinutes: parseInt(formData.get("intervalMinutes") as string),
        startAt: new Date().toISOString(),
      };
    } else if (scheduleType === "cron") {
      scheduleConfig = {
        cronExpression: formData.get("cronExpression") as string,
      };
    } else if (scheduleType === "event") {
      scheduleConfig = {
        eventType: formData.get("eventType") as string,
      };
    }

    createMutation.mutate({
      agentId,
      command,
      description,
      scheduleType: scheduleType as any,
      scheduleConfig: JSON.stringify(scheduleConfig),
    });
  };

  const getScheduleTypeIcon = (type: string) => {
    switch (type) {
      case "once":
        return <Clock className="h-4 w-4" />;
      case "interval":
        return <Repeat className="h-4 w-4" />;
      case "cron":
        return <Calendar className="h-4 w-4" />;
      case "event":
        return <Zap className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      paused: "secondary",
      completed: "outline",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const formatScheduleConfig = (type: string, config: string) => {
    try {
      const parsed = JSON.parse(config);
      if (type === "once") {
        return `Em: ${new Date(parsed.executeAt).toLocaleString("pt-BR")}`;
      } else if (type === "interval") {
        return `A cada ${parsed.intervalMinutes} minutos`;
      } else if (type === "cron") {
        return `Cron: ${parsed.cronExpression}`;
      } else if (type === "event") {
        return `Evento: ${parsed.eventType}`;
      }
    } catch {
      return config;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agendamento de Comandos</h1>
          <p className="text-muted-foreground mt-1">
            Agende comandos para execução automática
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Agendamento</DialogTitle>
              <DialogDescription>
                Configure um comando para ser executado automaticamente
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <Label htmlFor="agentId">Agent</Label>
                <Select name="agentId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents?.map((agent: any) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.deviceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="command">Comando</Label>
                <Input
                  id="command"
                  name="command"
                  placeholder="ls -la"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Descreva o propósito deste agendamento"
                />
              </div>

              <div>
                <Label htmlFor="scheduleType">Tipo de Agendamento</Label>
                <Select
                  value={scheduleType}
                  onValueChange={setScheduleType}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Uma vez (horário específico)</SelectItem>
                    <SelectItem value="interval">Intervalo regular</SelectItem>
                    <SelectItem value="cron">Expressão Cron</SelectItem>
                    <SelectItem value="event">Baseado em evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scheduleType === "once" && (
                <div>
                  <Label htmlFor="executeAt">Data e Hora</Label>
                  <Input
                    id="executeAt"
                    name="executeAt"
                    type="datetime-local"
                    required
                  />
                </div>
              )}

              {scheduleType === "interval" && (
                <div>
                  <Label htmlFor="intervalMinutes">Intervalo (minutos)</Label>
                  <Input
                    id="intervalMinutes"
                    name="intervalMinutes"
                    type="number"
                    min="1"
                    placeholder="60"
                    required
                  />
                </div>
              )}

              {scheduleType === "cron" && (
                <div>
                  <Label htmlFor="cronExpression">Expressão Cron</Label>
                  <Input
                    id="cronExpression"
                    name="cronExpression"
                    placeholder="0 2 * * *"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Exemplo: "0 2 * * *" = Diariamente às 2h
                  </p>
                </div>
              )}

              {scheduleType === "event" && (
                <div>
                  <Label htmlFor="eventType">Tipo de Evento</Label>
                  <Select name="eventType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent_connect">Quando agent conectar</SelectItem>
                      <SelectItem value="agent_disconnect">Quando agent desconectar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Agendamento"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Agendamentos */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Carregando agendamentos...
            </CardContent>
          </Card>
        ) : schedules && schedules.length > 0 ? (
          schedules.map((schedule: any) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getScheduleTypeIcon(schedule.scheduleType)}
                    <div>
                      <CardTitle className="text-lg">
                        {schedule.description || schedule.command}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {schedule.command}
                        </code>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(schedule.status)}
                    {schedule.status === "active" && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => pauseMutation.mutate({ scheduleId: schedule.id })}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {schedule.status === "paused" && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => resumeMutation.mutate({ scheduleId: schedule.id })}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate({ scheduleId: schedule.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Agent ID</p>
                    <p className="font-medium">{schedule.agentId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Configuração</p>
                    <p className="font-medium">
                      {formatScheduleConfig(schedule.scheduleType, schedule.scheduleConfig)}
                    </p>
                  </div>
                  {schedule.lastExecutedAt && (
                    <div>
                      <p className="text-muted-foreground">Última Execução</p>
                      <p className="font-medium">
                        {new Date(schedule.lastExecutedAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  )}
                  {schedule.nextExecutionAt && (
                    <div>
                      <p className="text-muted-foreground">Próxima Execução</p>
                      <p className="font-medium">
                        {new Date(schedule.nextExecutionAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Tentativas</p>
                    <p className="font-medium">
                      {schedule.currentRetries} / {schedule.maxRetries}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum agendamento criado</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Agendamento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
