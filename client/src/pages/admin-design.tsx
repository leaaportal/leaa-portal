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
import { useToast } from "@/hooks/use-toast";
import { Shirt, Plus, User, Edit2, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";

interface StyleData {
  id: number;
  projectId: number;
  name: string;
  category: string;
  description: string | null;
  status: string;
  patternStatus: string;
  techPackUrl: string | null;
  createdAt: string;
  client: { id: number; name: string; brandName: string };
  project: { id: number; name: string };
}

const statusOptions = [
  { value: "concept", label: "Concept" },
  { value: "sketched", label: "Sketched" },
  { value: "tech_pack", label: "Tech Pack" },
  { value: "pattern", label: "Pattern" },
  { value: "sample", label: "Sample" },
  { value: "approved", label: "Approved" },
  { value: "production", label: "Production" },
];

const categoryOptions = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "outerwear", label: "Outerwear" },
  { value: "dress", label: "Dress" },
  { value: "accessory", label: "Accessory" },
  { value: "activewear", label: "Activewear" },
  { value: "other", label: "Other" },
];

const statusColors: Record<string, string> = {
  concept: "bg-muted text-muted-foreground",
  sketched: "bg-blue-100 text-blue-700",
  tech_pack: "bg-purple-100 text-purple-700",
  pattern: "bg-orange-100 text-orange-700",
  sample: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  production: "bg-[#B7542E]/10 text-[#B7542E]",
};

export default function AdminDesignPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editStyle, setEditStyle] = useState<StyleData | null>(null);

  const { data: styles, isLoading } = useQuery<StyleData[]>({
    queryKey: ["/api/admin/styles"],
  });

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const [form, setForm] = useState({
    projectId: "",
    name: "",
    category: "top",
    description: "",
    status: "concept",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    category: "top",
    description: "",
    status: "concept",
    patternStatus: "not_started",
    techPackUrl: "",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/styles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/styles"] });
      toast({ title: "Style created" });
      setAddOpen(false);
      setForm({ projectId: "", name: "", category: "top", description: "", status: "concept" });
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/admin/styles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/styles"] });
      toast({ title: "Style updated" });
      setEditStyle(null);
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const handleEdit = (style: StyleData) => {
    setEditStyle(style);
    setEditForm({
      name: style.name,
      category: style.category,
      description: style.description || "",
      status: style.status,
      patternStatus: style.patternStatus || "not_started",
      techPackUrl: style.techPackUrl || "",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  const stls = styles || [];
  const byStatus = (s: string) => stls.filter((st) => st.status === s).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Design Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage styles across all client projects</p>
        </div>
        <Button
          className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Style
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {statusOptions.map(({ value, label }) => (
          <Card key={value} className="border shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{byStatus(value)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Styles table */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">All Styles ({stls.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stls.map((style) => (
              <div
                key={style.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="w-10 h-12 rounded bg-[#D9C9B6]/30 flex items-center justify-center flex-shrink-0">
                  <Shirt className="w-5 h-5 text-[#B7542E]/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{style.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{style.category}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" /> {style.client.brandName}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[style.status] || ""}`}>
                  {statusOptions.find((s) => s.value === style.status)?.label || style.status}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(style)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            {stls.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Shirt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No styles yet. Add one to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Style Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Style</DialogTitle>
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
                        {c.brandName} — {c.project.name}
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Style Name</label>
              <Input
                className="mt-1"
                placeholder="e.g. Essential Tank"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Initial Status</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                className="mt-1"
                placeholder="Brief style description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
              disabled={!form.projectId || !form.name || createMutation.isPending}
              onClick={() => createMutation.mutate(form)}
            >
              {createMutation.isPending ? "Adding..." : "Add Style"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Style Dialog */}
      <Dialog open={!!editStyle} onOpenChange={(o) => { if (!o) setEditStyle(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Style — {editStyle?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                className="mt-1"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Pattern Status</label>
              <Select value={editForm.patternStatus} onValueChange={(v) => setEditForm({ ...editForm, patternStatus: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["not_started", "first_pattern", "fitting", "revised", "graded", "approved"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tech Pack URL</label>
              <Input
                className="mt-1"
                placeholder="https://..."
                value={editForm.techPackUrl}
                onChange={(e) => setEditForm({ ...editForm, techPackUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                className="mt-1"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStyle(null)}>Cancel</Button>
            <Button
              className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
              disabled={updateMutation.isPending}
              onClick={() => editStyle && updateMutation.mutate({ id: editStyle.id, data: editForm })}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

