import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shirt,
  ChevronDown,
  ChevronUp,
  FileText,
  Package,
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface StyleData {
  id: number;
  projectId: number;
  name: string;
  category: string;
  description: string | null;
  status: string;
  imageUrl: string | null;
  techPackUrl: string | null;
  patternStatus: string;
  createdAt: string;
  materials: Array<{
    id: number;
    type: string;
    name: string;
    supplier: string | null;
    costPerUnit: string | null;
    moq: string | null;
    status: string;
    notes: string | null;
  }>;
  costSheet: {
    fabricCost: number | null;
    trimCost: number | null;
    laborCost: number | null;
    otherCost: number | null;
    totalCostPerUnit: number | null;
    suggestedRetail: number | null;
    margin: number | null;
    updatedAt: string;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  concept: { label: "Concept", color: "bg-muted text-muted-foreground", icon: Circle },
  sketched: { label: "Sketched", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  tech_pack: { label: "Tech Pack", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: FileText },
  pattern: { label: "Pattern", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: Package },
  sample: { label: "Sample", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  production: { label: "Production", color: "bg-[#B7542E]/10 text-[#B7542E]", icon: CheckCircle2 },
};

const patternStatusConfig: Record<string, { label: string; color: string }> = {
  not_started: { label: "Not Started", color: "text-muted-foreground" },
  first_pattern: { label: "First Pattern", color: "text-blue-600" },
  fitting: { label: "Fitting", color: "text-orange-600" },
  revised: { label: "Revised", color: "text-purple-600" },
  graded: { label: "Graded", color: "text-yellow-600" },
  approved: { label: "Approved", color: "text-green-600" },
};

const categoryLabels: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  dress: "Dress",
  accessory: "Accessory",
  activewear: "Activewear",
  other: "Other",
};

const materialStatusConfig: Record<string, string> = {
  researching: "bg-muted text-muted-foreground",
  sampled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ordered: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  received: "bg-[#B7542E]/10 text-[#B7542E]",
};

const developmentSteps = ["concept", "sketched", "tech_pack", "pattern", "sample", "approved", "production"];

function StyleProgressBar({ status }: { status: string }) {
  const currentIndex = developmentSteps.indexOf(status);
  const progress = ((currentIndex + 1) / developmentSteps.length) * 100;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
        <span>Development Progress</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#B7542E] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        {developmentSteps.map((step, i) => (
          <div
            key={step}
            className={`text-[9px] uppercase tracking-wide ${
              i <= currentIndex ? "text-[#B7542E] font-semibold" : "text-muted-foreground/40"
            }`}
          >
            {step.replace("_", " ")}
          </div>
        ))}
      </div>
    </div>
  );
}

