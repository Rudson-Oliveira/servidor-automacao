import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Componente para solicitar permissão de notificações push
 * e registrar subscription no backend
 */
export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: publicKey } = trpc.pushNotifications.getPublicKey.useQuery();
  const subscribeMutation = trpc.pushNotifications.subscribe.useMutation();
  const unsubscribeMutation = trpc.pushNotifications.unsubscribe.useMutation();
  const testNotificationMutation = trpc.pushNotifications.sendTestNotification.useMutation();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  /**
   * Verifica se já existe subscription ativa
   */
  async function checkSubscription() {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Erro ao verificar subscription:", error);
    }
  }

  /**
   * Solicita permissão e registra subscription
   */
  async function requestPermission() {
    if (!("Notification" in window)) {
      toast.error("Notificações não suportadas neste navegador");
      return;
    }

    if (!publicKey?.publicKey) {
      toast.error("Chave pública não disponível");
      return;
    }

    setIsLoading(true);

    try {
      // Solicita permissão
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        toast.error("Permissão de notificações negada");
        setIsLoading(false);
        return;
      }

      // Registra service worker
      const registration = await navigator.serviceWorker.ready;

      // Cria subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey.publicKey),
      });

      // Envia subscription para o backend
      const subscriptionJSON = subscription.toJSON();
      
      await subscribeMutation.mutateAsync({
        endpoint: subscriptionJSON.endpoint!,
        keys: {
          p256dh: subscriptionJSON.keys!.p256dh!,
          auth: subscriptionJSON.keys!.auth!,
        },
        userAgent: navigator.userAgent,
        deviceName: getDeviceName(),
      });

      setIsSubscribed(true);
      toast.success("Notificações ativadas com sucesso!");
    } catch (error) {
      console.error("Erro ao ativar notificações:", error);
      toast.error("Erro ao ativar notificações");
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Cancela subscription
   */
  async function unsubscribe() {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        const subscriptionJSON = subscription.toJSON();
        await unsubscribeMutation.mutateAsync({
          endpoint: subscriptionJSON.endpoint!,
        });
      }

      setIsSubscribed(false);
      toast.success("Notificações desativadas");
    } catch (error) {
      console.error("Erro ao desativar notificações:", error);
      toast.error("Erro ao desativar notificações");
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Envia notificação de teste
   */
  async function sendTestNotification() {
    try {
      const result = await testNotificationMutation.mutateAsync();
      
      if (result.success) {
        toast.success(`Notificação enviada! (${result.sent}/${result.total})`);
      } else {
        toast.error(result.message || "Erro ao enviar notificação");
      }
    } catch (error) {
      console.error("Erro ao enviar notificação de teste:", error);
      toast.error("Erro ao enviar notificação de teste");
    }
  }

  // Se notificações não são suportadas
  if (!("Notification" in window)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações não suportadas
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? (
            <>
              <Bell className="h-5 w-5 text-green-600" />
              Notificações Ativas
            </>
          ) : (
            <>
              <BellOff className="h-5 w-5 text-gray-400" />
              Notificações Inativas
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isSubscribed
            ? "Você receberá notificações sobre eventos importantes"
            : "Ative para receber notificações mesmo com o app fechado"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Status:</span>
          {permission === "granted" && isSubscribed && (
            <span className="flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" />
              Ativo
            </span>
          )}
          {permission === "granted" && !isSubscribed && (
            <span className="flex items-center gap-1 text-yellow-600">
              <Bell className="h-4 w-4" />
              Permissão concedida (não inscrito)
            </span>
          )}
          {permission === "denied" && (
            <span className="flex items-center gap-1 text-red-600">
              <X className="h-4 w-4" />
              Bloqueado
            </span>
          )}
          {permission === "default" && (
            <span className="text-gray-600">Aguardando permissão</span>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button
              onClick={requestPermission}
              disabled={isLoading || permission === "denied"}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              Ativar Notificações
            </Button>
          ) : (
            <>
              <Button
                onClick={unsubscribe}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
                Desativar
              </Button>
              <Button
                onClick={sendTestNotification}
                disabled={testNotificationMutation.isPending}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {testNotificationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                Testar
              </Button>
            </>
          )}
        </div>

        {/* Aviso se bloqueado */}
        {permission === "denied" && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            <p className="font-medium">Notificações bloqueadas</p>
            <p className="text-xs mt-1">
              Para ativar, vá nas configurações do navegador e permita notificações para este site
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Converte VAPID key de base64 para Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Detecta nome do dispositivo
 */
function getDeviceName(): string {
  const ua = navigator.userAgent;
  
  if (/mobile/i.test(ua)) {
    if (/android/i.test(ua)) return "Android Mobile";
    if (/iphone/i.test(ua)) return "iPhone";
    if (/ipad/i.test(ua)) return "iPad";
    return "Mobile Device";
  }
  
  if (/mac/i.test(ua)) return "Mac";
  if (/win/i.test(ua)) return "Windows";
  if (/linux/i.test(ua)) return "Linux";
  
  return "Desktop";
}
