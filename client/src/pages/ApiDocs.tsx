import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Book, 
  Code, 
  Server, 
  Shield, 
  Zap, 
  Search,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Database,
  MessageSquare,
  Bot,
  Eye,
  Phone,
  Webhook,
  Bell,
  Calendar,
  Link,
  Activity,
  Cpu,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface EndpointCategory {
  name: string;
  icon: React.ReactNode;
  description: string;
  endpoints: {
    name: string;
    method: string;
    type: string;
    description: string;
    example?: string;
  }[];
}

const categories: EndpointCategory[] = [
  {
    name: "Autenticação",
    icon: <Shield className="w-5 h-5" />,
    description: "Gerenciamento de autenticação e API keys",
    endpoints: [
      {
        name: "auth.me",
        method: "GET",
        type: "Public",
        description: "Retorna informações do usuário autenticado"
      },
      {
        name: "auth.logout",
        method: "POST",
        type: "Public",
        description: "Realiza logout e invalida sessão"
      },
      {
        name: "auth.generateKey",
        method: "POST",
        type: "Protected",
        description: "Gera uma nova API key",
        example: `const result = await trpc.auth.generateKey.mutate({
  name: 'Comet Integration',
  permissions: ['read', 'write', 'execute']
});`
      }
    ]
  },
  {
    name: "Servidores",
    icon: <Server className="w-5 h-5" />,
    description: "Gerenciamento de servidores, departamentos e arquivos",
    endpoints: [
      {
        name: "servidor.listarServidores",
        method: "GET",
        type: "Protected",
        description: "Listar todos os servidores"
      },
      {
        name: "servidor.buscarArquivos",
        method: "POST",
        type: "Protected",
        description: "Buscar arquivos por critérios",
        example: `const arquivos = await trpc.servidor.buscarArquivos.mutate({
  query: 'relatório',
  tipo: 'pdf',
  dataInicio: '2024-01-01'
});`
      },
      {
        name: "servidor.getEstatisticas",
        method: "GET",
        type: "Protected",
        description: "Obter estatísticas do servidor"
      }
    ]
  },
  {
    name: "Desktop Control",
    icon: <Cpu className="w-5 h-5" />,
    description: "Controle remoto de desktops e captura de tela",
    endpoints: [
      {
        name: "desktop-control.registerAgent",
        method: "POST",
        type: "Protected",
        description: "Registrar novo agente desktop"
      },
      {
        name: "desktop-control.sendCommand",
        method: "POST",
        type: "Protected",
        description: "Enviar comando para agente",
        example: `const command = await trpc.desktopControl.sendCommand.mutate({
  agentId: 'agent-123',
  type: 'screenshot',
  parameters: { quality: 'high' }
});`
      },
      {
        name: "desktop-control.listScreenshots",
        method: "GET",
        type: "Protected",
        description: "Listar screenshots capturados"
      }
    ]
  },
  {
    name: "Obsidian",
    icon: <FileText className="w-5 h-5" />,
    description: "Integração com Obsidian para gestão de notas",
    endpoints: [
      {
        name: "obsidianAdvanced.createVault",
        method: "POST",
        type: "Protected",
        description: "Criar novo vault"
      },
      {
        name: "obsidianAdvanced.createNota",
        method: "POST",
        type: "Protected",
        description: "Criar nova nota"
      },
      {
        name: "obsidian-ai.generateNote",
        method: "POST",
        type: "Protected",
        description: "Gerar nota com IA",
        example: `const nota = await trpc.obsidianAi.generateNote.mutate({
  vaultId: 'vault-123',
  prompt: 'Criar nota sobre Machine Learning',
  template: 'technical'
});`
      }
    ]
  },
  {
    name: "WhatsApp",
    icon: <MessageSquare className="w-5 h-5" />,
    description: "Integração com WhatsApp Web e proteção",
    endpoints: [
      {
        name: "whatsapp-web.createSession",
        method: "POST",
        type: "Protected",
        description: "Criar sessão WhatsApp Web"
      },
      {
        name: "whatsapp-web.sendMessage",
        method: "POST",
        type: "Protected",
        description: "Enviar mensagem",
        example: `await trpc.whatsappWeb.sendMessage.mutate({
  sessionId: 'session-123',
  to: '5511999999999',
  message: 'Olá! Mensagem automática.'
});`
      },
      {
        name: "whatsapp-protection.isBlacklisted",
        method: "GET",
        type: "Protected",
        description: "Verificar se número está na blacklist"
      }
    ]
  },
  {
    name: "Multi-IA",
    icon: <Bot className="w-5 h-5" />,
    description: "Orquestração entre múltiplas IAs",
    endpoints: [
      {
        name: "multi-ai-orchestrator.execute",
        method: "POST",
        type: "Protected",
        description: "Executar tarefa com IA"
      },
      {
        name: "multi-ai-orchestrator.recommendAI",
        method: "POST",
        type: "Protected",
        description: "Recomendar IA para tarefa",
        example: `const recommendation = await trpc.multiAiOrchestrator.recommendAI.mutate({
  taskType: 'code_generation',
  complexity: 'high'
});`
      },
      {
        name: "orchestrator.submitTask",
        method: "POST",
        type: "Protected",
        description: "Submeter tarefa ao orquestrador"
      }
    ]
  },
  {
    name: "DeepSITE",
    icon: <Eye className="w-5 h-5" />,
    description: "Análise visual e clonagem de websites",
    endpoints: [
      {
        name: "deepsite.analisarVisao",
        method: "POST",
        type: "Protected",
        description: "Analisar interface visual"
      },
      {
        name: "deepsite.validarCodigo",
        method: "POST",
        type: "Protected",
        description: "Validar código gerado",
        example: `const validation = await trpc.deepsite.validarCodigo.mutate({
  originalUrl: 'https://example.com',
  generatedCode: htmlCode,
  compareVisually: true
});`
      }
    ]
  },
  {
    name: "Machine Learning",
    icon: <Zap className="w-5 h-5" />,
    description: "Predição e auto-healing",
    endpoints: [
      {
        name: "ml-prediction.train",
        method: "POST",
        type: "Protected",
        description: "Treinar modelo"
      },
      {
        name: "ml-prediction.predict",
        method: "POST",
        type: "Protected",
        description: "Fazer predição"
      },
      {
        name: "predictive-healing.analyzeAndHeal",
        method: "POST",
        type: "Protected",
        description: "Analisar e corrigir automaticamente"
      }
    ]
  },
  {
    name: "Telemetria",
    icon: <Activity className="w-5 h-5" />,
    description: "Métricas e monitoramento",
    endpoints: [
      {
        name: "telemetry.getMetrics",
        method: "GET",
        type: "Protected",
        description: "Obter métricas do sistema"
      },
      {
        name: "telemetry.getAnomalies",
        method: "GET",
        type: "Protected",
        description: "Detectar anomalias"
      },
      {
        name: "prometheus.metrics",
        method: "GET",
        type: "Public",
        description: "Métricas no formato Prometheus"
      }
    ]
  },
  {
    name: "Telefonia",
    icon: <Phone className="w-5 h-5" />,
    description: "Sistema de telefonia VoIP",
    endpoints: [
      {
        name: "telephony.getUseCaseTemplates",
        method: "GET",
        type: "Protected",
        description: "Templates de casos de uso"
      },
      {
        name: "telephony.testCall",
        method: "POST",
        type: "Protected",
        description: "Fazer chamada de teste"
      }
    ]
  },
  {
    name: "Webhooks",
    icon: <Webhook className="w-5 h-5" />,
    description: "Gerenciamento de webhooks",
    endpoints: [
      {
        name: "webhooks.create",
        method: "POST",
        type: "Protected",
        description: "Criar webhook"
      },
      {
        name: "webhooks.test",
        method: "POST",
        type: "Protected",
        description: "Testar webhook"
      }
    ]
  },
  {
    name: "Notificações",
    icon: <Bell className="w-5 h-5" />,
    description: "Sistema de notificações",
    endpoints: [
      {
        name: "notifications.list",
        method: "GET",
        type: "Protected",
        description: "Listar notificações"
      },
      {
        name: "notifications.markAsRead",
        method: "POST",
        type: "Protected",
        description: "Marcar como lida"
      }
    ]
  },
  {
    name: "Scheduler",
    icon: <Calendar className="w-5 h-5" />,
    description: "Agendamento de tarefas",
    endpoints: [
      {
        name: "scheduler.create",
        method: "POST",
        type: "Protected",
        description: "Criar agendamento"
      },
      {
        name: "scheduler.list",
        method: "GET",
        type: "Protected",
        description: "Listar agendamentos"
      }
    ]
  },
  {
    name: "Health",
    icon: <AlertTriangle className="w-5 h-5" />,
    description: "Verificação de saúde do sistema",
    endpoints: [
      {
        name: "health.check",
        method: "GET",
        type: "Public",
        description: "Verificação completa de saúde"
      },
      {
        name: "health.status",
        method: "GET",
        type: "Public",
        description: "Status do sistema"
      }
    ]
  }
];

