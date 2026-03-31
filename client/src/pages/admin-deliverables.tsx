import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, ExternalLink, Edit2 } from "lucide-react";

const FILE_STATUSES = ["draft", "under_review", "approved", "final"];

const STATUS_COLORS: Record<string, string> = {
  draft: "border-border text-muted-foreground",
  under_review: "border-amber-500/40 text-amber-600 bg-amber-500/5",
  approved: "border-blue-500/40 text-blue-600 bg-blue-500/5",
  final: "border-green-500/40 text-green-600 bg-green-500/5",
};

export default function AdminDeliverables() {
  const { toast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [editDeliverable, setEditDeliverable] = useState<any | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("");
  const [uploadForm, setUploadForm] = useState({
    title: "",
    fileUrl: "",
    fileStatus: "draft",
    version: 1,
  });
  const [editForm, setEditForm] = useState({
    title: "",
    fileUrl: "",
    fileStatus: "draft",
    version: 1,
  });

  const { data: deliverableGroups = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/deliverables"],
  });

  // For milestone dropdown — fetch all projects when a client is selected
  const selectedGroup = deliverableGroups.find(
    (g: any) => String(g.client?.id) === selectedClientId
  );

  // We need client milestones for the upload form
  const { data: clientDetail } = useQuery<any>({
    queryKey: [`/api/admin/clients/${selectedClientId}`],
    enabled: !!selectedClientId,
  });

  const createDeliverable = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/deliverables", {
        milestoneId: parseInt(selectedMilestoneId),
        title: uploadForm.title,
        fileUrl: uploadForm.fileUrl,
        fileStatus: uploadForm.fileStatus,
        version: uploadForm.version,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deliverables"] });
      setShowUpload(false);
      setUploadForm({ title: "", fileUrl: "", fileStatus: "draft", version: 1 });
      setSelectedClientId("");
      setSelectedMilestoneId("");
      toast({ title: "Deliverable uploaded" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateDeliverable = useMutation({
    mutationFn: async () => {
      if (!editDeliverable) return;
      const res = await apiRequest("PATCH", `/api/admin/deliverables/${editDeliverable.id}`, editForm);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deliverables"] });
      setEditDeliverable(null);
      toast({ title: "Deliverable updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const openEdit = (deliv: any) => {
    setEditDeliverable(deliv);
    setEditForm({
      title: deliv.title,
      fileUrl: deliv.fileUrl || "",
      fileStatus: deliv.fileStatus || "draft",
      version: deliv.version || 1,
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Playfair_Display']">
            Deliverables
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage files and assets for all clients
          </p>
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          className="bg-[#B7542E] hover:bg-[#a3472a] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Deliverable
        </Button>
      </div>

      {/* Groups by Client */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-card border border-border/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : deliverableGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No clients found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliverableGroups.map((group: any) => (
            <Card key={group.client?.id} className="bg-card border border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#B7542E]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#B7542E]">
                      {group.client?.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "?"}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{group.client?.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {group.client?.brandName} ·{" "}
                      {group.project?.serviceType || "No project"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {!group.deliverables?.length ? (
                  <p className="text-sm text-muted-foreground py-3 text-center">
                    No deliverables yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {group.deliverables.map((deliv: any) => (
                      <div
                        key={deliv.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/20 border border-border/30"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {deliv.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              v{deliv.version || 1}
                            </span>
                            {deliv.uploadedAt && (
                              <span className="text-xs text-muted-foreground">
                                · {new Date(deliv.uploadedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs flex-shrink-0 ${
                            STATUS_COLORS[deliv.fileStatus || "draft"] || ""
                          }`}
                        >
                          {(deliv.fileStatus || "draft").replace("_", " ")}
                        </Badge>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {deliv.fileUrl && deliv.fileUrl !== "#" && (
                            <a
                              href={deliv.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => openEdit(deliv)}
                            className="p-1.5 rounded hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Playfair_Display']">Upload Deliverable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Client</Label>
              <select
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  setSelectedMilestoneId("");
                }}
                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                <option value="">Select a client...</option>
                {deliverableGroups.map((g: any) => (
                  <option key={g.client?.id} value={String(g.client?.id)}>
                    {g.client?.name} — {g.client?.brandName}
                  </option>
                ))}
              </select>
            </div>

            {selectedClientId && clientDetail?.milestones && (
              <div className="space-y-1.5">
                <Label>Session / Milestone</Label>
                <select
                  value={selectedMilestoneId}
                  onChange={(e) => setSelectedMilestoneId(e.target.value)}
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
                >
                  <option value="">Select a milestone...</option>
                  {clientDetail.milestones.map((m: any) => (
                    <option key={m.id} value={String(m.id)}>
                      Session {m.sessionNumber}: {m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="del-title">Title</Label>
              <Input
                id="del-title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="Brand Brief v1"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="del-url">File URL (Google Drive, etc.)</Label>
              <Input
                id="del-url"
                value={uploadForm.fileUrl}
                onChange={(e) => setUploadForm({ ...uploadForm, fileUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={uploadForm.fileStatus}
                  onChange={(e) => setUploadForm({ ...uploadForm, fileStatus: e.target.value })}
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
                >
                  {FILE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="del-ver">Version</Label>
                <Input
                  id="del-ver"
                  type="number"
                  min={1}
                  value={uploadForm.version}
                  onChange={(e) => setUploadForm({ ...uploadForm, version: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createDeliverable.mutate()}
              disabled={
                !uploadForm.title ||
                !selectedMilestoneId ||
                createDeliverable.isPending
              }
              className="bg-[#B7542E] hover:bg-[#a3472a] text-white"
            >
              {createDeliverable.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDeliverable} onOpenChange={() => setEditDeliverable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Playfair_Display']">Edit Deliverable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-url">File URL</Label>
              <Input
                id="edit-url"
                value={editForm.fileUrl}
                onChange={(e) => setEditForm({ ...editForm, fileUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={editForm.fileStatus}
                  onChange={(e) => setEditForm({ ...editForm, fileStatus: e.target.value })}
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
                >
                  {FILE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-ver">Version</Label>
                <Input
                  id="edit-ver"
                  type="number"
                  min={1}
                  value={editForm.version}
                  onChange={(e) => setEditForm({ ...editForm, version: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDeliverable(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateDeliverable.mutate()}
              disabled={!editForm.title || updateDeliverable.isPending}
              className="bg-[#B7542E] hover:bg-[#a3472a] text-white"
            >
              {updateDeliverable.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

