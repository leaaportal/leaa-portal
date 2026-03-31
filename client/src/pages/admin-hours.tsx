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
import { Timer, Plus, User, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";

interface HourLog {
  id: number;
  projectId: number;
  milestoneId: number | null;
  hours: number;
  description: string;
  date: string;
  loggedBy: string;
  client: { id: number; name: string; brandName: string };
  project: { id: number; name: string };
}

export default function AdminHoursPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    milestoneId: "",
    hours: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const { data: logs, isLoading } = useQuery<HourLog[]>({
    queryKey: ["/api/admin/hours"],
  });

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/hours", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hours"] });
      toast({ title: "Hours logged" });
      setAddOpen(false);
      setForm({ projectId: "", milestoneId: "", hours: "", description: "", date: new Date().toISOString().slice(0, 10) });
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

  const allLogs = logs || [];
  const totalHours = allLogs.reduce((sum, l) => sum + l.hours, 0);
  const programTotal = 36;

  // Group by client
  const byClient: Record<string, { client: any; logs: HourLog[]; totalHours: number }> = {};
  allLogs.forEach((log) => {
    const key = String(log.client?.id || "unknown");
    if (!byClient[key]) {
      byClient[key] = { client: log.client, logs: [], totalHours: 0 };
    }
    byClient[key].logs.push(log);
    byClient[key].totalHours += log.hours;
  });

  // Get milestones for selected project
  const selectedClient = (clients || []).find((c: any) => c.project && String(c.project.id) === form.projectId);
  const clientMilestones: any[] = []; // We'll rely on the client knowing their milestone IDs

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Hour Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Log billable hours across client sessions</p>
        </div>
        <Button
          className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Log Hours
        </Button>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalHours.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Hours Logged</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#B7542E]">{allLogs.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Log Entries</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{Object.keys(byClient).length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Clients with Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-client summaries */}
      {Object.values(byClient).map(({ client, logs: clientLogs, totalHours: clientTotal }) => (
        <Card key={client?.id} className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {client?.brandName || "Unknown"} — {client?.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-[#B7542E]">{clientTotal.toFixed(1)} hrs</span>
                <span className="text-muted-foreground">/ {programTotal} hrs</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-2">
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#B7542E] transition-all"
                  style={{ width: `${Math.min((clientTotal / programTotal) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {clientLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 px-3 py-2 rounded-md bg-muted/20 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{log.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(parseISO(log.date), "MMM d, yyyy")} · Logged by {log.loggedBy}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#B7542E] flex-shrink-0">
                    {log.hours}h
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {allLogs.length === 0 && (
        <Card className="border border-dashed">
          <CardContent className="py-14 text-center">
            <Timer className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No hours logged yet. Start tracking time!</p>
          </CardContent>
        </Card>
      )}

      {/* Log Hours Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Hours</DialogTitle>
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
                        {c.brandName} — {c.name}
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Hours</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  className="mt-1"
                  placeholder="e.g. 2.0"
                  value={form.hours}
                  onChange={(e) => setForm({ ...form, hours: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  className="mt-1"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                className="mt-1"
                placeholder="What was worked on during this session?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
              disabled={!form.projectId || !form.hours || !form.description || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  projectId: form.projectId,
                  milestoneId: form.milestoneId || null,
                  hours: form.hours,
                  description: form.description,
                  date: form.date,
                })
              }
            >
              {createMutation.isPending ? "Logging..." : "Log Hours"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

