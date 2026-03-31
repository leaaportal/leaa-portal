import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
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
import DesignBoardPage from "@/pages/design-board";
import SourcingPage from "@/pages/sourcing";
import DocumentsPage from "@/pages/documents";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/app-layout";
import OnboardingPage from "@/pages/onboarding";

// Admin pages
import AdminDashboard from "@/pages/admin-dashboard";
import AdminClients from "@/pages/admin-clients";
import AdminClientDetail from "@/pages/admin-client-detail";
import AdminProjects from "@/pages/admin-projects";
import AdminTickets from "@/pages/admin-tickets";
import AdminMessages from "@/pages/admin-messages";
import AdminDeliverables from "@/pages/admin-deliverables";
import AdminDesignPage from "@/pages/admin-design";
import AdminSourcingPage from "@/pages/admin-sourcing";
import AdminDocumentsPage from "@/pages/admin-documents";
import AdminApprovalsPage from "@/pages/admin-approvals";
import AdminHoursPage from "@/pages/admin-hours";
import AdminTasksPage from "@/pages/admin-tasks";
import AdminNotificationsPage from "@/pages/admin-notifications";

function ClientApp() {
  // Check if this client has completed onboarding
  const { data: onboardingStatus, isLoading: onboardingLoading } = useQuery<any>({
    queryKey: ["/api/onboarding/status"],
    queryFn: async () => {
      const res = await fetch("./api/onboarding/status");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  if (onboardingLoading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F4EF" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 32, height: 32, border: "2px solid #D9C9B6", borderTopColor: "#B7542E", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <p style={{ color: "#8A8C93", fontSize: 14, fontFamily: "Nunito, sans-serif" }}>Preparing your portal...</p>
        </div>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  // If onboarding not completed, redirect to /onboarding
  const onboardingComplete = onboardingStatus && onboardingStatus.completedAt !== null;

  if (!onboardingComplete) {
    return (
      <Switch>
        <Route path="/onboarding" component={OnboardingPage} />
        <Route>
          <Redirect to="/onboarding" />
        </Route>
      </Switch>
    );
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/milestones" component={MilestonesPage} />
        <Route path="/deliverables" component={DeliverablesPage} />
        <Route path="/design-board" component={DesignBoardPage} />
        <Route path="/sourcing" component={SourcingPage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/support" component={SupportPage} />
        <Route path="/resources" component={ResourcesPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/onboarding">
          <Redirect to="/" />
        </Route>
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
        <Route path="/admin/design" component={AdminDesignPage} />
        <Route path="/admin/sourcing" component={AdminSourcingPage} />
        <Route path="/admin/documents" component={AdminDocumentsPage} />
        <Route path="/admin/approvals" component={AdminApprovalsPage} />
        <Route path="/admin/hours" component={AdminHoursPage} />
        <Route path="/admin/tasks" component={AdminTasksPage} />
        <Route path="/admin/notifications" component={AdminNotificationsPage} />
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

