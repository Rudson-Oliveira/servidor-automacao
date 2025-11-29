import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useVoiceCommand } from "@/hooks/useVoiceCommand";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Componente de controle de voz com indicadores visuais
 * Permite comandos por voz e feedback sonoro
 */

interface VoiceControlProps {
  onCommand?: (command: string) => void;
  className?: string;
  showTranscript?: boolean;
}

export function VoiceControl({ onCommand, className, showTranscript = true }: VoiceControlProps) {
  const [lastCommand, setLastCommand] = useState<string>("");

  const handleCommand = (command: string) => {
    setLastCommand(command);
    
    // Feedback sonoro
    speak(`Comando recebido: ${command}`);
    
    // Executar callback
    if (onCommand) {
      onCommand(command);
    }
    
    toast.success("✅ Comando executado!", {
      description: command
    });
  };

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    isSupported,
    isSpeaking
  } = useVoiceCommand({
    onCommand: handleCommand,
    language: "pt-BR",
    continuous: false
  });

  if (!isSupported) {
    return (
      <Card className={cn("border-2 border-red-200 bg-red-50", className)}>
        <CardContent className="p-4">
          <p className="text-sm text-red-700 text-center">
            ⚠️ Seu navegador não suporta comandos de voz.
            <br />
            Tente usar Chrome, Edge ou Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-2 border-indigo-200", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Botão de Microfone */}
          <div className="relative">
            <Button
              size="lg"
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "w-20 h-20 rounded-full transition-all duration-300",
                isListening 
                  ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50" 
                  : "bg-indigo-600 hover:bg-indigo-700"
              )}
            >
              {isListening ? (
                <MicOff className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </Button>
            
            {/* Indicador de gravação */}
            {isListening && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping" />
            )}
          </div>

          {/* Status */}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {isListening ? "🎤 Escutando..." : "Clique para falar"}
            </p>
            <p className="text-sm text-gray-500">
              {isListening 
                ? "Fale seu comando agora" 
                : "Pressione o botão e diga o que quer fazer"}
            </p>
          </div>

          {/* Transcrição em tempo real */}
          {showTranscript && transcript && (
            <div className="w-full bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-indigo-900 mb-1">
                Você está dizendo:
              </p>
              <p className="text-base text-indigo-700">
                "{transcript}"
              </p>
            </div>
          )}

          {/* Último comando */}
          {lastCommand && !isListening && (
            <div className="w-full bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900 mb-1">
                ✅ Último comando:
              </p>
              <p className="text-base text-green-700">
                "{lastCommand}"
              </p>
            </div>
          )}

          {/* Botão de teste de voz */}
          <Button
            variant="outline"
            onClick={() => speak("Olá! Estou pronto para receber seus comandos.")}
            disabled={isSpeaking}
            className="w-full"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 mr-2" />
                Falando...
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Testar Voz
              </>
            )}
          </Button>

          {/* Exemplos de comandos */}
          <div className="w-full bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-yellow-900 mb-2">
              💡 Exemplos de comandos:
            </p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• "Organizar meus downloads"</li>
              <li>• "Enviar email diário"</li>
              <li>• "Fazer backup dos documentos"</li>
              <li>• "Criar lembrete de reunião"</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
