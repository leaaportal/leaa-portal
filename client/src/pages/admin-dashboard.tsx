import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Ticket, FolderOpen, DollarSign, MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ item }: { item: any }) {
  const isTicket = item.type === "ticket";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isTicket ? "bg-[#B7542E]/10" : "bg-[#2D2F36]/10"
        }`}
      >
        {isTicket ? (
          <Ticket className="w-4 h-4 text-[#B7542E]" />
        ) : (
          <MessageSquare className="w-4 h-4 text-[#2D2F36]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {isTicket ? (
            <>
              <span className="text-muted-foreground">{item.userName}</span>
              {" opened ticket: "}
              <span className="font-semibold">{item.subject}</span>
            </>
          ) : (
            <>
              <span className="font-semibold">{item.senderName}</span>
              {item.senderRole === "admin" ? (
                <span className="text-muted-foreground"> → {item.clientName}</span>
              ) : (
                <span className="text-muted-foreground"> sent a message</span>
              )}
            </>
          )}
        </p>
        {!isTicket && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.content}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
          {isTicket && (
            <Badge
              variant="outline"
              className={`text-xs px-1.5 py-0 ${
                item.status === "open"
                  ? "border-[#B7542E]/40 text-[#B7542E]"
                  : item.status === "in_progress"
                  ? "border-amber-500/40 text-amber-600"
                  : "border-green-500/40 text-green-600"
              }`}
            >
              {item.status.replace("_", " ")}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<{
    totalActiveClients: number;
    openTickets: number;
    projectsInProgress: number;
    totalRevenue: number;
    recentActivity: any[];
  }>({
    queryKey: ["/api/admin/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card border border-border/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-['Playfair_Display']">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of all client activity and portal performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Clients"
          value={stats?.totalActiveClients ?? 0}
          icon={Users}
          color="bg-[#2D2F36]/10 text-[#2D2F36]"
        />
        <StatCard
          title="Open Tickets"
          value={stats?.openTickets ?? 0}
          icon={Ticket}
          color="bg-[#B7542E]/10 text-[#B7542E]"
        />
        <StatCard
          title="Active Projects"
          value={stats?.projectsInProgress ?? 0}
          icon={FolderOpen}
          color="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500/10 text-green-600"
        />
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.recentActivity?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity to show
            </p>
          ) : (
            <div>
              {stats.recentActivity.map((item, i) => (
                <ActivityItem key={`${item.type}-${item.id}-${i}`} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

