import { Link } from 'wouter';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  FileText,
  Monitor,
  Globe,
  Shield,
  Activity,
  Send,
  FileCode,
  Calendar,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    category: 'WhatsApp Anti-Bloqueio',
    icon: <MessageSquare className="h-8 w-8" />,
    description:
      'Sistema completo de envio em massa com proteção inteligente contra bloqueios, templates dinâmicos e agendamento de campanhas.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: [
      'Envio em massa com anti-bloqueio dinâmico',
      'Templates com variáveis personalizáveis',
      'Agendamento de campanhas automático',
      'Monitoramento de bloqueios em tempo real',
      'Múltiplas sessões WhatsApp Web',
    ],
    links: [
      { title: 'Enviar Mensagens', href: '/whatsapp/send', icon: <Send className="h-4 w-4" /> },
      { title: 'Templates', href: '/whatsapp/templates', icon: <FileCode className="h-4 w-4" /> },
      { title: 'Campanhas', href: '/whatsapp/campaigns', icon: <Calendar className="h-4 w-4" /> },
    ],
  },
  {
    category: 'Agentes Locais (Vercept)',
    icon: <Monitor className="h-8 w-8" />,
    description:
      'Controle remoto de aplicações locais. Execute comandos, gerencie arquivos e automatize tarefas no seu computador de qualquer lugar.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: [
      'Execução remota de comandos',
      'Integração com Obsidian e VSCode',
      'Reconexão automática',
      'Múltiplos agentes simultâneos',
      'Histórico completo de execuções',
    ],
    links: [{ title: 'Gerenciar Agentes', href: '/agentes-locais', icon: <Monitor className="h-4 w-4" /> }],
  },
  {
    category: 'Integração Obsidian',
    icon: <FileText className="h-8 w-8" />,
    description:
      'Automatize a criação de catálogos de links no Obsidian através de URI schemes, scripts Python locais e plugin customizado.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: [
      'Geração de URIs do Obsidian',
      'Scripts Python para automação local',
      'Plugin Obsidian customizado',
      'Sincronização bidirecional',
    ],
    links: [{ title: 'Catalogar Links', href: '/obsidian/catalogar', icon: <FileText className="h-4 w-4" /> }],
  },
  {
    category: 'Captura de Desktop',
    icon: <Monitor className="h-8 w-8" />,
    description:
      'Capture e analise telas do desktop automaticamente, detectando programas, janelas e conteúdo visual.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: [
      'Captura automática de tela',
      'Detecção de programas ativos',
      'Análise de janelas',
      'OCR e extração de texto',
    ],
    links: [{ title: 'Capturar Tela', href: '/desktop/capture', icon: <Monitor className="h-4 w-4" /> }],
  },
  {
    category: 'DeepSite Analysis',
    icon: <Globe className="h-8 w-8" />,
    description: 'Análise profunda de sites com extração de dados, mapeamento de estrutura e scraping inteligente.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    features: [
      'Scraping inteligente de sites',
      'Extração de dados estruturados',
      'Mapeamento de estrutura',
      'Análise de conteúdo',
    ],
    links: [{ title: 'Analisar Site', href: '/deepsite', icon: <Globe className="h-4 w-4" /> }],
  },
  {
    category: 'Sistema de Auto-Healing',
    icon: <Shield className="h-8 w-8" />,
    description:
      'Monitoramento contínuo com correção automática de problemas, health checks e reinicialização inteligente de serviços.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    features: [
      'Detecção automática de problemas',
      'Correção proativa de erros',
      'Health checks a cada 30s',
      'Reinicialização inteligente',
      'Retry com backoff exponencial',
    ],
    links: [
      { title: 'Auto-Healing', href: '/auto-healing', icon: <Activity className="h-4 w-4" /> },
      { title: 'Health Checks', href: '/health', icon: <Shield className="h-4 w-4" /> },
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Servidor de Automação - Sistema de Comunicação
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Plataforma completa de automação com WhatsApp anti-bloqueio, integração Obsidian, captura de desktop,
            análise de sites e auto-healing inteligente.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {features.map((feature, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className={`${feature.bgColor} pb-4`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={feature.color}>{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.category}</CardTitle>
                </div>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Features List */}
                <ul className="space-y-2 mb-6">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${feature.color}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Links */}
                <div className="flex flex-wrap gap-2">
                  {feature.links.map((link, idx) => (
                    <Link key={idx} href={link.href}>
                      <Button variant="outline" size="sm" className="gap-2">
                        {link.icon}
                        {link.title}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">15+</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Integrações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8+</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">APIs Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">65+</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-lg font-semibold">Online</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
