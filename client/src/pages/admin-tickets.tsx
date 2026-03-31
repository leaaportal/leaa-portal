import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Clock, ChevronDown, ChevronUp, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_OPTIONS = ["all", "open", "in_progress", "resolved", "closed"];

const STATUS_COLORS: Record<string, string> = {
  open: "border-[#B7542E]/40 text-[#B7542E] bg-[#B7542E]/5",
  in_progress: "border-amber-500/40 text-amber-600 bg-amber-500/5",
  resolved: "border-green-500/40 text-green-600 bg-green-500/5",
  closed: "border-border text-muted-foreground",
};

export default function AdminTickets() {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySender, setReplySender] = useState("Dale Lane");

  const { data: tickets = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/tickets", filter],
    queryFn: async () => {
      const url = filter === "all" ? "/api/admin/tickets" : `/api/admin/tickets?status=${filter}`;
      const res = await fetch(`.${url}`);
      if (!res.ok) throw new Error("Failed to load tickets");
      return res.json();
    },
  });

  const sendReply = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: number; content: string }) => {
      const res = await apiRequest("POST", `/api/admin/tickets/${ticketId}/reply`, {
        content,
        senderName: replySender,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      setReplyContent("");
      toast({ title: "Reply sent" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/tickets/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      toast({ title: "Status updated" });
    },
  });

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      general: "General",
      revision: "Revision",
      scheduling: "Scheduling",
      deliverable: "Deliverable",
      billing: "Billing",
      feedback: "Feedback",
      other: "Other",
    };
    return labels[cat] || cat;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-['Playfair_Display']">
          Support Tickets
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}{" "}
          {filter !== "all" ? `(${filter.replace("_", " ")})` : ""}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? "bg-[#2D2F36] text-white"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Tickets */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-card border border-border/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="bg-card border border-border/50">
          <CardContent className="py-16 text-center">
            <Ticket className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No tickets found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => {
            const isExpanded = expandedTicket === ticket.id;

            return (
              <Card key={ticket.id} className="bg-card border border-border/50">
                <CardHeader className="pb-2">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_COLORS[ticket.status] || ""}`}
                        >
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                          {getCategoryLabel(ticket.category)}
                        </Badge>
                        {ticket.priority === "urgent" && (
                          <Badge className="text-xs bg-red-500/10 text-red-600 border border-red-500/30">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm font-semibold">{ticket.subject}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ticket.user?.name || "Unknown"} ·{" "}
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground ml-2 flex-shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="border-t border-border/30 pt-3 space-y-4">
                      {/* Replies thread */}
                      <div className="space-y-3">
                        {ticket.replies?.map((reply: any) => (
                          <div
                            key={reply.id}
                            className={`flex gap-2.5 ${
                              reply.senderRole === "admin" ? "flex-row-reverse" : ""
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                reply.senderRole === "admin"
                                  ? "bg-[#B7542E]/10"
                                  : "bg-muted"
                              }`}
                            >
                              <span
                                className={`text-[10px] font-bold ${
                                  reply.senderRole === "admin"
                                    ? "text-[#B7542E]"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {reply.senderName
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <div
                              className={`flex-1 rounded-xl px-3 py-2.5 text-sm ${
                                reply.senderRole === "admin"
                                  ? "bg-[#2D2F36] text-white"
                                  : "bg-muted/40 text-foreground"
                              }`}
                            >
                              <p className="font-medium text-xs mb-1 opacity-70">
                                {reply.senderName}
                              </p>
                              <p className="leading-relaxed">{reply.content}</p>
                              <p className="text-xs opacity-50 mt-1.5">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply + Status Controls */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-muted-foreground">Reply as:</label>
                          <select
                            value={replySender}
                            onChange={(e) => setReplySender(e.target.value)}
                            className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
                          >
                            <option>Dale Lane</option>
                            <option>Brandon Ellis</option>
                          </select>
                          <label className="text-xs text-muted-foreground ml-3">Status:</label>
                          <select
                            value={ticket.status}
                            onChange={(e) =>
                              updateStatus.mutate({ id: ticket.id, status: e.target.value })
                            }
                            className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Type your reply..."
                            className="resize-none text-sm"
                            rows={3}
                          />
                        </div>
                        <Button
                          onClick={() => {
                            if (!replyContent.trim()) return;
                            sendReply.mutate({ ticketId: ticket.id, content: replyContent });
                          }}
                          disabled={!replyContent.trim() || sendReply.isPending}
                          className="bg-[#B7542E] hover:bg-[#a3472a] text-white"
                          size="sm"
                        >
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          {sendReply.isPending ? "Sending..." : "Send Reply"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

