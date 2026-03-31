import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Plus,
  Lock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import { formatDistanceToNow, isPast, isToday } from "date-fns";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "border-red-500/40 text-red-600 bg-red-500/10",
  high: "border-orange-500/40 text-orange-600 bg-orange-500/10",
  normal: "border-blue-500/40 text-blue-600 bg-blue-500/10",
  low: "border-border text-muted-foreground bg-muted/20",
};

const ASSIGNEE_COLORS: Record<string, string> = {
  brandon: "bg-blue-500/15 text-blue-700",
  dale: "bg-green-500/15 text-green-700",
  both: "bg-purple-500/15 text-purple-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  session_prep: "Session Prep",
  deliverable: "Deliverable",
  follow_up: "Follow-Up",
  legal: "Legal",
  billing: "Billing",
  sourcing: "Sourcing",
  design: "Design",
  admin: "Admin",
};

const COLUMNS = [
  { id: "todo", label: "To Do", color: "border-slate-300" },
  { id: "in_progress", label: "In Progress", color: "border-blue-400" },
  { id: "blocked", label: "Blocked", color: "border-red-400" },
  { id: "done", label: "Done", color: "border-green-400" },
];

function TaskCard({
  task,
  onStatusChange,
}: {
  task: any;
  onStatusChange: (id: number, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(task.notes || "");
  const { toast } = useToast();

  const updateTask = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/tasks/${task.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
    },
  });

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate + "T23:59:59")) && task.status !== "done";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  return (
    <div className={`bg-card rounded-lg border border-border/50 p-3 mb-2 shadow-sm ${
      task.status === "blocked" ? "border-l-2 border-l-red-500" : ""
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {task.complianceGate && (
              <Lock className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            )}
            <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
          </div>
          {task.clientName && (
            <p className="text-xs text-muted-foreground mb-1.5">{task.clientName}</p>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className={`text-xs px-1.5 py-0 ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </Badge>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ASSIGNEE_COLORS[task.assignedTo]}`}>
              {task.assignedTo === "both" ? "Brandon & Dale" : task.assignedTo.charAt(0).toUpperCase() + task.assignedTo.slice(1)}
            </span>
            <Badge variant="outline" className="text-xs px-1.5 py-0 border-border text-muted-foreground">
              {CATEGORY_LABELS[task.category] || task.category}
            </Badge>
          </div>
          {task.dueDate && (
            <p className={`text-xs mt-1.5 font-medium ${
              isOverdue ? "text-red-600" : isDueToday ? "text-amber-600" : "text-muted-foreground"
            }`}>
              {isOverdue ? "⚠ OVERDUE · " : isDueToday ? "Today · " : "Due "}
              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          )}
          {task.complianceGate && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Gate: {task.complianceGate}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 flex-shrink-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/40 space-y-3">
          {task.description && (
            <p className="text-xs text-muted-foreground">{task.description}</p>
          )}
          <div>
            <Label className="text-xs mb-1 block text-muted-foreground">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
              placeholder="Add internal notes..."
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={task.status}
              onValueChange={(v) => {
                updateTask.mutate({ status: v, notes });
                onStatusChange(task.id, v);
              }}
            >
              <SelectTrigger className="h-7 text-xs flex-1 min-w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => updateTask.mutate({ notes })}
              disabled={updateTask.isPending}
            >
              Save
            </Button>
            {task.status !== "done" && (
              <Button
                size="sm"
                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={() => updateTask.mutate({ status: "done", notes })}
                disabled={updateTask.isPending}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTasks() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterClient, setFilterClient] = useState("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "brandon",
    priority: "normal",
    category: "admin",
    dueDate: "",
    complianceGate: "",
    notes: "",
    projectId: "",
  });

  const params = new URLSearchParams();
  if (filterAssignee !== "all") params.set("assignedTo", filterAssignee);
  if (filterCategory !== "all") params.set("category", filterCategory);

  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/tasks", filterAssignee, filterCategory, filterClient],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/tasks?${params.toString()}`);
      return res.json();
    },
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const createTask = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      setShowAdd(false);
      setForm({ title: "", description: "", assignedTo: "brandon", priority: "normal", category: "admin", dueDate: "", complianceGate: "", notes: "", projectId: "" });
      toast({ title: "Task created" });
    },
  });

  const handleStatusChange = (id: number, status: string) => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
  };

  const filteredTasks = tasks.filter((t: any) => {
    if (filterClient !== "all" && t.clientName !== filterClient) return false;
    return true;
  });

  const getColumnTasks = (colId: string) =>
    filteredTasks.filter((t: any) => t.status === colId);

  const overdueCount = tasks.filter((t: any) => {
    if (!t.dueDate || t.status === "done") return false;
    return isPast(new Date(t.dueDate + "T23:59:59"));
  }).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Playfair_Display']">
            Admin Task Board
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {overdueCount > 0 && (
              <span className="text-red-600 font-semibold mr-2">⚠ {overdueCount} overdue</span>
            )}
            {tasks.filter((t: any) => t.status !== "done").length} active tasks
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="bg-[#B7542E] hover:bg-[#a3472a] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="brandon">Brandon</SelectItem>
            <SelectItem value="dale">Dale</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c: any) => (
              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="space-y-2">
              <div className="h-8 bg-muted/30 rounded animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted/20 rounded-lg animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className="flex flex-col min-h-[200px]">
                <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${col.color}`}>
                  <span className="text-sm font-semibold text-foreground">{col.label}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                    {colTasks.length}
                  </span>
                </div>
                <div className="flex-1">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground/50">
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((task: any) => (
                      <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Playfair_Display']">Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Task title..."
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional details..."
                className="min-h-[70px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Assigned To</Label>
                <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brandon">Brandon</SelectItem>
                    <SelectItem value="dale">Dale</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Optional — link to client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No client</SelectItem>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={c.project?.id?.toString() || ""}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Compliance Gate</Label>
              <Input
                value={form.complianceGate}
                onChange={(e) => setForm({ ...form, complianceGate: e.target.value })}
                placeholder="e.g. NDA must be signed (optional)"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              className="bg-[#B7542E] hover:bg-[#a3472a] text-white"
              onClick={() =>
                createTask.mutate({
                  title: form.title,
                  description: form.description || null,
                  assignedTo: form.assignedTo,
                  priority: form.priority,
                  category: form.category,
                  dueDate: form.dueDate || null,
                  complianceGate: form.complianceGate || null,
                  notes: form.notes || null,
                  projectId: form.projectId ? parseInt(form.projectId) : null,
                })
              }
              disabled={createTask.isPending || !form.title}
            >
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

