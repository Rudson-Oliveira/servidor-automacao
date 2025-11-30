import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  MessageSquare,
  FileText,
  Monitor,
  Globe,
  Settings,
  Shield,
  Activity,
  Send,
  FileCode,
  Calendar,
  Users,
  Link as LinkIcon,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { APP_TITLE, APP_LOGO } from '@/const';
import MobileMenu from '@/components/MobileMenu';

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

interface HeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function Header({ showBackButton = false, onBack }: HeaderProps) {
  const [location] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo e Título */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
          <a href="/" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
            <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />
            <span className="hidden sm:inline-block">{APP_TITLE}</span>
          </a>
        </div>

        {/* Menu de Navegação */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {/* WhatsApp */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-2">
                {menuCategories.whatsapp.icon}
                {menuCategories.whatsapp.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  {menuCategories.whatsapp.items.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink
                        href={item.href}
                        className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                          location === item.href ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-medium leading-none">
                          {item.icon}
                          {item.title}
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {item.description}
                        </p>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Obsidian */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-2">
                {menuCategories.obsidian.icon}
                {menuCategories.obsidian.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-3 p-4">
                  {menuCategories.obsidian.items.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink
                        href={item.href}
                        className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                          location === item.href ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-medium leading-none">
                          {item.icon}
                          {item.title}
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {item.description}
                        </p>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Desktop */}
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/desktop/capture"
                className={`group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 gap-2 ${
                  location === '/desktop/capture' ? 'bg-accent' : ''
                }`}
              >
                {menuCategories.desktop.icon}
                {menuCategories.desktop.title}
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* DeepSite */}
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/deepsite"
                className={`group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 gap-2 ${
                  location === '/deepsite' ? 'bg-accent' : ''
                }`}
              >
                {menuCategories.deepsite.icon}
                {menuCategories.deepsite.title}
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Instalar */}
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/download"
                className={`group inline-flex h-10 w-max items-center justify-center rounded-md bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm font-bold transition-colors focus:outline-none gap-2 ${
                  location === '/download' ? 'bg-green-600' : ''
                }`}
              >
                <Download className="h-5 w-5" />
                💾 INSTALAR
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Sistema */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-2">
                {menuCategories.system.icon}
                {menuCategories.system.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-3 p-4">
                  {menuCategories.system.items.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink
                        href={item.href}
                        className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                          location === item.href ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm font-medium leading-none">
                          {item.icon}
                          {item.title}
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {item.description}
                        </p>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Menu Mobile */}
        <MobileMenu />
      </div>
    </header>
  );
}
