import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LifeBuoy, Plus, Clock, CheckCircle2, AlertCircle, XCircle,
  ChevronDown, ChevronUp, Send, Filter,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

interface SupportTicket {
  id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  attachmentRef: string | null;
}

interface TicketReply {
  id: number;
  ticketId: number;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  general: "General Question",
  revision: "Revision Request",
  scheduling: "Scheduling",
  deliverable: "Deliverable Request",
  billing: "Billing",
  feedback: "Feedback",
  other: "Other",
};

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  open: { label: "Open", className: "bg-[#B7542E]/10 text-[#B7542E] border-[#B7542E]/20", icon: AlertCircle },
  in_progress: { label: "In Progress", className: "bg-[#D9C9B6]/30 text-[#8B7355] border-[#D9C9B6]/40", icon: Clock },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200", icon: CheckCircle2 },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border", icon: XCircle },
};

function TicketStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.open;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function TicketDetail({ ticketId, onClose }: { ticketId: number; onClose: () => void }) {
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState("");

  const { data, isLoading } = useQuery<{ ticket: SupportTicket; replies: TicketReply[] }>({
    queryKey: ["/api/tickets", ticketId],
  });

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/tickets/${ticketId}/replies`, { content });
      return res.json();
    },
    onSuccess: () => {
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
    },
  });

  if (isLoading || !data) {
    return <div className="p-4 space-y-4"><Skeleton className="h-6 w-48" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;
  }

  const { ticket, replies } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground text-base">{ticket.subject}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <TicketStatusBadge status={ticket.status} />
            <span className="text-xs text-muted-foreground">{categoryLabels[ticket.category]}</span>
            {ticket.priority === "urgent" && (
              <span className="text-xs font-medium text-destructive">Urgent</span>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          #{ticket.id} · {format(parseISO(ticket.createdAt), "MMM d, yyyy")}
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {replies.map((reply) => {
          const isClient = reply.senderRole === "client";
          return (
            <div
              key={reply.id}
              className={`p-3 rounded-lg ${isClient ? "bg-primary/5 border border-primary/10 ml-4" : "bg-muted/50 border border-border/30 mr-4"}`}
              data-testid={`ticket-reply-${reply.id}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">{reply.senderName}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${isClient ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                  {isClient ? "You" : "LEAA Team"}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(parseISO(reply.createdAt), "MMM d, h:mm a")}
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{reply.content}</p>
            </div>
          );
        })}
      </div>

      {(ticket.status === "open" || ticket.status === "in_progress") && (
        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[60px] text-sm"
            data-testid="input-ticket-reply"
          />
          <Button
            size="sm"
            onClick={() => replyMutation.mutate(replyContent)}
            disabled={!replyContent.trim() || replyMutation.isPending}
            className="self-end"
            data-testid="button-send-ticket-reply"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);

  // New ticket form
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");
  const [attachmentRef, setAttachmentRef] = useState("");

  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/tickets"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tickets", {
        subject, category, priority, description, attachmentRef: attachmentRef || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setShowNewTicket(false);
      setSubject("");
      setCategory("");
      setPriority("normal");
      setDescription("");
      setAttachmentRef("");
    },
  });

  const filtered = tickets?.filter((t) => statusFilter === "all" || t.status === statusFilter) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" data-testid="support-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tickets?.length || 0} ticket{(tickets?.length || 0) !== 1 ? "s" : ""} submitted
          </p>
        </div>
        <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-new-ticket">
              <Plus className="w-4 h-4 mr-1" />
              New Inquiry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Submit New Inquiry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your request"
                  data-testid="input-ticket-subject"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="select-ticket-category">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Priority</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger data-testid="select-ticket-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your request in detail..."
                  className="min-h-[100px]"
                  data-testid="input-ticket-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Attachment Reference (optional)</label>
                <Input
                  value={attachmentRef}
                  onChange={(e) => setAttachmentRef(e.target.value)}
                  placeholder="File name or reference"
                  data-testid="input-ticket-attachment"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!subject || !category || !description || createMutation.isPending}
                data-testid="button-submit-ticket"
              >
                {createMutation.isPending ? "Submitting..." : "Submit Inquiry"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "All" },
          { value: "open", label: "Open" },
          { value: "in_progress", label: "In Progress" },
          { value: "resolved", label: "Resolved" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f.value)}
            data-testid={`filter-${f.value}`}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <LifeBuoy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
          <h3 className="text-base font-medium text-foreground mb-1">No tickets found</h3>
          <p className="text-sm text-muted-foreground">
            {statusFilter === "all" ? "Submit your first inquiry to get started." : "No tickets with this status."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 shadow-sm">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                  data-testid={`ticket-row-${ticket.id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">#{ticket.id}</span>
                        <h3 className="text-sm font-semibold text-foreground truncate">{ticket.subject}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <TicketStatusBadge status={ticket.status} />
                        <span className="text-xs text-muted-foreground">{categoryLabels[ticket.category]}</span>
                        {ticket.priority === "urgent" && (
                          <span className="text-xs font-medium text-destructive">Urgent</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          · {format(parseISO(ticket.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    {expandedTicket === ticket.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {expandedTicket === ticket.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-border/30 pt-3">
                        <TicketDetail ticketId={ticket.id} onClose={() => setExpandedTicket(null)} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
