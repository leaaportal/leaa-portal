import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Circle } from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: number;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
  isRead: number | null;
}

function formatMessageDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

function getSenderColor(name: string, role: string) {
  if (role === "client") return "bg-primary/15 text-primary";
  if (name.includes("Dale")) return "bg-[#B7542E]/15 text-[#B7542E]";
  return "bg-[#2D2F36]/10 text-[#2D2F36] dark:bg-[#D9C9B6]/15 dark:text-[#D9C9B6]";
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");

  const { data: projects } = useQuery<Array<{ id: number }>>({
    queryKey: ["/api/projects"],
  });

  const projectId = projects?.[0]?.id;

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/projects", projectId, "messages"],
    enabled: !!projectId,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  if (isLoading || !messages) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  // Group messages by date
  const grouped = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const key = formatMessageDate(msg.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto" data-testid="messages-page">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conversations with your LEAA team
        </p>
      </div>

      {/* Compose message */}
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-xs font-bold text-primary">
                {user?.name?.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message to your LEAA team..."
                className="min-h-[60px] text-sm resize-none"
                data-testid="input-new-message"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => sendMutation.mutate(newMessage)}
                  disabled={!newMessage.trim() || sendMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4 mr-1" />
                  {sendMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {messages.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/20" />
          <h3 className="text-base font-medium text-foreground mb-1">No messages yet</h3>
          <p className="text-sm text-muted-foreground">Send the first message to start a conversation.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{date}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-3">
                {msgs.map((msg, i) => {
                  const isClient = msg.senderRole === "client";
                  const isUnread = msg.isRead === 0;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: isClient ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className={`border-border/50 shadow-sm hover:shadow-md transition-shadow ${isClient ? "ml-8" : ""} ${isUnread ? "ring-1 ring-primary/20 border-primary/20" : ""}`}
                        data-testid={`message-card-${msg.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getSenderColor(msg.senderName, msg.senderRole)}`}>
                              <span className="text-xs font-bold">
                                {getInitials(msg.senderName)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-semibold text-foreground">{msg.senderName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(msg.createdAt), "h:mm a")}
                                </span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                                  isClient
                                    ? "bg-primary/10 text-primary"
                                    : "bg-secondary text-secondary-foreground"
                                }`}>
                                  {isClient ? "You" : "LEAA Team"}
                                </span>
                                {isUnread && (
                                  <span className="flex items-center gap-1 text-xs text-primary font-medium">
                                    <Circle className="w-2 h-2 fill-primary" />
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed">{msg.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
