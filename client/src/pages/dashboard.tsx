import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  FileDown,
  MessageSquare,
  CalendarClock,
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
  TrendingUp,
  LifeBuoy,
  Library,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import { DashboardCalendar } from "@/components/dashboard-calendar";

interface SessionSchedule {
  id: number;
  title: string;
  scheduledAt: string;
  notes: string | null;
  prepChecklist: string | null;
  status: string;
}

interface DashboardData {
  user: { id: number; name: string; brandName: string; email: string; role: string };
  project: { id: number; name: string; serviceType: string; status: string; startDate: string; endDate: string } | null;
  milestones: Array<{
    id: number;
    sessionNumber: number;
    title: string;
    description: string;
    hours: number;
    cost: number;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    subMilestones: Array<{ id: number; title: string; status: string; order: number }>;
    deliverables: Array<{ id: number; title: string; fileUrl: string | null; uploadedAt: string | null }>;
  }>;
  recentMessages: Array<{
    id: number;
    senderName: string;
    senderRole: string;
    content: string;
    createdAt: string;
  }>;
  overallProgress: number;
  unreadNotifications: number;
  openTickets: number;
  nextSession: SessionSchedule | null;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  if (status === "in_progress") return <Clock className="w-4 h-4 text-primary" />;
  return <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    in_progress: "bg-primary/10 text-primary",
    not_started: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    completed: "Complete",
    in_progress: "In Progress",
    not_started: "Upcoming",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[status] || variants.not_started}`}>
      {labels[status] || status}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;

  const currentMilestone = data.milestones.find((m) => m.status === "in_progress");
  const completedCount = data.milestones.filter((m) => m.status === "completed").length;
  const totalDeliverables = data.milestones.reduce((sum, m) => sum + m.deliverables.length, 0);

  // Parse prep checklist for next session
  let prepItems: string[] = [];
  if (data.nextSession?.prepChecklist) {
    try { prepItems = JSON.parse(data.nextSession.prepChecklist); } catch {}
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" data-testid="dashboard-page">
      {/* Welcome */}
      <div className="mb-2">
        <h1 className="font-display text-xl font-semibold text-foreground" data-testid="text-welcome">
          Welcome back, {data.user.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data.project?.name} — {data.project?.serviceType}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall Progress</span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground" data-testid="text-overall-progress">
              {data.overallProgress}%
            </p>
            <Progress value={data.overallProgress} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sessions</span>
              <Target className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{completedCount}/4</p>
            <p className="text-xs text-muted-foreground mt-1">Sessions completed</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deliverables</span>
              <FileDown className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalDeliverables}</p>
            <p className="text-xs text-muted-foreground mt-1">Files available</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open Tickets</span>
              <LifeBuoy className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{data.openTickets}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.unreadNotifications > 0 ? `${data.unreadNotifications} unread notification${data.unreadNotifications > 1 ? "s" : ""}` : "All caught up"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current session highlight + Next Session */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current Session */}
        <Card className="lg:col-span-2 border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">Current Session</CardTitle>
              <StatusBadge status="in_progress" />
            </div>
          </CardHeader>
          <CardContent>
            {currentMilestone ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    Session {currentMilestone.sessionNumber}: {currentMilestone.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {currentMilestone.description}
                  </p>
                </div>

                {/* Sub-milestones progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {currentMilestone.subMilestones.filter((s) => s.status === "completed").length} of{" "}
                      {currentMilestone.subMilestones.length} steps complete
                    </span>
                    <span className="font-medium text-primary">
                      {Math.round(
                        (currentMilestone.subMilestones.filter((s) => s.status === "completed").length /
                          currentMilestone.subMilestones.length) *
                          100
                      )}%
                    </span>
                  </div>
                  <Progress
                    value={
                      (currentMilestone.subMilestones.filter((s) => s.status === "completed").length /
                        currentMilestone.subMilestones.length) *
                      100
                    }
                    className="h-2"
                  />
                </div>

                {/* Sub-milestone list */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {currentMilestone.subMilestones.map((sub) => (
                    <div
                      key={sub.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${
                        sub.status === "completed"
                          ? "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400"
                          : sub.status === "in_progress"
                          ? "bg-primary/5 text-primary border border-primary/20"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <StatusIcon status={sub.status} />
                      <span className="truncate">Wk {sub.order}</span>
                    </div>
                  ))}
                </div>

                <Link href="/milestones">
                  <Button variant="outline" size="sm" className="mt-2" data-testid="button-view-milestones">
                    View Full Timeline
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No active session at this time.</p>
            )}
          </CardContent>
        </Card>

        {/* Next Session + Quick Actions */}
        <div className="space-y-4">
          {/* Next Session Card */}
          {data.nextSession && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">Next Session</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{data.nextSession.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {format(parseISO(data.nextSession.scheduledAt), "EEEE, MMMM d 'at' h:mm a")}
                  </p>
                </div>

                {prepItems.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" />
                      Prep Checklist
                    </p>
                    <div className="space-y-1">
                      {prepItems.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Circle className="w-2 h-2 mt-1 flex-shrink-0 text-muted-foreground/40" />
                          <span>{item}</span>
                        </div>
                      ))}
                      {prepItems.length > 3 && (
                        <p className="text-xs text-muted-foreground/60 pl-4">
                          +{prepItems.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Link href="/support">
                  <Button variant="outline" size="sm" className="w-full text-xs" data-testid="button-reschedule">
                    <CalendarClock className="w-3 h-3 mr-1" />
                    Request Reschedule
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/deliverables">
                <Button variant="outline" className="w-full justify-start gap-3 h-9 text-sm" data-testid="link-deliverables">
                  <FileDown className="w-4 h-4 text-primary" />
                  View Deliverables
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="outline" className="w-full justify-start gap-3 h-9 text-sm" data-testid="link-messages">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Messages
                </Button>
              </Link>
              <Link href="/support">
                <Button variant="outline" className="w-full justify-start gap-3 h-9 text-sm" data-testid="link-support">
                  <LifeBuoy className="w-4 h-4 text-primary" />
                  Support
                </Button>
              </Link>
              <Link href="/resources">
                <Button variant="outline" className="w-full justify-start gap-3 h-9 text-sm" data-testid="link-resources">
                  <Library className="w-4 h-4 text-primary" />
                  Resources
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Calendar + Recent Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Calendar */}
        <DashboardCalendar isAdmin={false} />

        {/* Recent Messages */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">Recent Updates</CardTitle>
              <Link href="/messages">
                <Button variant="ghost" size="sm" className="text-xs text-primary" data-testid="link-all-messages">
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentMessages.slice(0, 3).map((msg) => (
                <div key={msg.id} className="flex gap-3" data-testid={`message-${msg.id}`}>
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-secondary-foreground">
                      {msg.senderName.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-foreground">{msg.senderName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(msg.createdAt), "MMM d")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
