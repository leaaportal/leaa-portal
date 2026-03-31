import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Edit2, User, Scissors, Tag } from "lucide-react";

interface Material {
  id: number;
  projectId: number;
  styleId: number | null;
  type: string;
  name: string;
  supplier: string | null;
  costPerUnit: string | null;
  moq: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  client: { id: number; name: string; brandName: string };
  project: { id: number; name: string };
}

const statusColors: Record<string, string> = {
  researching: "bg-muted text-muted-foreground",
  sampled: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  ordered: "bg-purple-100 text-purple-700",
  received: "bg-[#B7542E]/10 text-[#B7542E]",
};

const typeIcons: Record<string, any> = {
  fabric: Scissors,
  trim: Tag,
  label: Tag,
  thread: Package,
  zipper: Package,
  button: Package,
  other: Package,
};

export default function AdminSourcingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editMat, setEditMat] = useState<Material | null>(null);

  const { data: materials, isLoading } = useQuery<Material[]>({
    queryKey: ["/api/admin/styles"], // We reuse styles endpoint context
  });

  // Actually fetch materials from admin hours for now (we don't have a dedicated admin materials GET)
  // Let's use the styles with materials from the admin/styles endpoint
  const { data: allStyles } = useQuery<any[]>({
    queryKey: ["/api/admin/styles"],
  });

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const [form, setForm] = useState({
    projectId: "",
    styleId: "",
    type: "fabric",
    name: "",
    supplier: "",
    costPerUnit: "",
    moq: "",
    status: "researching",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    status: "researching",
    supplier: "",
    costPerUnit: "",
    moq: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/materials", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/styles"] });
      toast({ title: "Material added" });
      setAddOpen(false);
      setForm({ projectId: "", styleId: "", type: "fabric", name: "", supplier: "", costPerUnit: "", moq: "", status: "researching", notes: "" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/admin/materials/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/styles"] });
      toast({ title: "Material updated" });
      setEditMat(null);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  // Collect all materials from styles
  const allMaterials: Array<any> = [];
  (allStyles || []).forEach((style: any) => {
    if (style.materials) {
      style.materials.forEach((m: any) => {
        allMaterials.push({ ...m, styleName: style.name, client: style.client, project: style.project });
      });
    }
  });

  // Also get global materials (not linked to styles) — shown from a separate fetch
  const byStatus = (s: string) => allMaterials.filter((m) => m.status === s).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Sourcing Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage materials and suppliers across all clients</p>
        </div>
        <Button
          className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Material
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-5 gap-3">
        {["researching", "sampled", "approved", "ordered", "received"].map((s) => (
          <Card key={s} className="border shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{byStatus(s)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{s}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Materials list */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">All Materials ({allMaterials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allMaterials.map((mat) => {
              const TypeIcon = typeIcons[mat.type] || Package;
              return (
                <div
                  key={mat.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded bg-[#D9C9B6]/30 flex items-center justify-center flex-shrink-0">
                    <TypeIcon className="w-4 h-4 text-[#B7542E]/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{mat.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-muted-foreground">
                          <span className="capitalize">{mat.type}</span>
                          {mat.client && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <User className="w-3 h-3" /> {mat.client.brandName}
                              </span>
                            </>
                          )}
                          {mat.styleName && (
                            <>
                              <span>·</span>
                              <span>Style: {mat.styleName}</span>
                            </>
                          )}
                          {mat.supplier && (
                            <>
                              <span>·</span>
                              <span>{mat.supplier}</span>
                            </>
                          )}
                          {mat.costPerUnit && <span>· {mat.costPerUnit}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[mat.status] || ""}`}>
                          {mat.status.charAt(0).toUpperCase() + mat.status.slice(1)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditMat(mat);
                            setEditForm({
                              status: mat.status,
                              supplier: mat.supplier || "",
                              costPerUnit: mat.costPerUnit || "",
                              moq: mat.moq || "",
                              notes: mat.notes || "",
                            });
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {mat.notes && <p className="text-xs text-muted-foreground mt-1 italic">{mat.notes}</p>}
                  </div>
                </div>
              );
            })}
            {allMaterials.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No materials tracked yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Material Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Client Project</label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {(clients || []).map((c: any) => (
                    c.project && (
                      <SelectItem key={c.project.id} value={String(c.project.id)}>
                        {c.brandName}
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["fabric", "trim", "label", "thread", "zipper", "button", "other"].map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["researching", "sampled", "approved", "ordered", "received"].map((s) => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Material Name</label>
              <Input className="mt-1" placeholder="e.g. GOTS Organic Cotton Rib 2x2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Supplier</label>
              <Input className="mt-1" placeholder="Supplier name" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Cost/Unit</label>
                <Input className="mt-1" placeholder="e.g. $8.50/yd" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">MOQ</label>
                <Input className="mt-1" placeholder="e.g. 50 yards" value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input className="mt-1" placeholder="Any additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
              disabled={!form.projectId || !form.name || createMutation.isPending}
              onClick={() => createMutation.mutate(form)}
            >
              {createMutation.isPending ? "Adding..." : "Add Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Material Dialog */}
      <Dialog open={!!editMat} onOpenChange={(o) => { if (!o) setEditMat(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Material — {editMat?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["researching", "sampled", "approved", "ordered", "received"].map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Supplier</label>
              <Input className="mt-1" value={editForm.supplier} onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Cost/Unit</label>
                <Input className="mt-1" value={editForm.costPerUnit} onChange={(e) => setEditForm({ ...editForm, costPerUnit: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">MOQ</label>
                <Input className="mt-1" value={editForm.moq} onChange={(e) => setEditForm({ ...editForm, moq: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input className="mt-1" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMat(null)}>Cancel</Button>
            <Button
              className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
              disabled={updateMutation.isPending}
              onClick={() => editMat && updateMutation.mutate({ id: editMat.id, data: editForm })}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