export default function ApiDocs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredCategories = categories.map(category => ({
    ...category,
    endpoints: category.endpoints.filter(
      endpoint =>
        endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.endpoints.length > 0);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "POST":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "PUT":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "DELETE":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Public":
        return "bg-green-500/10 text-green-500";
      case "Protected":
        return "bg-yellow-500/10 text-yellow-500";
      case "Admin":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Documentação da API
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  294 endpoints em 40 módulos funcionais
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/DOCUMENTACAO_API_COMPLETA.md" target="_blank">
                  <FileText className="w-4 h-4 mr-2" />
                  Documentação Completa
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com/seu-usuario/servidor-automacao" target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="endpoints" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="endpoints">
              <Code className="w-4 h-4 mr-2" />
              Endpoints
            </TabsTrigger>
            <TabsTrigger value="quickstart">
              <Zap className="w-4 h-4 mr-2" />
              Quick Start
            </TabsTrigger>
            <TabsTrigger value="auth">
              <Shield className="w-4 h-4 mr-2" />
              Autenticação
            </TabsTrigger>
            <TabsTrigger value="deploy">
              <Server className="w-4 h-4 mr-2" />
              Deploy
            </TabsTrigger>
          </TabsList>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar endpoints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <div className="grid gap-6">
              {filteredCategories.map((category) => (
                <Card key={category.name}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle>{category.name}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.endpoints.map((endpoint) => (
                        <div
                          key={endpoint.name}
                          className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`${getMethodColor(endpoint.method)} font-mono`}
                                >
                                  {endpoint.method}
                                </Badge>
                                <code className="text-sm font-mono text-gray-900 dark:text-white">
                                  {endpoint.name}
                                </code>
                                <Badge className={getTypeColor(endpoint.type)}>
                                  {endpoint.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {endpoint.description}
                              </p>
                              {endpoint.example && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                      Exemplo de uso:
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(endpoint.example!, endpoint.name)
                                      }
                                    >
                                      {copiedCode === endpoint.name ? (
                                        <Check className="w-4 h-4" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                  <pre className="p-3 bg-gray-900 dark:bg-gray-950 rounded-lg overflow-x-auto">
                                    <code className="text-sm text-gray-100">
                                      {endpoint.example}
                                    </code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Quick Start Tab */}
          <TabsContent value="quickstart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>
                  Comece a usar a API em minutos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">1. Instalar Cliente tRPC</h3>
                  <pre className="p-4 bg-gray-900 dark:bg-gray-950 rounded-lg overflow-x-auto">
                    <code className="text-sm text-gray-100">
                      npm install @trpc/client @trpc/react-query
                    </code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">2. Configurar Cliente</h3>
                  <pre className="p-4 bg-gray-900 dark:bg-gray-950 rounded-lg overflow-x-auto">
                    <code className="text-sm text-gray-100">
{`import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const client = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: 'https://seu-servidor.com/api/trpc',
      headers: {
        'x-api-key': 'sua-api-key-aqui',
      },
    }),
  ],
});`}
                    </code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">3. Fazer Primeira Requisição</h3>
                  <pre className="p-4 bg-gray-900 dark:bg-gray-950 rounded-lg overflow-x-auto">
                    <code className="text-sm text-gray-100">
{`// Verificar status do sistema
const status = await client.health.check.query();
console.log('Sistema:', status.status);

// Listar servidores
const servidores = await client.servidor.listarServidores.query();
console.log('Servidores:', servidores);`}
                    </code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authentication Tab */}
          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Autenticação</CardTitle>
                <CardDescription>
                  Sistema de API keys para autenticação segura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Gerar API Key</h3>
                  <pre className="p-4 bg-gray-900 dark:bg-gray-950 rounded-lg overflow-x-auto">
                    <code className="text-sm text-gray-100">
{`const response = await fetch('https://seu-servidor.com/api/trpc/auth.generateKey', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Minha Aplicação',
    permissions: ['read', 'write']
  })
});

const { apiKey } = await response.json();`}
                    </code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Usar API Key</h3>
                  <pre className="p-4 bg-gray-900 dark:bg-gray-950 rounded-lg overflow-x-auto">
                    <code className="text-sm text-gray-100">
{`const response = await fetch('https://seu-servidor.com/api/trpc/servidor.listarServidores', {
  method: 'GET',
  headers: {
    'x-api-key': 'sua-api-key-aqui',
    'Content-Type': 'application/json',
  }
});`}
                    </code>
                  </pre>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                        Importante
                      </h4>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Nunca exponha suas API keys no código frontend ou em repositórios públicos.
                        Sempre use variáveis de ambiente.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deploy Tab */}
          <TabsContent value="deploy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deploy e Configuração</CardTitle>
                <CardDescription>
                  Instruções para deploy em produção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Requisitos do Sistema</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Componente</th>
                          <th className="text-left py-2">Mínimo</th>
                          <th className="text-left py-2">Recomendado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2">Node.js</td>
                          <td className="py-2">18.x</td>
                          <td className="py-2">20.x</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">RAM</td>
                          <td className="py-2">2 GB</td>
                          <td className="py-2">4 GB</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">CPU</td>
                          <td className="py-2">2 cores</td>
                          <td className="py-2">4 cores</td>
                        </tr>
                        <tr>
                          <td className="py-2">Banco de Dados</td>
                          <td className="py-2">MySQL 8.0+</td>
                          <td className="py-2">MySQL 8.0+</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Instalação</h3>
                  <pre className="p-4 bg-gray-900 dark:bg-gray-950 rounded-lg overflow-x-auto">
                    <code className="text-sm text-gray-100">
{`# 1. Clonar repositório
git clone https://github.com/seu-usuario/servidor-automacao.git
cd servidor-automacao

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# 4. Executar migrations
pnpm db:push

# 5. Popular banco com dados iniciais
pnpm db:seed

# 6. Build
pnpm build

# 7. Iniciar servidor
pnpm start`}
                    </code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Deploy com Docker</h3>
                  <pre className="p-4 bg-gray-900 dark:bg-gray-950 rounded-lg overflow-x-auto">
                    <code className="text-sm text-gray-100">
{`# Iniciar com Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f servidor-automacao

# Parar
docker-compose down`}
                    </code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Variáveis de Ambiente Principais</h3>
                  <div className="space-y-2 text-sm">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <code className="text-blue-600 dark:text-blue-400">DATABASE_URL</code>
                      <span className="text-gray-600 dark:text-gray-400"> - String de conexão MySQL</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <code className="text-blue-600 dark:text-blue-400">JWT_SECRET</code>
                      <span className="text-gray-600 dark:text-gray-400"> - Secret para JWT</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <code className="text-blue-600 dark:text-blue-400">BUILT_IN_FORGE_API_KEY</code>
                      <span className="text-gray-600 dark:text-gray-400"> - API key Manus</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <code className="text-blue-600 dark:text-blue-400">PERPLEXITY_API_KEY</code>
                      <span className="text-gray-600 dark:text-gray-400"> - API key Perplexity</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
