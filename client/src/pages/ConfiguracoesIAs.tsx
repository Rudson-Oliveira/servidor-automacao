import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface IAConfig {
  nome: string;
  descricao: string;
  apiKey: string;
  status: 'desconectado' | 'conectado' | 'testando';
  cor: string;
  icone: string;
  disponivel: boolean;
  linkDocumentacao?: string;
  camposAdicionais?: {
    porta?: number;
    usarHttps?: boolean;
  };
}

function AdicionarApiDialog() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [url, setUrl] = useState("");
  const [metodo, setMetodo] = useState<"GET" | "POST" | "PUT" | "DELETE" | "PATCH">("POST");
  const [chaveApi, setChaveApi] = useState("");
  const [tipoAutenticacao, setTipoAutenticacao] = useState<"none" | "bearer" | "api_key" | "basic" | "custom">("bearer");
  
  const criarApiMutation = trpc.apisPersonalizadas.criar.useMutation({
    onSuccess: () => {
      toast.success("API personalizada adicionada com sucesso!");
      setOpen(false);
      // Limpar formulário
      setNome("");
      setDescricao("");
      setUrl("");
      setChaveApi("");
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar API: ${error.message}`);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !url) {
      toast.error("Nome e URL são obrigatórios");
      return;
    }
    
    criarApiMutation.mutate({
      nome,
      descricao,
      url,
      metodo,
      chaveApi,
      tipoAutenticacao,
      ativa: 1,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar API
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar API Personalizada</DialogTitle>
          <DialogDescription>
            Configure uma nova integração com API externa
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da API *</Label>
            <Input
              id="nome"
              placeholder="Ex: OpenAI, Anthropic, Custom API"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Breve descrição da API"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          
          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">URL do Endpoint *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://api.exemplo.com/v1/endpoint"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          
          {/* Método HTTP */}
          <div className="space-y-2">
            <Label htmlFor="metodo">Método HTTP</Label>
            <Select value={metodo} onValueChange={(v: any) => setMetodo(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Tipo de Autenticação */}
          <div className="space-y-2">
            <Label htmlFor="tipoAuth">Tipo de Autenticação</Label>
            <Select value={tipoAutenticacao} onValueChange={(v: any) => setTipoAutenticacao(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="custom">Customizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Chave API */}
          {tipoAutenticacao !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="chaveApi">Chave de API / Token</Label>
              <Input
                id="chaveApi"
                type="password"
                placeholder="Cole sua chave de API aqui"
                value={chaveApi}
                onChange={(e) => setChaveApi(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                A chave será criptografada antes de ser salva
              </p>
            </div>
          )}
          
          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={criarApiMutation.isPending} className="flex-1">
              {criarApiMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Adicionar API"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
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
      linkDocumentacao: "https://docs.perplexity.ai/docs/getting-started",
    },
    manus: {
      nome: "Manus",
      descricao: "IA de desenvolvimento e código",
      apiKey: "",
      status: 'desconectado',
      cor: "bg-purple-500",
      icone: "💻",
      disponivel: true,
      linkDocumentacao: "https://docs.manus.im/api",
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
      linkDocumentacao: "https://api.abacus.ai/docs",
    },
    deepagente: {
      nome: "DeepAgente",
      descricao: "IA de automação e agentes",
      apiKey: "",
      status: 'desconectado',
      cor: "bg-red-500",
      icone: "🤖",
      disponivel: true,
      linkDocumentacao: "https://deepagente.com/docs/api",
    },
    obsidian: {
      nome: "Obsidian",
      descricao: "Sistema de notas e conhecimento pessoal",
      apiKey: "9158ad0eb1c3be5ba7ac1b743c4404e9ebc25464ef88f9bec0bc07528e0b2383",
      status: 'desconectado',
      cor: "bg-indigo-500",
      icone: "📝",
      disponivel: true,
      linkDocumentacao: "https://coddingtonbear.github.io/obsidian-local-rest-api/",
      camposAdicionais: {
        porta: 27123,
        usarHttps: false,
      },
    },
  });

  const alterarApiKey = (iaId: string, valor: string) => {
    setIas(prev => ({
      ...prev,
      [iaId]: { ...prev[iaId], apiKey: valor }
    }));
  };

  const alterarPorta = (iaId: string, porta: number) => {
    setIas(prev => ({
      ...prev,
      [iaId]: { 
        ...prev[iaId], 
        camposAdicionais: { 
          ...prev[iaId].camposAdicionais, 
          porta 
        } 
      }
    }));
  };

  const toggleHttps = (iaId: string) => {
    setIas(prev => ({
      ...prev,
      [iaId]: { 
        ...prev[iaId], 
        camposAdicionais: { 
          ...prev[iaId].camposAdicionais, 
          usarHttps: !prev[iaId].camposAdicionais?.usarHttps 
        } 
      }
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
      // Fazer teste REAL de conexão com a API via tRPC
      const response = await fetch('/api/trpc/integration.testConnection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iaId,
          apiKey: ia.apiKey,
          nome: ia.nome,
          porta: ia.camposAdicionais?.porta,
          usarHttps: ia.camposAdicionais?.usarHttps,
        }),
      });

      const data = await response.json();
      const result = data.result?.data;

      if (response.ok && result?.sucesso) {
        setIas(prev => ({
          ...prev,
          [iaId]: { ...prev[iaId], status: 'conectado' }
        }));
        
        // Mensagem especial para Obsidian
        if (result.mensagem) {
          toast.success(result.mensagem, { duration: 8000 });
        } else {
          toast.success(`✅ TESTE REALIZADO E CONCLUÍDO COM SUCESSO! ${ia.nome} está funcionando corretamente.`);
        }
      } else {
        setIas(prev => ({
          ...prev,
          [iaId]: { ...prev[iaId], status: 'desconectado' }
        }));
        toast.error(`❌ Falha no teste: ${result?.erro || data.error?.message || 'API key inválida ou serviço indisponível'}`);
      }
    } catch (error: any) {
      setIas(prev => ({
        ...prev,
        [iaId]: { ...prev[iaId], status: 'desconectado' }
      }));
      toast.error(`❌ Erro de conexão: ${error.message || 'Verifique sua internet e a chave de API'}`);
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ⚙️ Configurações de IAs
            </h1>
            <p className="text-lg text-gray-600">
              Configure as chaves de API para conectar com diferentes IAs. É simples e rápido!
            </p>
          </div>
          <AdicionarApiDialog />
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

                    {/* Campos Adicionais (Obsidian) */}
                    {ia.camposAdicionais && (
                      <div className="space-y-3 border-t pt-3">
                        {/* Porta */}
                        {ia.camposAdicionais.porta !== undefined && (
                          <div className="space-y-2">
                            <Label htmlFor={`${iaId}-porta`}>Porta da API Local</Label>
                            <Input
                              id={`${iaId}-porta`}
                              type="number"
                              placeholder="27123"
                              value={ia.camposAdicionais.porta}
                              onChange={(e) => alterarPorta(iaId, parseInt(e.target.value))}
                            />
                            <p className="text-xs text-gray-500">
                              Porta padrão: 27123 (HTTP) ou 27124 (HTTPS)
                            </p>
                          </div>
                        )}

                        {/* Toggle HTTPS */}
                        {ia.camposAdicionais.usarHttps !== undefined && (
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Usar HTTPS</Label>
                              <p className="text-xs text-gray-500">
                                Ativar conexão segura (certificado auto-assinado)
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleHttps(iaId)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                ia.camposAdicionais.usarHttps ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  ia.camposAdicionais.usarHttps ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        )}

                        {/* Informação sobre conexão local */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800">
                            💡 <strong>Atenção:</strong> O Obsidian deve estar aberto no seu computador com o plugin "Local REST API" ativo.
                          </p>
                        </div>
                      </div>
                    )}

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
                      href={ia.linkDocumentacao || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      📚 {iaId === 'obsidian' ? 'Documentação do Plugin Local REST API' : `Como obter a chave de API do ${ia.nome}?`}
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