function StyleCard({ style, index }: { style: StyleData; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[style.status] || statusConfig.concept;
  const StatusIcon = cfg.icon;
  const patternCfg = patternStatusConfig[style.patternStatus] || patternStatusConfig.not_started;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="border shadow-sm overflow-hidden">
        <div
          className="p-5 cursor-pointer select-none flex items-start gap-4"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Style thumbnail placeholder */}
          <div className="w-16 h-20 rounded-lg bg-[#D9C9B6]/30 flex items-center justify-center flex-shrink-0 border border-[#D9C9B6]/50">
            <Shirt className="w-7 h-7 text-[#B7542E]/40" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    {categoryLabels[style.category] || style.category}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{style.name}</h3>
                {style.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{style.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {cfg.label}
                </span>
                {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>

            <StyleProgressBar status={style.status} />
          </div>
        </div>

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
                <Tabs defaultValue="details" className="mt-4">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="materials">Materials ({style.materials.length})</TabsTrigger>
                    {style.costSheet && <TabsTrigger value="cost">Cost Sheet</TabsTrigger>}
                  </TabsList>

                  <TabsContent value="details">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pattern Status</p>
                          <p className={`text-sm font-medium ${patternCfg.color}`}>{patternCfg.label}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tech Pack</p>
                          {style.techPackUrl ? (
                            <a
                              href={style.techPackUrl}
                              className="text-sm font-medium text-primary flex items-center gap-1 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Tech Pack <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <p className="text-sm text-muted-foreground">Not yet created</p>
                          )}
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Added</p>
                          <p className="text-sm font-medium">{format(parseISO(style.createdAt), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#D9C9B6]/20 border border-[#D9C9B6]/40 flex flex-col items-center justify-center min-h-[120px]">
                        <Shirt className="w-12 h-12 text-[#B7542E]/30 mb-2" />
                        <p className="text-xs text-muted-foreground text-center">Flat sketch will appear<br />once uploaded by LEAA</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="materials">
                    {style.materials.length > 0 ? (
                      <div className="space-y-2">
                        {style.materials.map((mat) => (
                          <div key={mat.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/30">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">{mat.type}</span>
                              </div>
                              <p className="text-sm font-medium text-foreground">{mat.name}</p>
                              {mat.supplier && <p className="text-xs text-muted-foreground">Supplier: {mat.supplier}</p>}
                              {mat.costPerUnit && <p className="text-xs text-muted-foreground">Cost: {mat.costPerUnit} · MOQ: {mat.moq}</p>}
                              {mat.notes && <p className="text-xs text-muted-foreground mt-1 italic">{mat.notes}</p>}
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${materialStatusConfig[mat.status]}`}>
                              {mat.status.charAt(0).toUpperCase() + mat.status.slice(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No materials assigned to this style yet.</p>
                      </div>
                    )}
                  </TabsContent>

                  {style.costSheet && (
                    <TabsContent value="cost">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Fabric Cost", value: style.costSheet.fabricCost, unit: "/unit" },
                          { label: "Trim Cost", value: style.costSheet.trimCost, unit: "/unit" },
                          { label: "Labor Cost", value: style.costSheet.laborCost, unit: "/unit" },
                          { label: "Other Costs", value: style.costSheet.otherCost, unit: "/unit" },
                        ].map(({ label, value, unit }) => (
                          <div key={label} className="p-3 rounded-lg bg-muted/30">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                            <p className="text-sm font-semibold">{value != null ? `$${value.toFixed(2)}${unit}` : "—"}</p>
                          </div>
                        ))}
                        <div className="p-3 rounded-lg bg-[#D9C9B6]/30 border border-[#D9C9B6]/50 col-span-2 grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Cost/Unit</p>
                            <p className="text-base font-bold text-foreground">
                              {style.costSheet.totalCostPerUnit != null ? `$${style.costSheet.totalCostPerUnit.toFixed(2)}` : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Suggested Retail</p>
                            <p className="text-base font-bold text-foreground">
                              {style.costSheet.suggestedRetail != null ? `$${style.costSheet.suggestedRetail.toFixed(2)}` : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Margin</p>
                            <p className="text-base font-bold text-green-600">
                              {style.costSheet.margin != null ? `${style.costSheet.margin.toFixed(1)}%` : "—"}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground col-span-2">
                          Last updated: {format(parseISO(style.costSheet.updatedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function DesignBoardPage() {
  const { data: projects } = useQuery<Array<{ id: number }>>({
    queryKey: ["/api/projects"],
  });
  const projectId = projects?.[0]?.id;

  const { data: styles, isLoading } = useQuery<StyleData[]>({
    queryKey: ["/api/projects", projectId, "styles"],
    enabled: !!projectId,
  });

  if (isLoading || !styles) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
      </div>
    );
  }

  const byStatus = (s: string) => styles.filter((st) => st.status === s).length;
  const inProgress = styles.filter((st) => st.status !== "concept" && st.status !== "production").length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" data-testid="design-board-page">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Design Board</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your collection — styles, sketches, and tech packs
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Styles", value: styles.length, color: "text-foreground" },
          { label: "In Development", value: inProgress, color: "text-[#B7542E]" },
          { label: "Approved", value: byStatus("approved") + byStatus("production"), color: "text-green-600" },
          { label: "Concepts", value: byStatus("concept"), color: "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Style cards */}
      {styles.length > 0 ? (
        <div className="space-y-4">
          {styles.map((style, i) => (
            <StyleCard key={style.id} style={style} index={i} />
          ))}
        </div>
      ) : (
        <Card className="border border-dashed">
          <CardContent className="py-16 text-center">
            <Shirt className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">No styles yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your LEAA team will add styles to your design board as development progresses.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

