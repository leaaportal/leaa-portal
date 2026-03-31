import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  AlertTriangle,
  CheckSquare,
  FileText,
  Users,
  DollarSign,
  Ticket,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import { Link } from "wouter";
import { DashboardCalendar } from "@/components/dashboard-calendar";

function ActionCard({
  title,
  count,
  icon: Icon,
  color,
  href,
  urgent,
}: {
  title: string;
  count: number;
  icon: any;
  color: string;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className={`bg-card border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
        urgent && count > 0 ? "border-red-300 bg-red-50/30" : "border-border/50"
      }`}>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
              <p className={`text-3xl font-bold mt-1 ${urgent && count > 0 ? "text-red-600" : "text-foreground"}`}>
                {count}
              </p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <Card className="bg-card border border-border/50">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const NOTIFICATION_TYPE_ICONS: Record<string, any> = {
  ticket_created: Ticket,
  ticket_reply: Ticket,
  document_signed: FileText,
  document_viewed: FileText,
  approval_response: CheckSquare,
  message_received: Bell,
  payment_received: DollarSign,
  payment_overdue: AlertTriangle,
  milestone_completed: CheckCircle2,
  onboarding_complete: Users,
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "border-red-500/40 text-red-600 bg-red-500/10",
  high: "border-orange-500/40 text-orange-600 bg-orange-500/10",
  normal: "border-blue-500/40 text-blue-600 bg-blue-500/10",
  low: "border-border text-muted-foreground bg-muted/10",
};

const ASSIGNEE_COLORS: Record<string, string> = {
  brandon: "bg-blue-500/15 text-blue-700",
  dale: "bg-green-500/15 text-green-700",
  both: "bg-purple-500/15 text-purple-700",
};

const STATUS_INDICATOR: Record<string, { label: string; className: string }> = {
  green: { label: "On Track", className: "bg-green-500" },
  yellow: { label: "Needs Attention", className: "bg-amber-500" },
  red: { label: "At Risk", className: "bg-red-500" },
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<{
    unreadNotifications: number;
    overdueTasks: number;
    pendingApprovals: number;
    unsignedDocuments: number;
    activeClients: number;
    totalRevenueMonth: number;
    openTickets: number;
    hoursLoggedMonth: number;
    todayTasks: any[];
    recentActivity: any[];
    clientHealth: any[];
  }>({
    queryKey: ["/api/admin/dashboard-v2"],
  });

  const completeTask = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/admin/tasks/${id}`, { status: "done" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-v2"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-card border border-border/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-['Playfair_Display']">
          Command Center
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{today}</p>
      </div>

      {/* Row 1: Action Required */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Action Required
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            title="Unread Notifications"
            count={stats?.unreadNotifications ?? 0}
            icon={Bell}
            color="bg-[#B7542E]/10 text-[#B7542E]"
            href="/admin/notifications"
          />
          <ActionCard
            title="Overdue Tasks"
            count={stats?.overdueTasks ?? 0}
            icon={AlertTriangle}
            color="bg-red-500/10 text-red-600"
            href="/admin/tasks"
            urgent
          />
          <ActionCard
            title="Pending Approvals"
            count={stats?.pendingApprovals ?? 0}
            icon={CheckSquare}
            color="bg-amber-500/10 text-amber-600"
            href="/admin/approvals"
          />
          <ActionCard
            title="Unsigned Documents"
            count={stats?.unsignedDocuments ?? 0}
            icon={FileText}
            color="bg-purple-500/10 text-purple-600"
            href="/admin/documents"
          />
        </div>
      </div>

      {/* Row 2: Business Metrics */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Business Metrics
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Clients"
            value={stats?.activeClients ?? 0}
            icon={Users}
            color="bg-[#2D2F36]/10 text-[#2D2F36]"
          />
          <StatCard
            title="Revenue This Month"
            value={`$${(stats?.totalRevenueMonth ?? 0).toLocaleString()}`}
            icon={DollarSign}
            color="bg-green-500/10 text-green-600"
          />
          <StatCard
            title="Open Support Tickets"
            value={stats?.openTickets ?? 0}
            icon={Ticket}
            color="bg-red-500/10 text-red-600"
          />
          <StatCard
            title="Hours Logged (Month)"
            value={`${(stats?.hoursLoggedMonth ?? 0).toFixed(1)}h`}
            icon={Clock}
            color="bg-blue-500/10 text-blue-600"
          />
        </div>
      </div>

      {/* Calendar */}
      <DashboardCalendar isAdmin={true} />

      {/* Row 3: Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Today's Tasks
              </CardTitle>
              <Link href="/admin/tasks">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!stats?.todayTasks?.length ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 mx-auto text-green-500/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nothing due today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.todayTasks.map((task: any) => {
                  const isOverdue = task.dueDate && isPast(new Date(task.dueDate + "T23:59:59"));
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border/30 hover:bg-muted/20"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 flex-shrink-0"
                        onClick={() => completeTask.mutate(task.id)}
                      >
                        <Circle className="w-4 h-4 text-muted-foreground hover:text-green-600" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{task.title}</p>
                        {task.clientName && (
                          <p className="text-xs text-muted-foreground/70">{task.clientName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge variant="outline" className={`text-xs px-1.5 py-0 ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </Badge>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${ASSIGNEE_COLORS[task.assignedTo]}`}>
                          {task.assignedTo.charAt(0).toUpperCase()}
                        </span>
                        {isOverdue && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Row 4: Recent Activity */}
        <Card className="bg-card border border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <Link href="/admin/notifications">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!stats?.recentActivity?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {stats.recentActivity.slice(0, 8).map((item: any) => {
                  const Icon = NOTIFICATION_TYPE_ICONS[item.type] || Bell;
                  return (
                    <div key={item.id} className="flex items-start gap-3 py-1.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.priority === "urgent" || item.priority === "high"
                          ? "bg-red-500/10 text-red-600"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-snug">{item.title}</p>
                        {item.clientName && (
                          <p className="text-xs text-muted-foreground/70">{item.clientName}</p>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!item.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B7542E] flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Client Health Overview */}
      <Card className="bg-card border border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Client Health Overview</CardTitle>
            <Link href="/admin/clients">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                Manage Clients <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!stats?.clientHealth?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No clients yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-2 py-2 uppercase tracking-wider">Client</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-2 py-2 uppercase tracking-wider hidden md:table-cell">Service</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-2 py-2 uppercase tracking-wider">Progress</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-2 py-2 uppercase tracking-wider hidden lg:table-cell">Last Activity</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-2 py-2 uppercase tracking-wider hidden lg:table-cell">Pending</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-2 py-2 uppercase tracking-wider">Status</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-2 py-2 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.clientHealth.map((client: any) => {
                    const si = STATUS_INDICATOR[client.statusColor] || STATUS_INDICATOR.green;
                    return (
                      <tr key={client.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#B7542E]/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-[#B7542E]">
                                {client.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground">{client.name}</p>
                              <p className="text-xs text-muted-foreground">{client.brandName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 hidden md:table-cell">
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {client.project?.serviceType || "—"}
                          </p>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#B7542E] rounded-full"
                                style={{ width: `${client.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">{client.progress}%</span>
                          </div>
                        </td>
                        <td className="px-2 py-3 hidden lg:table-cell">
                          <p className="text-xs text-muted-foreground">
                            {client.lastActivity
                              ? formatDistanceToNow(new Date(client.lastActivity), { addSuffix: true })
                              : "—"}
                          </p>
                        </td>
                        <td className="px-2 py-3 hidden lg:table-cell">
                          <span className={`text-xs font-medium ${client.pendingItems > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                            {client.pendingItems}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${si.className}`} />
                            <span className="text-xs text-muted-foreground hidden sm:inline">{si.label}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <Link href={`/admin/clients/${client.id}`}>
                            <Button variant="ghost" size="icon" className="w-6 h-6">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

