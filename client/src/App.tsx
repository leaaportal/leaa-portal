import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import MilestonesPage from "@/pages/milestones";
import DeliverablesPage from "@/pages/deliverables";
import MessagesPage from "@/pages/messages";
import SupportPage from "@/pages/support";
import ResourcesPage from "@/pages/resources";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/app-layout";

// Admin pages
import AdminDashboard from "@/pages/admin-dashboard";
import AdminClients from "@/pages/admin-clients";
import AdminClientDetail from "@/pages/admin-client-detail";
import AdminProjects from "@/pages/admin-projects";
import AdminTickets from "@/pages/admin-tickets";
import AdminMessages from "@/pages/admin-messages";
import AdminDeliverables from "@/pages/admin-deliverables";

function ClientApp() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/milestones" component={MilestonesPage} />
        <Route path="/deliverables" component={DeliverablesPage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/support" component={SupportPage} />
        <Route path="/resources" component={ResourcesPage} />
        <Route path="/profile" component={ProfilePage} />
        {/* Redirect admin paths to client dashboard if client is logged in */}
        <Route path="/admin">
          <Redirect to="/" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function AdminApp() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/clients" component={AdminClients} />
        <Route path="/admin/clients/:id" component={AdminClientDetail} />
        <Route path="/admin/projects" component={AdminProjects} />
        <Route path="/admin/tickets" component={AdminTickets} />
        <Route path="/admin/messages" component={AdminMessages} />
        <Route path="/admin/deliverables" component={AdminDeliverables} />
        {/* Redirect root to admin dashboard */}
        <Route path="/">
          <Redirect to="/admin" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === "admin") {
    return <AdminApp />;
  }

  return <ClientApp />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router hook={useHashLocation}>
            <AppContent />
          </Router>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

