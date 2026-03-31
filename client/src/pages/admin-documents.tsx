import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Send,
  User,
  BookOpen,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface LegalDoc {
  id: number;
  title: string;
  category: string;
  status: string;
  sentAt: string | null;
  signedAt: string | null;
  signedBy: string | null;
  dueDate: string | null;
  required: number;
  createdAt: string;
  client: { id: number; name: string; brandName: string };
  project: { id: number; name: string };
}

interface DocTemplate {
  id: number;
  name: string;
  category: string;
  content: string;
  isActive: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  sent: "bg-yellow-100 text-yellow-700",
  viewed: "bg-blue-100 text-blue-700",
  signed: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
};

const categoryLabels: Record<string, string> = {
  nda: "NDA",
  service_agreement: "Service Agreement",
  mutual_release: "Mutual Release",
  phase_signoff: "Phase Sign-Off",
  design_approval: "Design Approval",
  ip_assignment: "IP Assignment",
  other: "Other",
};

export default function AdminDocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sendOpen, setSendOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<LegalDoc | null>(null);

  const { data: documents, isLoading: docsLoading } = useQuery<LegalDoc[]>({
    queryKey: ["/api/admin/documents"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<DocTemplate[]>({
    queryKey: ["/api/admin/document-templates"],
  });

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const [sendForm, setSendForm] = useState({
    clientId: "",
    templateId: "",
    title: "",
    category: "nda",
    content: "",
    dueDate: "",
    required: true,
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/documents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Document sent to client" });
      setSendOpen(false);
      setSendForm({ clientId: "", templateId: "", title: "", category: "nda", content: "", dueDate: "", required: true });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const handleTemplateSelect = (templateId: string) => {
    const tmpl = (templates || []).find((t) => String(t.id) === templateId);
    if (tmpl) {
      setSendForm({
        ...sendForm,
        templateId,
        title: tmpl.name,
        category: tmpl.category,
        content: tmpl.content,
      });
    } else {
      setSendForm({ ...sendForm, templateId });
    }
  };

  const handleSend = () => {
    const client = (clients || []).find((c: any) => String(c.id) === sendForm.clientId);
    if (!client || !client.project) return;
    sendMutation.mutate({
      projectId: client.project.id,
      userId: client.id,
      templateId: sendForm.templateId || null,
      title: sendForm.title,
      category: sendForm.category,
      content: sendForm.content,
      dueDate: sendForm.dueDate || null,
      required: sendForm.required,
    });
  };

  const isLoading = docsLoading || templatesLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-56" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  const docs = documents || [];
  const tmpls = templates || [];

  const byStatus = (s: string) => docs.filter((d) => d.status === s).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Documents & Legal</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage templates, send documents, track signatures</p>
        </div>
        <Button
          className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
          onClick={() => setSendOpen(true)}
        >
          <Send className="w-4 h-4 mr-1.5" /> Send Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Sent", value: docs.length },
          { label: "Awaiting Signature", value: byStatus("sent") + byStatus("viewed"), color: "text-yellow-600" },
          { label: "Signed", value: byStatus("signed"), color: "text-green-600" },
          { label: "Templates", value: tmpls.length },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${color || "text-foreground"}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Client Documents ({docs.length})</TabsTrigger>
          <TabsTrigger value="templates">Template Library ({tmpls.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <Card className="border shadow-sm">
            <CardContent className="pt-4">
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <FileText className={`w-5 h-5 flex-shrink-0 ${doc.status === "signed" ? "text-green-600" : "text-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-0.5"><User className="w-3 h-3" /> {doc.client?.brandName}</span>
                        <span>·</span>
                        <span>{categoryLabels[doc.category] || doc.category}</span>
                        {doc.signedAt && (
                          <>
                            <span>·</span>
                            <span className="text-green-600">Signed {format(parseISO(doc.signedAt), "MMM d")}</span>
                          </>
                        )}
                        {doc.dueDate && doc.status !== "signed" && (
                          <>
                            <span>·</span>
                            <span className="text-yellow-600">Due {format(parseISO(doc.dueDate), "MMM d")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[doc.status] || ""}`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                ))}
                {docs.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No documents sent yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Card className="border shadow-sm">
            <CardContent className="pt-4">
              <div className="space-y-3">
                {tmpls.map((tmpl) => (
                  <div key={tmpl.id} className="p-4 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{tmpl.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {categoryLabels[tmpl.category] || tmpl.category}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSendForm({ ...sendForm, templateId: String(tmpl.id), title: tmpl.name, category: tmpl.category, content: tmpl.content });
                          setSendOpen(true);
                        }}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" /> Use Template
                      </Button>
                    </div>
                    <div className="mt-2 max-h-20 overflow-hidden">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3 font-mono">
                        {tmpl.content.slice(0, 200)}...
                      </pre>
                    </div>
                  </div>
                ))}
                {tmpls.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No templates yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Document Dialog */}
      <Dialog open={sendOpen} onOpenChange={(o) => { if (!o) setSendOpen(false); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Send Document to Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Client</label>
              <Select value={sendForm.clientId} onValueChange={(v) => setSendForm({ ...sendForm, clientId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {(clients || []).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.brandName} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Template (optional)</label>
              <Select value={sendForm.templateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a template or create custom..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Document</SelectItem>
                  {tmpls.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Document Title</label>
              <Input
                className="mt-1"
                placeholder="e.g. Phase 3 Sign-Off"
                value={sendForm.title}
                onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={sendForm.category} onValueChange={(v) => setSendForm({ ...sendForm, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date (optional)</label>
                <Input
                  type="date"
                  className="mt-1"
                  value={sendForm.dueDate}
                  onChange={(e) => setSendForm({ ...sendForm, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Document Content</label>
              <textarea
                className="mt-1 w-full h-32 px-3 py-2 text-xs rounded-md border border-input bg-background font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Document text content..."
                value={sendForm.content}
                onChange={(e) => setSendForm({ ...sendForm, content: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendForm.required}
                onChange={(e) => setSendForm({ ...sendForm, required: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Required before next phase begins</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
              disabled={!sendForm.clientId || !sendForm.title || !sendForm.content || sendMutation.isPending}
              onClick={handleSend}
            >
              {sendMutation.isPending ? "Sending..." : "Send to Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

