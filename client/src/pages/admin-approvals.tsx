import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Plus,
  User,
  Filter,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface ApprovalData {
  id: number;
  projectId: number;
  milestoneId: number | null;
  deliverableId: number | null;
  type: string;
  title: string;
  description: string | null;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
  client: { id: number; name: string; brandName: string };
  project: { id: number; name: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  revision_requested: { label: "Revision Requested", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: RotateCcw },
};

const typeLabels: Record<string, string> = {
  deliverable_approval: "Deliverable",
  phase_signoff: "Phase Sign-Off",
  legal_document: "Legal Document",
  design_approval: "Design Approval",
  material_approval: "Material",
  sample_approval: "Sample",
};

export default function AdminApprovalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "revision_requested">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ projectId: "", milestoneId: "", type: "deliverable_approval", title: "", description: "" });

  const { data: approvals, isLoading } = useQuery<ApprovalData[]>({
    queryKey: ["/api/admin/approvals"],
  });

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/approvals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/approvals"] });
      toast({ title: "Approval request created" });
      setAddOpen(false);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  const all = approvals || [];
  const filtered = filter === "all" ? all : all.filter((a) => a.status === filter);

  const byStatus = (s: string) => all.filter((a) => a.status === s).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Approvals</h1>
          <p className="text-sm text-muted-foreground mt-1">Track pending and completed approvals across all clients</p>
        </div>
        <Button
          className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Request Approval
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: all.length, color: "text-foreground" },
          { label: "Pending", value: byStatus("pending"), color: "text-yellow-600" },
          { label: "Approved", value: byStatus("approved"), color: "text-green-600" },
          { label: "Revisions", value: byStatus("revision_requested"), color: "text-orange-600" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {["all", "pending", "approved", "rejected", "revision_requested"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as any)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === s
                ? "bg-[#B7542E] text-white border-[#B7542E]"
                : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Approvals list */}
      <div className="space-y-3">
        {filtered.map((approval) => {
          const cfg = statusConfig[approval.status] || statusConfig.pending;
          const StatusIcon = cfg.icon;

          return (
            <Card
              key={approval.id}
              className={`border shadow-sm ${
                approval.status === "pending"
                  ? "border-yellow-200 dark:border-yellow-800/30"
                  : approval.status === "approved"
                  ? "border-green-200 dark:border-green-900/30"
                  : ""
              }`}
            >
              <div className="p-4 flex items-start gap-4">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    approval.status === "approved"
                      ? "bg-green-100 dark:bg-green-900/20"
                      : approval.status === "pending"
                      ? "bg-yellow-100 dark:bg-yellow-900/20"
                      : "bg-muted"
                  }`}
                >
                  <StatusIcon className={`w-4.5 h-4.5 ${
                    approval.status === "approved" ? "text-green-600" :
                    approval.status === "pending" ? "text-yellow-600" :
                    "text-muted-foreground"
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          {typeLabels[approval.type] || approval.type}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" /> {approval.client?.brandName}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{approval.title}</p>
                      {approval.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{approval.description}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>Requested {format(parseISO(approval.createdAt), "MMM d, yyyy")}</span>
                    {approval.approvedAt && (
                      <span className="text-green-600">
                        {approval.status === "approved" ? "Approved" : "Updated"} {format(parseISO(approval.approvedAt), "MMM d, yyyy")}
                        {approval.approvedBy && ` by ${approval.approvedBy}`}
                      </span>
                    )}
                    {approval.notes && (
                      <span className="italic">&ldquo;{approval.notes}&rdquo;</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card className="border border-dashed">
            <CardContent className="py-14 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No approvals found for this filter.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Approval Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Approval Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Client Project</label>
              <select
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                value={addForm.projectId}
                onChange={(e) => setAddForm({ ...addForm, projectId: e.target.value })}
              >
                <option value="">Select client...</option>
                {(clients || []).map((c: any) => (
                  c.project && (
                    <option key={c.project.id} value={c.project.id}>{c.brandName}</option>
                  )
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                value={addForm.type}
                onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
              >
                {Object.entries(typeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                className="mt-1"
                placeholder="e.g. Brand Brief v2 Approval"
                value={addForm.title}
                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (shown to client)</label>
              <Input
                className="mt-1"
                placeholder="What should the client review and approve?"
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
              disabled={!addForm.projectId || !addForm.title || createMutation.isPending}
              onClick={() => createMutation.mutate(addForm)}
            >
              {createMutation.isPending ? "Creating..." : "Create Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

