import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  FileText,
  Ticket,
  CheckSquare,
  DollarSign,
  AlertCircle,
  Trophy,
  UserCheck,
  Circle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const NOTIFICATION_ICONS: Record<string, any> = {
  ticket_created: Ticket,
  ticket_reply: Ticket,
  document_signed: FileText,
  document_viewed: FileText,
  approval_response: CheckSquare,
  message_received: MessageSquare,
  payment_received: DollarSign,
  payment_overdue: AlertCircle,
  milestone_completed: Trophy,
  onboarding_complete: UserCheck,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  ticket_created: "bg-red-500/10 text-red-600",
  ticket_reply: "bg-orange-500/10 text-orange-600",
  document_signed: "bg-green-500/10 text-green-600",
  document_viewed: "bg-blue-500/10 text-blue-600",
  approval_response: "bg-purple-500/10 text-purple-600",
  message_received: "bg-[#B7542E]/10 text-[#B7542E]",
  payment_received: "bg-green-500/10 text-green-600",
  payment_overdue: "bg-red-500/10 text-red-600",
  milestone_completed: "bg-amber-500/10 text-amber-600",
  onboarding_complete: "bg-teal-500/10 text-teal-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "border-red-500/40 text-red-600 bg-red-500/5",
  high: "border-orange-500/40 text-orange-600 bg-orange-500/5",
  normal: "border-blue-500/40 text-blue-600 bg-blue-500/5",
  low: "border-border text-muted-foreground",
};

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  ticket_created: "Ticket Created",
  ticket_reply: "Ticket Reply",
  document_signed: "Document Signed",
  document_viewed: "Document Viewed",
  approval_response: "Approval Response",
  message_received: "Message Received",
  payment_received: "Payment Received",
  payment_overdue: "Payment Overdue",
  milestone_completed: "Milestone Completed",
  onboarding_complete: "Onboarding Complete",
};

export default function AdminNotifications() {
  const { toast } = useToast();
  const [filterRead, setFilterRead] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const params = new URLSearchParams();
  if (filterRead !== "all") params.set("read", filterRead);
  if (filterType !== "all") params.set("type", filterType);

  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/notifications", filterRead, filterType],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/notifications?${params.toString()}`);
      return res.json();
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Playfair_Display']">
            Admin Notifications
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || unreadCount === 0}
          className="gap-2"
        >
          <CheckCheck className="w-4 h-4" />
          Mark All Read
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterRead} onValueChange={setFilterRead}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <Card className="bg-card border border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-1 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notif: any) => {
                const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
                const colorClass = NOTIFICATION_COLORS[notif.type] || "bg-muted/30 text-muted-foreground";
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors cursor-pointer ${
                      !notif.isRead ? "bg-[#B7542E]/3" : ""
                    }`}
                    onClick={() => !notif.isRead && markRead.mutate(notif.id)}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-medium ${!notif.isRead ? "text-foreground" : "text-foreground/80"}`}>
                          {notif.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 ${PRIORITY_COLORS[notif.priority]}`}
                        >
                          {notif.priority}
                        </Badge>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#B7542E] inline-block" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {notif.clientName && (
                          <span className="text-xs text-muted-foreground/70 font-medium">
                            {notif.clientName}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 border-border text-muted-foreground">
                          {NOTIFICATION_TYPE_LABELS[notif.type] || notif.type}
                        </Badge>
                      </div>
                    </div>
                    {notif.isRead ? (
                      <Circle className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-1" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#B7542E] flex-shrink-0 mt-1 fill-[#B7542E]" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

