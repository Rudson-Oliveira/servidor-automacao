import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

/**
 * Hook para comandos de voz usando Web Speech API
 * Suporta speech-to-text e text-to-speech
 */

interface VoiceCommandOptions {
  onCommand?: (command: string) => void;
  onTranscript?: (transcript: string) => void;
  language?: string;
  continuous?: boolean;
}

interface VoiceCommandResult {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  isSupported: boolean;
  isSpeaking: boolean;
}

export function useVoiceCommand(options: VoiceCommandOptions = {}): VoiceCommandResult {
  const {
    onCommand,
    onTranscript,
    language = "pt-BR",
    continuous = false
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Verificar suporte do navegador
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;

    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      synthesisRef.current = speechSynthesis;

      // Configurar reconhecimento de voz
      if (recognitionRef.current) {
        recognitionRef.current.lang = language;
        recognitionRef.current.continuous = continuous;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          
          setTranscript(transcriptText);
          
          if (onTranscript) {
            onTranscript(transcriptText);
          }

          // Se for resultado final, executar comando
          if (event.results[current].isFinal) {
            if (onCommand) {
              onCommand(transcriptText);
            }
          }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Erro no reconhecimento de voz:", event.error);
          
          let errorMessage = "Erro ao reconhecer voz";
          
          switch (event.error) {
            case "no-speech":
              errorMessage = "Nenhuma fala detectada. Tente falar mais alto.";
              break;
            case "audio-capture":
              errorMessage = "Microfone não encontrado. Verifique suas permissões.";
              break;
            case "not-allowed":
              errorMessage = "Permissão negada. Ative o microfone nas configurações.";
              break;
            case "network":
              errorMessage = "Erro de rede. Verifique sua conexão.";
              break;
            default:
              errorMessage = `Erro: ${event.error}`;
          }
          
          toast.error(errorMessage);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    } else {
      setIsSupported(false);
      console.warn("Web Speech API não suportada neste navegador");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, onCommand, onTranscript]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error("Seu navegador não suporta comandos de voz");
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript("");
        toast.success("🎤 Escutando... Pode falar!", {
          duration: 2000
        });
      } catch (error) {
        console.error("Erro ao iniciar reconhecimento:", error);
        toast.error("Erro ao iniciar microfone");
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.info("🛑 Gravação parada");
    }
  }, [isListening]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !synthesisRef.current) {
      toast.error("Seu navegador não suporta síntese de voz");
      return;
    }

    // Cancelar qualquer fala em andamento
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("Erro na síntese de voz:", event.error);
      setIsSpeaking(false);
      toast.error("Erro ao falar texto");
    };

    synthesisRef.current.speak(utterance);
  }, [isSupported, language]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    isSupported,
    isSpeaking
  };
}

// Tipos globais para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };
}
