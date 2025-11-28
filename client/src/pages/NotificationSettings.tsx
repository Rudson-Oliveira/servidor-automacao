import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { NotificationPermission } from "@/components/NotificationPermission";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, MessageSquare, CheckCircle, AlertTriangle, Monitor, RefreshCw } from "lucide-react";

/**
 * Página de configurações de notificações push
 */
export default function NotificationSettings() {
  const { data: subscriptions, refetch } = trpc.pushNotifications.listSubscriptions.useQuery();
  const updateEventsMutation = trpc.pushNotifications.updateEnabledEvents.useMutation();

  // Estado local dos eventos habilitados (primeira subscription)
  const [enabledEvents, setEnabledEvents] = useState<Record<string, boolean>>({
    whatsapp_message: true,
    task_completed: true,
    system_alert: true,
    desktop_command: true,
    obsidian_sync: true,
  });

  // Atualiza estado quando subscriptions carregam
  useState(() => {
    if (subscriptions && subscriptions.length > 0) {
      const events = subscriptions[0]!.enabledEvents as string[];
      setEnabledEvents({
        whatsapp_message: events.includes("whatsapp_message"),
        task_completed: events.includes("task_completed"),
        system_alert: events.includes("system_alert"),
        desktop_command: events.includes("desktop_command"),
        obsidian_sync: events.includes("obsidian_sync"),
      });
    }
  });

  /**
   * Atualiza eventos habilitados no backend
   */
  async function toggleEvent(eventType: string, enabled: boolean) {
    if (!subscriptions || subscriptions.length === 0) {
      toast.error("Nenhuma subscription ativa");
      return;
    }

    const newEnabledEvents = { ...enabledEvents, [eventType]: enabled };
    setEnabledEvents(newEnabledEvents);

    const eventsArray = Object.entries(newEnabledEvents)
      .filter(([_, isEnabled]) => isEnabled)
      .map(([event, _]) => event);

    try {
      await updateEventsMutation.mutateAsync({
        subscriptionId: subscriptions[0]!.id,
        enabledEvents: eventsArray,
      });

      toast.success("Configurações atualizadas");
      refetch();
    } catch (error) {
      console.error("Erro ao atualizar eventos:", error);
      toast.error("Erro ao atualizar configurações");
      // Reverte estado
      setEnabledEvents({ ...enabledEvents, [eventType]: !enabled });
    }
  }

  const eventTypes = [
    {
      id: "whatsapp_message",
      label: "Mensagens WhatsApp",
      description: "Notificar quando receber novas mensagens no WhatsApp",
      icon: MessageSquare,
    },
    {
      id: "task_completed",
      label: "Tarefas Concluídas",
      description: "Notificar quando tarefas forem concluídas com sucesso",
      icon: CheckCircle,
    },
    {
      id: "system_alert",
      label: "Alertas de Sistema",
      description: "Notificar sobre alertas e avisos importantes do sistema",
      icon: AlertTriangle,
    },
    {
      id: "desktop_command",
      label: "Comandos Desktop",
      description: "Notificar quando comandos desktop forem finalizados",
      icon: Monitor,
    },
    {
      id: "obsidian_sync",
      label: "Sync Obsidian",
      description: "Notificar quando sincronização com Obsidian for concluída",
      icon: RefreshCw,
    },
  ];

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Configurações de Notificações
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure como e quando você deseja receber notificações push
        </p>
      </div>

      <Separator />

      {/* Componente de permissão */}
      <NotificationPermission />

      {/* Configurações de eventos */}
      {subscriptions && subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Notificação</CardTitle>
            <CardDescription>
              Escolha quais eventos devem gerar notificações push
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {eventTypes.map((eventType) => {
              const Icon = eventType.icon;
              return (
                <div key={eventType.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="space-y-1">
                      <Label htmlFor={eventType.id} className="text-base font-medium cursor-pointer">
                        {eventType.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {eventType.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={eventType.id}
                    checked={enabledEvents[eventType.id] || false}
                    onCheckedChange={(checked) => toggleEvent(eventType.id, checked)}
                    disabled={updateEventsMutation.isPending}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Dispositivos registrados */}
      {subscriptions && subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos Registrados</CardTitle>
            <CardDescription>
              {subscriptions.length} {subscriptions.length === 1 ? "dispositivo" : "dispositivos"} recebendo notificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{sub.deviceName || "Dispositivo desconhecido"}</p>
                    <p className="text-xs text-muted-foreground">
                      Registrado em {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    {sub.lastUsedAt && (
                      <p className="text-xs text-muted-foreground">
                        Última notificação: {new Date(sub.lastUsedAt).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-green-600 font-medium">Ativo</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
