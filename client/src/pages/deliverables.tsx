import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileDown, FileText, CheckCircle2, Clock, Circle,
  Search, List, LayoutGrid, GitBranch, AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface DeliverableItem {
  id: number;
  title: string;
  fileUrl: string | null;
  uploadedAt: string | null;
  fileStatus: string | null;
  version: number | null;
  milestoneId: number;
}

interface DeliverableGroup {
  milestone: {
    id: number;
    sessionNumber: number;
    title: string;
    status: string;
  };
  deliverables: DeliverableItem[];
}

const fileStatusConfig: Record<string, { label: string; className: string; icon: any }> = {
  draft: { label: "Draft", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  under_review: { label: "Under Review", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: AlertCircle },
  approved: { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  final: { label: "Final", className: "bg-primary/10 text-primary", icon: CheckCircle2 },
};

function FileStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const config = fileStatusConfig[status] || fileStatusConfig.draft;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function VersionBadge({ version }: { version: number | null }) {
  if (!version || version <= 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono bg-muted text-muted-foreground">
      <GitBranch className="w-3 h-3" />
      v{version}
    </span>
  );
}

function MilestoneStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    in_progress: "bg-primary/10 text-primary",
    not_started: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    completed: "Complete",
    in_progress: "In Progress",
    not_started: "Upcoming",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function DeliverablesPage() {
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects } = useQuery<Array<{ id: number }>>({
    queryKey: ["/api/projects"],
  });

  const projectId = projects?.[0]?.id;

  const { data: groups, isLoading } = useQuery<DeliverableGroup[]>({
    queryKey: ["/api/projects", projectId, "deliverables"],
    enabled: !!projectId,
  });

  if (isLoading || !groups) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  const totalFiles = groups.reduce((s, g) => s + g.deliverables.length, 0);

  // Flatten all deliverables for flat view and search
  const allDeliverables = groups.flatMap((g) =>
    g.deliverables.map((d) => ({
      ...d,
      sessionNumber: g.milestone.sessionNumber,
      sessionTitle: g.milestone.title,
      milestoneStatus: g.milestone.status,
    }))
  );

  const filtered = searchQuery.trim()
    ? allDeliverables.filter((d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allDeliverables;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" data-testid="deliverables-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Deliverables</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalFiles} file{totalFiles !== 1 ? "s" : ""} available across {groups.length} sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grouped" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grouped")}
            data-testid="button-view-grouped"
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1" />
            By Session
          </Button>
          <Button
            variant={viewMode === "flat" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("flat")}
            data-testid="button-view-flat"
          >
            <List className="w-3.5 h-3.5 mr-1" />
            All Files
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search deliverables..."
          className="pl-9"
          data-testid="input-search-deliverables"
        />
      </div>

      {viewMode === "grouped" && !searchQuery.trim() ? (
        /* Grouped view */
        <div className="space-y-4">
          {groups.map((group, i) => (
            <motion.div
              key={group.milestone.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                        group.milestone.status === "completed"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : group.milestone.status === "in_progress"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {group.milestone.sessionNumber}
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">
                          Session {group.milestone.sessionNumber}: {group.milestone.title}
                        </CardTitle>
                      </div>
                    </div>
                    <MilestoneStatusBadge status={group.milestone.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  {group.deliverables.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.deliverables.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-primary/20 hover:bg-primary/5 transition-all group"
                          data-testid={`deliverable-item-${d.id}`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {d.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {d.uploadedAt && (
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(d.uploadedAt), "MMM d, yyyy")}
                                </span>
                              )}
                              <FileStatusBadge status={d.fileStatus} />
                              <VersionBadge version={d.version} />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <FileDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" />
                            <Link href={`/support?category=revision&subject=${encodeURIComponent("Revision: " + d.title)}`}>
                              <button className="text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap" data-testid={`button-revision-${d.id}`}>
                                Request Revision
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileDown className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">
                        {group.milestone.status === "not_started"
                          ? "Deliverables will be available once this session begins."
                          : "Deliverables are being prepared."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Flat / search view */
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No deliverables match your search.</p>
            </div>
          ) : (
            filtered.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-border/50 shadow-sm" data-testid={`deliverable-flat-${d.id}`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          Session {d.sessionNumber}: {d.sessionTitle}
                        </span>
                        {d.uploadedAt && (
                          <span className="text-xs text-muted-foreground">
                            · {format(parseISO(d.uploadedAt), "MMM d")}
                          </span>
                        )}
                        <FileStatusBadge status={d.fileStatus} />
                        <VersionBadge version={d.version} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Link href={`/support?category=revision&subject=${encodeURIComponent("Revision: " + d.title)}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7" data-testid={`button-revision-flat-${d.id}`}>
                          Request Revision
                        </Button>
                      </Link>
                      <FileDown className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
