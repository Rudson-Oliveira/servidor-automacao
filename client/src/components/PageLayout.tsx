import Header from './Header';

interface PageLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
  description?: string;
}

export default function PageLayout({ children, showBackButton = true, title, description }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton={showBackButton} />
      <main className="container py-8">
        {(title || description) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>}
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
