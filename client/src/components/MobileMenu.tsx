import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  MessageSquare,
  FileText,
  Monitor,
  Globe,
  Settings,
  Send,
  FileCode,
  Calendar,
  Users,
  Shield,
  Activity,
  Link as LinkIcon,
  Menu,
  Download,
} from 'lucide-react';

interface MenuItem {
  title: string;
  href: string;
  description: string;
  icon: React.ReactNode;
}

const menuCategories = {
  whatsapp: {
    title: 'WhatsApp',
    icon: <MessageSquare className="h-5 w-5" />,
    items: [
      {
        title: 'Envio em Massa',
        href: '/whatsapp/send',
        description: 'Enviar mensagens em massa com anti-bloqueio',
        icon: <Send className="h-4 w-4" />,
      },
      {
        title: 'Templates',
        href: '/whatsapp/templates',
        description: 'Gerenciar templates de mensagens',
        icon: <FileCode className="h-4 w-4" />,
      },
      {
        title: 'Campanhas',
        href: '/whatsapp/campaigns',
        description: 'Agendar e gerenciar campanhas',
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        title: 'Sessões WhatsApp',
        href: '/whatsapp/sessions',
        description: 'Gerenciar conexões WhatsApp Web',
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: 'Bloqueios',
        href: '/whatsapp/blocked',
        description: 'Monitorar números bloqueados',
        icon: <Shield className="h-4 w-4" />,
      },
      {
        title: 'Dashboard',
        href: '/whatsapp',
        description: 'Visão geral do sistema WhatsApp',
        icon: <Activity className="h-4 w-4" />,
      },
    ] as MenuItem[],
  },
  obsidian: {
    title: 'Obsidian',
    icon: <FileText className="h-5 w-5" />,
    items: [
      {
        title: 'Catalogar Links',
        href: '/obsidian/catalogar',
        description: 'Criar catálogos de links no Obsidian',
        icon: <LinkIcon className="h-4 w-4" />,
      },
    ] as MenuItem[],
  },
  desktop: {
    title: 'Desktop',
    icon: <Monitor className="h-5 w-5" />,
    items: [
      {
        title: 'Captura de Tela',
        href: '/desktop/capture',
        description: 'Capturar e analisar telas do desktop',
        icon: <Monitor className="h-4 w-4" />,
      },
    ] as MenuItem[],
  },
  deepsite: {
    title: 'DeepSite',
    icon: <Globe className="h-5 w-5" />,
    items: [
      {
        title: 'Análise de Sites',
        href: '/deepsite',
        description: 'Analisar e extrair dados de sites',
        icon: <Globe className="h-4 w-4" />,
      },
    ] as MenuItem[],
  },
  system: {
    title: 'Sistema',
    icon: <Settings className="h-5 w-5" />,
    items: [
      {
        title: 'Auto-Healing',
        href: '/auto-healing',
        description: 'Monitoramento e correção automática',
        icon: <Activity className="h-4 w-4" />,
      },
      {
        title: 'Health Checks',
        href: '/health',
        description: 'Status de saúde do sistema',
        icon: <Shield className="h-4 w-4" />,
      },
      {
        title: 'Configurar IAs',
        href: '/configurar-ias',
        description: 'Configurar integrações de IA',
        icon: <Settings className="h-4 w-4" />,
      },
    ] as MenuItem[],
  },
};

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const handleNavigate = (href: string) => {
    setLocation(href);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu de Navegação</SheetTitle>
          <SheetDescription>
            Acesse todas as funcionalidades do sistema
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Botão de Instalar em Destaque */}
          <Button
            onClick={() => handleNavigate('/download')}
            className="w-full h-14 bg-green-500 hover:bg-green-600 text-white text-lg font-bold gap-2"
          >
            <Download className="h-6 w-6" />
            💾 INSTALAR COMETA IA
          </Button>

          <Accordion type="single" collapsible className="w-full">
            {/* WhatsApp */}
            <AccordionItem value="whatsapp">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  {menuCategories.whatsapp.icon}
                  {menuCategories.whatsapp.title}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-7">
                  {menuCategories.whatsapp.items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className={`w-full text-left p-3 rounded-md transition-colors hover:bg-accent ${
                        location === item.href ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        {item.icon}
                        {item.title}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Obsidian */}
            <AccordionItem value="obsidian">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  {menuCategories.obsidian.icon}
                  {menuCategories.obsidian.title}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-7">
                  {menuCategories.obsidian.items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className={`w-full text-left p-3 rounded-md transition-colors hover:bg-accent ${
                        location === item.href ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        {item.icon}
                        {item.title}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Desktop */}
            <AccordionItem value="desktop">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  {menuCategories.desktop.icon}
                  {menuCategories.desktop.title}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-7">
                  {menuCategories.desktop.items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className={`w-full text-left p-3 rounded-md transition-colors hover:bg-accent ${
                        location === item.href ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        {item.icon}
                        {item.title}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* DeepSite */}
            <AccordionItem value="deepsite">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  {menuCategories.deepsite.icon}
                  {menuCategories.deepsite.title}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-7">
                  {menuCategories.deepsite.items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className={`w-full text-left p-3 rounded-md transition-colors hover:bg-accent ${
                        location === item.href ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        {item.icon}
                        {item.title}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Sistema */}
            <AccordionItem value="system">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  {menuCategories.system.icon}
                  {menuCategories.system.title}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-7">
                  {menuCategories.system.items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className={`w-full text-left p-3 rounded-md transition-colors hover:bg-accent ${
                        location === item.href ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        {item.icon}
                        {item.title}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
