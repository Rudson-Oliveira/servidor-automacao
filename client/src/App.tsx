import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorBoundaryAdvanced from "./components/ErrorBoundaryAdvanced";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import InstallPortal from "./pages/InstallPortal";
import ControlCenter from "./pages/ControlCenter";
import AIGovernance from "./pages/AIGovernance";

// Lazy load pages for better performance
const NotFound = lazy(() => import("@/pages/NotFound"));
const WhatsAppDashboard = lazy(() => import("@/pages/WhatsAppDashboard"));
const WhatsAppBlocked = lazy(() => import("@/pages/WhatsAppBlocked"));
const WhatsAppSessions = lazy(() => import("@/pages/WhatsAppSessions"));
const DashboardVision = lazy(() => import("@/pages/DashboardVision"));
const WhatsAppSend = lazy(() => import("./pages/WhatsAppSend"));
const WhatsAppTemplates = lazy(() => import("./pages/WhatsAppTemplates"));
const WhatsAppCampaigns = lazy(() => import("./pages/WhatsAppCampaigns"));
const ConfiguracoesIAs = lazy(() => import("./pages/ConfiguracoesIAs"));
const DesktopCaptures = lazy(() => import("./pages/DesktopCaptures"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const Login = lazy(() => import("./pages/Login"));
const ObsidianCatalog = lazy(() => import("./pages/ObsidianCatalog"));
const ObsidianVaults = lazy(() => import("./pages/ObsidianVaults"));
const ObsidianVaultNotes = lazy(() => import("./pages/ObsidianVaultNotes"));
const ObsidianGraph = lazy(() => import("./pages/ObsidianGraph"));
const VyLikeCapture = lazy(() => import("./pages/VyLikeCapture"));
const TelemetryDashboard = lazy(() => import("./pages/TelemetryDashboard"));
const PerformanceDashboard = lazy(() => import("./pages/PerformanceDashboard"));
const DesktopControl = lazy(() => import("./pages/DesktopControl"));
const DesktopSecurity = lazy(() => import("./pages/DesktopSecurity"));
const DesktopHistory = lazy(() => import("./pages/DesktopHistory"));
const DesktopScheduler = lazy(() => import("./pages/DesktopScheduler"));
const DesktopControlPro = lazy(() => import("./pages/DesktopControlPro"));
const CacheStats = lazy(() => import("./pages/CacheStats"));
const OrchestratorDashboard = lazy(() => import("./pages/OrchestratorDashboard"));
const InstalarDesktopAgent = lazy(() => import("./pages/InstalarDesktopAgent"));
const AgentVersionsDashboard = lazy(() => import("./pages/AgentVersionsDashboard"));
const MLTraining = lazy(() => import("./pages/MLTraining"));
const AlertsConfig = lazy(() => import("./pages/AlertsConfig"));
const MLDashboard = lazy(() => import("./pages/MLDashboard"));
const SelfAwareness = lazy(() => import("./pages/SelfAwareness"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
       <Route path={"/"} component={Home} />
      <Route path="/install" component={InstallPortal} />
      <Route path="/instalar-agent" component={InstalarDesktopAgent} />
      <Route path="/agent-versions" component={AgentVersionsDashboard} />
      <Route path="/control" component={ControlCenter} />
      <Route path="/ai-governance" component={AIGovernance} />
      <Route path={"/404"} component={NotFound} />
        <Route path={"/orchestrator"} component={OrchestratorDashboard} />
        <Route path={"/whatsapp/send"} component={WhatsAppSend} />
        <Route path={"/whatsapp/templates"} component={WhatsAppTemplates} />
        <Route path={"/whatsapp/campaigns"} component={WhatsAppCampaigns} />
        <Route path={"/whatsapp"} component={WhatsAppDashboard} />
        <Route path={"/whatsapp/blocked"} component={WhatsAppBlocked} />
        <Route path={"/whatsapp/sessions"} component={WhatsAppSessions} />
        <Route path="/dashboard-vision" component={DashboardVision} />
        <Route path="/configuracoes/ias" component={ConfiguracoesIAs} />
        <Route path="/desktop-captures" component={DesktopCaptures} />
        <Route path={"/desktop"} component={DesktopControl} />
        <Route path={"/desktop/pro"} component={DesktopControlPro} />
        <Route path="/desktop/security" component={DesktopSecurity} />
        <Route path="/desktop/history" component={DesktopHistory} />
        <Route path="/desktop/scheduler" component={DesktopScheduler} />
        <Route path="/notifications" component={NotificationSettings} />
          <Route path="/desktop/vy-capture" component={VyLikeCapture} />
          <Route path="/telemetry" component={TelemetryDashboard} />
        <Route path="/performance" component={PerformanceDashboard} />
        <Route path="/ml-training" component={MLTraining} />
        <Route path="/alerts-config" component={AlertsConfig} />
        <Route path="/ml-dashboard" component={MLDashboard} />
        <Route path="/self-awareness" component={SelfAwareness} />
        <Route path="/cache" component={CacheStats} />
        <Route path={"/cadastro"} component={Cadastro} />
        <Route path={"/login"} component={Login} />
        <Route path={"/obsidian/catalogar"} component={ObsidianCatalog} />
        <Route path={"/obsidian/graph"} component={ObsidianGraph} />
        <Route path={"/obsidian/vault/:id"} component={ObsidianVaultNotes} />
        <Route path={"/obsidian/vaults"} component={ObsidianVaults} />
        <Route path={"/obsidian"} component={ObsidianVaults} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
