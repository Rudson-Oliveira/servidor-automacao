import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

/**
 * Error Boundary com integração Sentry
 * 
 * Captura erros do React e envia para Sentry
 * Exibe UI de fallback amigável
 */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Erro capturado:", error, errorInfo);

    // Enviar para Sentry (se configurado)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }

    // Callback customizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle>Ops! Algo deu errado</CardTitle>
                  <CardDescription>
                    Ocorreu um erro inesperado na aplicação
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mensagem de erro */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-mono text-sm text-muted-foreground">
                  {this.state.error?.message || "Erro desconhecido"}
                </p>
              </div>

              {/* Stack trace (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                <details className="bg-muted p-4 rounded-lg">
                  <summary className="cursor-pointer font-medium mb-2">
                    Stack Trace (desenvolvimento)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-64">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Ações */}
              <div className="flex gap-3">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button onClick={this.handleReload} variant="outline">
                  Recarregar Página
                </Button>
              </div>

              {/* Informações adicionais */}
              <div className="text-sm text-muted-foreground">
                <p>
                  O erro foi reportado automaticamente para nossa equipe.
                  Se o problema persistir, entre em contato com o suporte.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Declaração de tipo para window.Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
      captureMessage: (message: string, level?: string) => void;
      setUser: (user: any) => void;
      setTag: (key: string, value: string) => void;
      setContext: (name: string, context: any) => void;
    };
  }
}
