import { useLocation } from 'wouter';
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface BreadcrumbSegment {
  label: string;
  href: string;
}

// Mapeamento de rotas para labels legíveis
const routeLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  send: 'Envio em Massa',
  templates: 'Templates',
  campaigns: 'Campanhas',
  sessions: 'Sessões',
  blocked: 'Bloqueios',
  obsidian: 'Obsidian',
  catalogar: 'Catalogar Links',
  desktop: 'Desktop',
  capture: 'Captura de Tela',
  deepsite: 'DeepSite',
  'auto-healing': 'Auto-Healing',
  health: 'Health Checks',
  'configurar-ias': 'Configurar IAs',
};

function generateBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  // Remover trailing slash e split
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbSegment[] = [];
  let currentPath = '';

  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    breadcrumbs.push({
      label,
      href: currentPath,
    });
  });

  return breadcrumbs;
}

export default function Breadcrumb() {
  const [location] = useLocation();

  // Não mostrar breadcrumb na home
  if (location === '/') {
    return null;
  }

  const breadcrumbs = generateBreadcrumbs(location);

  return (
    <BreadcrumbRoot className="mb-4">
      <BreadcrumbList>
        {/* Home */}
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <div key={crumb.href} className="flex items-center gap-2">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}
