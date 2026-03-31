import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminMessages() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [sender, setSender] = useState("Dale Lane");

  const { data: conversations = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/messages"],
  });

  const selectedConversation = conversations.find(
    (c: any) => c.project?.id === selectedProjectId
  );

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/admin/messages", {
        projectId: selectedProjectId,
        content,
        senderName: sender,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      setMessageContent("");
      toast({ title: "Message sent" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-['Playfair_Display']">
          Messages
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          All client conversations
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[400px]">
        {/* Sidebar: Conversation List */}
        <Card className="w-64 flex-shrink-0 bg-card border border-border/50 overflow-hidden">
          <div className="p-3 border-b border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Clients
            </p>
          </div>
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-muted-foreground">No conversations</p>
              </div>
            ) : (
              <div className="p-1.5 space-y-0.5">
                {conversations.map((conv: any) => {
                  const isSelected = selectedProjectId === conv.project?.id;
                  return (
                    <button
                      key={conv.project?.id}
                      onClick={() => setSelectedProjectId(conv.project?.id)}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-[#2D2F36] text-white"
                          : "hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-white/10" : "bg-[#B7542E]/10"
                          }`}
                        >
                          <span
                            className={`text-[10px] font-bold ${
                              isSelected ? "text-white" : "text-[#B7542E]"
                            }`}
                          >
                            {conv.user?.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || "?"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-medium truncate ${
                              isSelected ? "text-white" : "text-foreground"
                            }`}
                          >
                            {conv.user?.name || "Unknown"}
                          </p>
                          <p
                            className={`text-[10px] truncate ${
                              isSelected ? "text-white/60" : "text-muted-foreground"
                            }`}
                          >
                            {conv.user?.brandName}
                          </p>
                        </div>
                      </div>
                      {conv.lastMessage && (
                        <p
                          className={`text-[10px] mt-1 truncate ${
                            isSelected ? "text-white/50" : "text-muted-foreground"
                          }`}
                        >
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Message Thread */}
        <Card className="flex-1 bg-card border border-border/50 flex flex-col overflow-hidden">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground">Select a client to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-4 py-3 border-b border-border/50 flex-shrink-0">
                <p className="font-semibold text-sm text-foreground">
                  {selectedConversation.user?.name}
                </p>
                <p className="text-xs text-muted-foreground">{selectedConversation.user?.brandName}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages?.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground mt-8">
                    No messages yet
                  </p>
                ) : (
                  [...(selectedConversation.messages || [])].reverse().map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${
                        msg.senderRole === "admin" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.senderRole === "admin" ? "bg-[#B7542E]/10" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold ${
                            msg.senderRole === "admin"
                              ? "text-[#B7542E]"
                              : "text-muted-foreground"
                          }`}
                        >
                          {msg.senderName
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div
                        className={`flex-1 max-w-xs lg:max-w-md rounded-xl px-3 py-2.5 ${
                          msg.senderRole === "admin"
                            ? "bg-[#2D2F36] text-white"
                            : "bg-muted/40 text-foreground"
                        }`}
                      >
                        <p
                          className={`text-xs font-medium mb-1 ${
                            msg.senderRole === "admin" ? "text-white/70" : "text-muted-foreground"
                          }`}
                        >
                          {msg.senderName}
                        </p>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1.5 ${
                            msg.senderRole === "admin" ? "text-white/40" : "text-muted-foreground"
                          }`}
                        >
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Compose */}
              <div className="p-3 border-t border-border/50 flex-shrink-0 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Send as:</label>
                  <select
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
                  >
                    <option>Dale Lane</option>
                    <option>Brandon Ellis</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder={`Message as ${sender}...`}
                    className="resize-none text-sm flex-1"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (messageContent.trim()) {
                          sendMessage.mutate(messageContent);
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      if (messageContent.trim()) sendMessage.mutate(messageContent);
                    }}
                    disabled={!messageContent.trim() || sendMessage.isPending}
                    className="bg-[#B7542E] hover:bg-[#a3472a] text-white self-end"
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

