import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, Circle, Clock, FolderOpen, FileText } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminClientDetail({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const clientId = parseInt(params.id);

  const { data, isLoading, error } = useQuery<{
    user: any;
    project: any;
    milestones: any[];
    deliverables: any[];
  }>({
    queryKey: [`/api/admin/clients/${clientId}`],
  });

  const toggleSubMilestone = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/sub-milestones/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/clients/${clientId}`] });
    },
    onError: (e: any) => {
      toast({ title: "Error updating task", description: e.message, variant: "destructive" });
    },
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/milestones/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/clients/${clientId}`] });
      toast({ title: "Milestone updated" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <div className="h-8 w-32 bg-muted/30 rounded animate-pulse" />
        <div className="h-32 bg-card border border-border/50 rounded-xl animate-pulse" />
        <div className="h-64 bg-card border border-border/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Client not found</p>
        <Button variant="ghost" className="mt-3" onClick={() => navigate("/admin/clients")}>
          Back to Clients
        </Button>
      </div>
    );
  }

  const { user, project, milestones, deliverables } = data;

  // Calculate overall progress
  let totalSubs = 0;
  let completedSubs = 0;
  milestones.forEach((m: any) => {
    totalSubs += m.subMilestones?.length || 0;
    completedSubs += m.subMilestones?.filter((s: any) => s.status === "completed").length || 0;
  });
  const overallProgress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

  const getMilestoneStatusColor = (status: string) => {
    if (status === "completed") return "border-green-500/40 text-green-600 bg-green-500/5";
    if (status === "in_progress") return "border-amber-500/40 text-amber-600 bg-amber-500/5";
    return "border-border text-muted-foreground";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/clients")}
        className="text-muted-foreground hover:text-foreground -ml-1"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        All Clients
      </Button>

      {/* Client Header */}
      <Card className="bg-card border border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#B7542E]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-[#B7542E]">
                {user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-foreground font-['Playfair_Display']">
                    {user.name}
                  </h1>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                  <p className="text-sm font-medium text-[#B7542E] mt-0.5">{user.brandName}</p>
                </div>
                {project && (
                  <Badge
                    variant="outline"
                    className={`ml-4 ${
                      project.status === "active"
                        ? "border-green-500/40 text-green-600 bg-green-500/5"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {project.status}
                  </Badge>
                )}
              </div>

              {project && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1.5">{project.serviceType}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#B7542E] rounded-full transition-all"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">{overallProgress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {completedSubs} of {totalSubs} tasks completed
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No project */}
      {!project && (
        <Card className="bg-card border border-border/50">
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No project created yet</p>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground font-['Playfair_Display']">
            Sessions & Milestones
          </h2>
          {milestones.map((milestone: any) => (
            <Card key={milestone.id} className="bg-card border border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Session {milestone.sessionNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getMilestoneStatusColor(milestone.status)}`}
                      >
                        {milestone.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-semibold">{milestone.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {milestone.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Select
                      value={milestone.status}
                      onValueChange={(val) =>
                        updateMilestone.mutate({ id: milestone.id, status: val })
                      }
                    >
                      <select
                        value={milestone.status}
                        onChange={(e) =>
                          updateMilestone.mutate({ id: milestone.id, status: e.target.value })
                        }
                        className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground cursor-pointer"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {/* Sub-milestones */}
                {milestone.subMilestones && milestone.subMilestones.length > 0 && (
                  <div className="space-y-1.5">
                    {milestone.subMilestones.map((sub: any) => {
                      const isCompleted = sub.status === "completed";
                      return (
                        <button
                          key={sub.id}
                          onClick={() =>
                            toggleSubMilestone.mutate({
                              id: sub.id,
                              status: isCompleted ? "pending" : "completed",
                            })
                          }
                          className="flex items-center gap-2.5 w-full text-left py-1.5 px-2 rounded hover:bg-muted/30 transition-colors group"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 group-hover:text-muted-foreground transition-colors" />
                          )}
                          <span
                            className={`text-sm ${
                              isCompleted
                                ? "line-through text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {sub.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Deliverables for this milestone */}
                {milestone.deliverables && milestone.deliverables.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Deliverables
                    </p>
                    <div className="space-y-1.5">
                      {milestone.deliverables.map((deliv: any) => (
                        <div
                          key={deliv.id}
                          className="flex items-center gap-2 py-1 px-2 rounded bg-muted/20"
                        >
                          <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground flex-1 truncate">
                            {deliv.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs flex-shrink-0 ${
                              deliv.fileStatus === "final"
                                ? "border-green-500/40 text-green-600"
                                : deliv.fileStatus === "approved"
                                ? "border-blue-500/40 text-blue-600"
                                : deliv.fileStatus === "under_review"
                                ? "border-amber-500/40 text-amber-600"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {deliv.fileStatus?.replace("_", " ") || "draft"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

