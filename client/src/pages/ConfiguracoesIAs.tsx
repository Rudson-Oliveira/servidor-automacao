import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface IAConfig {
  nome: string;
  descricao: string;
  apiKey: string;
  status: 'desconectado' | 'conectado' | 'testando';
  cor: string;
  icone: string;
  disponivel: boolean;
}

export default function ConfiguracoesIAs() {
  const [mostrarChaves, setMostrarChaves] = useState<Record<string, boolean>>({});
  const [ias, setIas] = useState<Record<string, IAConfig>>({
    perplexity: {
      nome: "Perplexity",
      descricao: "IA de pesquisa e conversação",
      apiKey: "",
      status: 'desconectado',
      cor: "bg-blue-500",
      icone: "🔍",
      disponivel: true,
    },
    manus: {
      nome: "Manus",
      descricao: "IA de desenvolvimento e código",
      apiKey: "",
      status: 'desconectado',
      cor: "bg-purple-500",
      icone: "💻",
      disponivel: true,
    },
    genspark: {
      nome: "Genspark",
      descricao: "IA de pesquisa (sem API - integração manual)",
      apiKey: "",
      status: 'desconectado',
      cor: "bg-green-500",
      icone: "✨",
      disponivel: false,
    },
    abacus: {
      nome: "Abacus.ai",
      descricao: "IA de organização e análise",
      apiKey: "",
      status: 'desconectado',
      cor: "bg-orange-500",
      icone: "📊",
      disponivel: true,
    },
    deepagente: {
      nome: "DeepAgente",
      descricao: "IA de automação e agentes",
      apiKey: "",
      status: 'desconectado',
      cor: "bg-red-500",
      icone: "🤖",
      disponivel: true,
    },
  });

  const alterarApiKey = (iaId: string, valor: string) => {
    setIas(prev => ({
      ...prev,
      [iaId]: { ...prev[iaId], apiKey: valor }
    }));
  };

  const toggleMostrarChave = (iaId: string) => {
    setMostrarChaves(prev => ({
      ...prev,
      [iaId]: !prev[iaId]
    }));
  };

  const testarConexao = async (iaId: string) => {
    const ia = ias[iaId];
    
    if (!ia.apiKey) {
      toast.error("Por favor, insira a chave de API primeiro");
      return;
    }

    // Atualizar status para testando
    setIas(prev => ({
      ...prev,
      [iaId]: { ...prev[iaId], status: 'testando' }
    }));

    try {
      // Simular teste de conexão (substituir por chamada real à API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Sucesso
      setIas(prev => ({
        ...prev,
        [iaId]: { ...prev[iaId], status: 'conectado' }
      }));
      
      toast.success(`${ia.nome} conectado com sucesso! ✅`);
    } catch (error) {
      // Erro
      setIas(prev => ({
        ...prev,
        [iaId]: { ...prev[iaId], status: 'desconectado' }
      }));
      
      toast.error(`Falha ao conectar com ${ia.nome}. Verifique a chave de API.`);
    }
  };

  const salvarConfiguracao = async (iaId: string) => {
    const ia = ias[iaId];
    
    if (!ia.apiKey) {
      toast.error("Por favor, insira a chave de API primeiro");
      return;
    }

    try {
      // Aqui você faria a chamada real para salvar no backend
      // await fetch('/api/ias/configurar', { ... })
      
      toast.success(`Configuração de ${ia.nome} salva com sucesso!`);
    } catch (error) {
      toast.error(`Erro ao salvar configuração de ${ia.nome}`);
    }
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'conectado':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'testando':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⚙️ Configurações de IAs
          </h1>
          <p className="text-lg text-gray-600">
            Configure as chaves de API para conectar com diferentes IAs. É simples e rápido!
          </p>
        </div>

        {/* Guia Rápido */}
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 Como Funciona?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Obtenha a chave de API no site de cada IA (links abaixo)</li>
              <li>Cole a chave no campo correspondente</li>
              <li>Clique em "Testar Conexão" para verificar se funciona</li>
              <li>Clique em "Salvar" para guardar a configuração</li>
              <li>Pronto! A IA está conectada e pronta para usar 🎉</li>
            </ol>
          </CardContent>
        </Card>

        {/* Cards de IAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(ias).map(([iaId, ia]) => (
            <Card key={iaId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${ia.cor} rounded-lg flex items-center justify-center text-2xl`}>
                      {ia.icone}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{ia.nome}</CardTitle>
                      <CardDescription>{ia.descricao}</CardDescription>
                    </div>
                  </div>
                  {renderStatusIcon(ia.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {!ia.disponivel ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ℹ️ {ia.nome} não possui API pública. A integração será feita manualmente.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Campo de API Key */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${iaId}-key`}>Chave de API</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              A chave de API é como uma senha que permite o sistema se conectar com {ia.nome}.
                              Você pode obter uma no site oficial.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id={`${iaId}-key`}
                            type={mostrarChaves[iaId] ? "text" : "password"}
                            placeholder="Cole sua chave de API aqui"
                            value={ia.apiKey}
                            onChange={(e) => alterarApiKey(iaId, e.target.value)}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => toggleMostrarChave(iaId)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {mostrarChaves[iaId] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => testarConexao(iaId)}
                        disabled={ia.status === 'testando' || !ia.apiKey}
                        variant="outline"
                        className="flex-1"
                      >
                        {ia.status === 'testando' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testando...
                          </>
                        ) : (
                          <>
                            🔌 Testar Conexão
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => salvarConfiguracao(iaId)}
                        disabled={!ia.apiKey}
                        className="flex-1"
                      >
                        💾 Salvar
                      </Button>
                    </div>

                    {/* Status da Conexão */}
                    {ia.status === 'conectado' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Conectado e funcionando! Você pode usar {ia.nome} agora.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Link para obter API Key */}
                {ia.disponivel && (
                  <div className="pt-2 border-t">
                    <a
                      href="#"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      📖 Como obter a chave de API do {ia.nome}?
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rodapé com Ajuda */}
        <Card className="mt-8 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ❓ Precisa de Ajuda?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Se tiver dúvidas sobre como configurar as IAs, consulte nossa documentação ou entre em contato com o suporte.
            </p>
            <div className="flex gap-4">
              <Button variant="outline">
                📚 Ver Documentação
              </Button>
              <Button variant="outline">
                💬 Falar com Suporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
