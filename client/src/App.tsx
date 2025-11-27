import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import WhatsAppDashboard from "@/pages/WhatsAppDashboard";
import WhatsAppBlocked from "@/pages/WhatsAppBlocked";
import WhatsAppSessions from "@/pages/WhatsAppSessions";
import DashboardVision from "@/pages/DashboardVision";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import WhatsAppSend from "./pages/WhatsAppSend";
import WhatsAppTemplates from "./pages/WhatsAppTemplates";
import WhatsAppCampaigns from "./pages/WhatsAppCampaigns";
import ConfiguracoesIAs from "./pages/ConfiguracoesIAs";
import DesktopCaptures from "./pages/DesktopCaptures";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import ObsidianCatalog from "./pages/ObsidianCatalog";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/whatsapp/send"} component={WhatsAppSend} />
      <Route path={"/whatsapp/templates"} component={WhatsAppTemplates} />
      <Route path={"/whatsapp/campaigns"} component={WhatsAppCampaigns} />
      <Route path={"/whatsapp"} component={WhatsAppDashboard} />
      <Route path={"/whatsapp/blocked"} component={WhatsAppBlocked} />
      <Route path={"/whatsapp/sessions"} component={WhatsAppSessions} />
      <Route path="/dashboard-vision" component={DashboardVision} />
      <Route path="/configuracoes/ias" component={ConfiguracoesIAs} />
      <Route path="/desktop-captures" component={DesktopCaptures} />
      <Route path={"/cadastro"} component={Cadastro} />
      <Route path={"/login"} component={Login} />
      <Route path={"/obsidian/catalogar"} component={ObsidianCatalog} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
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
