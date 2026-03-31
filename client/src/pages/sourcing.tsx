import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Scissors,
  Tag,
  Search,
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

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
  swatchUrl: string | null;
  notes: string | null;
  createdAt: string;
}

interface StyleData {
  id: number;
  name: string;
  category: string;
  status: string;
  materials: Material[];
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
  researching: { label: "Researching", color: "bg-muted text-muted-foreground", icon: Search },
  sampled: { label: "Sampled", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  ordered: { label: "Ordered", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: ArrowRight },
  received: { label: "Received", color: "bg-[#B7542E]/10 text-[#B7542E]", icon: CheckCircle2 },
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

const typeColors: Record<string, string> = {
  fabric: "text-[#B7542E]",
  trim: "text-blue-600",
  label: "text-purple-600",
  thread: "text-green-600",
  zipper: "text-orange-600",
  button: "text-yellow-600",
  other: "text-muted-foreground",
};

function MaterialRow({ material, index }: { material: Material; index: number }) {
  const cfg = statusConfig[material.status] || statusConfig.researching;
  const StatusIcon = cfg.icon;
  const TypeIcon = typeIcons[material.type] || Package;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors border border-border/30"
    >
      <div className="w-10 h-10 rounded-lg bg-[#D9C9B6]/30 flex items-center justify-center flex-shrink-0">
        <TypeIcon className={`w-5 h-5 ${typeColors[material.type]}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {material.type}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">{material.name}</p>
            {material.supplier && (
              <p className="text-xs text-muted-foreground">Supplier: {material.supplier}</p>
            )}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {material.costPerUnit && (
                <span className="text-xs text-muted-foreground">{material.costPerUnit}</span>
              )}
              {material.moq && (
                <span className="text-xs text-muted-foreground">MOQ: {material.moq}</span>
              )}
            </div>
            {material.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">{material.notes}</p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.color}`}>
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function SourcingPage() {
  const { data: projects } = useQuery<Array<{ id: number }>>({
    queryKey: ["/api/projects"],
  });
  const projectId = projects?.[0]?.id;

  const { data: materials, isLoading: matsLoading } = useQuery<Material[]>({
    queryKey: ["/api/projects", projectId, "materials"],
    enabled: !!projectId,
  });

  const { data: styles, isLoading: stylesLoading } = useQuery<StyleData[]>({
    queryKey: ["/api/projects", projectId, "styles"],
    enabled: !!projectId,
  });

  const isLoading = matsLoading || stylesLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-56" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  const mats = materials || [];
  const stls = styles || [];

  const byStatus = (s: string) => mats.filter((m) => m.status === s).length;
  const fabrics = mats.filter((m) => m.type === "fabric");
  const trims = mats.filter((m) => m.type !== "fabric");

  // Find styles with cost sheets
  const stylesWithCosts = stls.filter((s) => s.costSheet);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" data-testid="sourcing-page">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Materials & Sourcing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fabric selections, trims, and supplier tracking for your collection
        </p>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <Card key={key} className="border shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-foreground">{byStatus(key)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Materials ({mats.length})</TabsTrigger>
          <TabsTrigger value="fabrics">Fabrics ({fabrics.length})</TabsTrigger>
          <TabsTrigger value="trims">Trims & Labels ({trims.length})</TabsTrigger>
          {stylesWithCosts.length > 0 && (
            <TabsTrigger value="costs">Cost Sheets ({stylesWithCosts.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {mats.length > 0 ? (
            mats.map((mat, i) => <MaterialRow key={mat.id} material={mat} index={i} />)
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        <TabsContent value="fabrics" className="space-y-3 mt-4">
          {fabrics.length > 0 ? (
            fabrics.map((mat, i) => <MaterialRow key={mat.id} material={mat} index={i} />)
          ) : (
            <EmptyState message="No fabrics tracked yet." />
          )}
        </TabsContent>

        <TabsContent value="trims" className="space-y-3 mt-4">
          {trims.length > 0 ? (
            trims.map((mat, i) => <MaterialRow key={mat.id} material={mat} index={i} />)
          ) : (
            <EmptyState message="No trims or labels tracked yet." />
          )}
        </TabsContent>

        {stylesWithCosts.length > 0 && (
          <TabsContent value="costs" className="space-y-4 mt-4">
            {stylesWithCosts.map((style) => (
              <Card key={style.id} className="border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{style.name}</CardTitle>
                    <span className="text-xs text-muted-foreground capitalize">{style.category}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {style.costSheet && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Fabric", value: style.costSheet.fabricCost },
                          { label: "Trim", value: style.costSheet.trimCost },
                          { label: "Labor", value: style.costSheet.laborCost },
                          { label: "Other", value: style.costSheet.otherCost },
                        ].map(({ label, value }) => (
                          <div key={label} className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="text-sm font-semibold mt-0.5">
                              {value != null ? `$${value.toFixed(2)}` : "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 rounded-lg bg-[#D9C9B6]/20 border border-[#D9C9B6]/40 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Cost/Unit</p>
                          <p className="text-lg font-bold text-foreground">
                            {style.costSheet.totalCostPerUnit != null
                              ? `$${style.costSheet.totalCostPerUnit.toFixed(2)}`
                              : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Suggested Retail</p>
                          <p className="text-lg font-bold text-foreground">
                            {style.costSheet.suggestedRetail != null
                              ? `$${style.costSheet.suggestedRetail.toFixed(2)}`
                              : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Margin</p>
                          <p className="text-lg font-bold text-green-600">
                            {style.costSheet.margin != null
                              ? `${style.costSheet.margin.toFixed(1)}%`
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function EmptyState({ message = "No materials tracked yet." }: { message?: string }) {
  return (
    <Card className="border border-dashed">
      <CardContent className="py-14 text-center">
        <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your LEAA team will track materials as sourcing progresses.
        </p>
      </CardContent>
    </Card>
  );
}

