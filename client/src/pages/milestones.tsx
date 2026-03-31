import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  Circle,
  ChevronDown,
  ChevronUp,
  FileDown,
  Calendar,
  DollarSign,
  Timer,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface MilestoneData {
  id: number;
  sessionNumber: number;
  title: string;
  description: string;
  hours: number;
  cost: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  subMilestones: Array<{ id: number; title: string; status: string; order: number }>;
  deliverables: Array<{ id: number; title: string; fileUrl: string | null; uploadedAt: string | null }>;
}

const sessionDescriptions: Record<number, { phase: string; icon: string }> = {
  1: { phase: "Consultation & Planning", icon: "🎯" },
  2: { phase: "Execution Phase", icon: "📊" },
  3: { phase: "Feedback & Refinement", icon: "🎨" },
  4: { phase: "Final Presentation", icon: "📋" },
};

function StatusIcon({ status, size = "sm" }: { status: string; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  if (status === "completed") return <CheckCircle2 className={`${cls} text-green-600`} />;
  if (status === "in_progress") return <Clock className={`${cls} text-primary`} />;
  return <Circle className={`${cls} text-muted-foreground/30`} />;
}

function MilestoneCard({ milestone, index }: { milestone: MilestoneData; index: number }) {
  const [expanded, setExpanded] = useState(milestone.status === "in_progress");
  const completedSubs = milestone.subMilestones.filter((s) => s.status === "completed").length;
  const totalSubs = milestone.subMilestones.length;
  const progress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

  const isActive = milestone.status === "in_progress";
  const isCompleted = milestone.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card
        className={`border shadow-sm transition-all ${
          isActive
            ? "border-primary/30 bg-card ring-1 ring-primary/10"
            : isCompleted
            ? "border-green-200 dark:border-green-900/30"
            : "border-border/50 opacity-75"
        }`}
        data-testid={`milestone-card-${milestone.sessionNumber}`}
      >
        {/* Header */}
        <div
          className="flex items-start gap-4 p-5 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
          data-testid={`button-expand-session-${milestone.sessionNumber}`}
        >
          {/* Session number circle */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold ${
                isCompleted
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : milestone.sessionNumber}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Session {milestone.sessionNumber}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {sessionDescriptions[milestone.sessionNumber]?.phase}
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mt-1">
              {milestone.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {milestone.description}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="w-3.5 h-3.5" />
                <span>{milestone.hours} hrs</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                <span>${milestone.cost.toLocaleString()}</span>
              </div>
              {milestone.startedAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Started {format(parseISO(milestone.startedAt), "MMM d, yyyy")}</span>
                </div>
              )}
              {milestone.completedAt && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completed {format(parseISO(milestone.completedAt), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {(isActive || isCompleted) && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">
                    {completedSubs} of {totalSubs} steps
                  </span>
                  <span className={`font-semibold ${isCompleted ? "text-green-600" : "text-primary"}`}>
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>

          {/* Expand toggle */}
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Expandable content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* Sub-milestones */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Checkpoints
                    </h4>
                    <div className="space-y-2">
                      {milestone.subMilestones.map((sub) => (
                        <div
                          key={sub.id}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                            sub.status === "completed"
                              ? "bg-green-50 dark:bg-green-900/10"
                              : sub.status === "in_progress"
                              ? "bg-primary/5 border border-primary/15"
                              : "bg-muted/30"
                          }`}
                          data-testid={`sub-milestone-${sub.id}`}
                        >
                          <StatusIcon status={sub.status} />
                          <span
                            className={`${
                              sub.status === "completed"
                                ? "text-green-700 dark:text-green-400"
                                : sub.status === "in_progress"
                                ? "text-primary font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <FileDown className="w-3.5 h-3.5 text-primary" />
                      Deliverables
                    </h4>
                    {milestone.deliverables.length > 0 ? (
                      <div className="space-y-2">
                        {milestone.deliverables.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                            data-testid={`deliverable-${d.id}`}
                          >
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileDown className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {d.title}
                              </p>
                              {d.uploadedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Uploaded {format(parseISO(d.uploadedAt), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileDown className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">
                          {milestone.status === "not_started"
                            ? "Deliverables will appear once this session begins."
                            : "Deliverables coming soon."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function MilestonesPage() {
  const { data: projects } = useQuery<Array<{ id: number }>>({
    queryKey: ["/api/projects"],
  });

  const projectId = projects?.[0]?.id;

  const { data: milestones, isLoading } = useQuery<MilestoneData[]>({
    queryKey: ["/api/projects", projectId, "milestones"],
    enabled: !!projectId,
  });

  if (isLoading || !milestones) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  const totalSubs = milestones.reduce((s, m) => s + m.subMilestones.length, 0);
  const completedSubs = milestones.reduce(
    (s, m) => s + m.subMilestones.filter((sub) => sub.status === "completed").length,
    0
  );
  const overallProgress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

  const totalCost = milestones.reduce((s, m) => s + m.cost, 0);
  const totalHours = milestones.reduce((s, m) => s + m.hours, 0);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" data-testid="milestones-page">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">
          Concept Development Milestones
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          60-Day Intensive · {totalHours} Hours · ${totalCost.toLocaleString()} Total
        </p>
      </div>

      {/* Overall progress */}
      <Card className="border-primary/20 bg-gradient-to-r from-card to-primary/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">Overall Progress</p>
              <p className="text-xs text-muted-foreground">{completedSubs} of {totalSubs} total checkpoints completed</p>
            </div>
            <span className="text-3xl font-bold text-primary" data-testid="text-milestone-progress">
              {overallProgress}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />

          {/* Mini session indicators */}
          <div className="flex items-center gap-2 mt-4">
            {milestones.map((m) => (
              <div key={m.id} className="flex-1">
                <div
                  className={`h-1.5 rounded-full ${
                    m.status === "completed"
                      ? "bg-green-500"
                      : m.status === "in_progress"
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
                <p className="text-xs text-muted-foreground mt-1 text-center">S{m.sessionNumber}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline connector + Cards */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[1.75rem] top-0 bottom-0 w-px bg-border hidden md:block" />

        <div className="space-y-4">
          {milestones.map((m, i) => (
            <MilestoneCard key={m.id} milestone={m} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
