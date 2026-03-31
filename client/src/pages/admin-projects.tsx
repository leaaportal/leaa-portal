import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminProjects() {
  const { toast } = useToast();
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);

  const { data: projects = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/projects"],
  });

  const toggleSubMilestone = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/sub-milestones/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/milestones/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      toast({ title: "Milestone updated" });
    },
  });

  const getMilestoneStatusColor = (status: string) => {
    if (status === "completed") return "border-green-500/40 text-green-600 bg-green-500/5";
    if (status === "in_progress") return "border-amber-500/40 text-amber-600 bg-amber-500/5";
    return "border-border text-muted-foreground";
  };

  const getProjectStatusColor = (status: string) => {
    if (status === "active") return "border-green-500/40 text-green-600 bg-green-500/5";
    if (status === "paused") return "border-amber-500/40 text-amber-600 bg-amber-500/5";
    return "border-border text-muted-foreground";
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-['Playfair_Display']">
          Project Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {projects.length} active project{projects.length !== 1 ? "s" : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-card border border-border/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="bg-card border border-border/50">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No projects found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((item: any) => {
            const isExpanded = expandedProject === item.project.id;

            return (
              <Card key={item.project.id} className="bg-card border border-border/50">
                <CardHeader className="pb-3">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() =>
                      setExpandedProject(isExpanded ? null : item.project.id)
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-[#B7542E]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-[#B7542E]">
                            {item.client.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{item.client.name}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{item.client.brandName}</span>
                      </div>
                      <CardTitle className="text-base">{item.project.name}</CardTitle>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getProjectStatusColor(item.project.status)}`}
                        >
                          {item.project.status}
                        </Badge>
                        <div className="flex items-center gap-2 flex-1 max-w-xs">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#B7542E] rounded-full"
                              style={{ width: `${item.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{item.overallProgress}%</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground ml-2 flex-shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 border-t border-border/30">
                    <div className="space-y-3 pt-3">
                      {item.milestones.map((milestone: any) => {
                        const isMilestoneExpanded = expandedMilestone === milestone.id;
                        const milestoneCompleted =
                          milestone.subMilestones?.filter((s: any) => s.status === "completed").length || 0;
                        const milestoneTotal = milestone.subMilestones?.length || 0;

                        return (
                          <div
                            key={milestone.id}
                            className="border border-border/40 rounded-lg overflow-hidden"
                          >
                            <div
                              className="flex items-center justify-between px-3 py-2.5 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                              onClick={() =>
                                setExpandedMilestone(isMilestoneExpanded ? null : milestone.id)
                              }
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getMilestoneStatusColor(milestone.status)}`}
                                >
                                  S{milestone.sessionNumber}
                                </Badge>
                                <span className="text-sm font-medium text-foreground">
                                  {milestone.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {milestoneCompleted}/{milestoneTotal}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={milestone.status}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateMilestone.mutate({
                                      id: milestone.id,
                                      status: e.target.value,
                                    });
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground cursor-pointer"
                                >
                                  <option value="not_started">Not Started</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                </select>
                                {isMilestoneExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                              </div>
                            </div>

                            {isMilestoneExpanded && milestone.subMilestones && (
                              <div className="px-3 py-2 space-y-1">
                                {milestone.subMilestones.map((sub: any) => {
                                  const isDone = sub.status === "completed";
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() =>
                                        toggleSubMilestone.mutate({
                                          id: sub.id,
                                          status: isDone ? "pending" : "completed",
                                        })
                                      }
                                      className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded hover:bg-muted/30 transition-colors group"
                                    >
                                      {isDone ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 group-hover:text-muted-foreground" />
                                      )}
                                      <span
                                        className={`text-sm ${
                                          isDone
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
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

