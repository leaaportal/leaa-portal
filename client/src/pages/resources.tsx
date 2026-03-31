import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Compass, BookOpen, Lightbulb, Users, Palette, PenTool,
  HelpCircle, FileText, Scissors, Image, Library,
} from "lucide-react";
import { motion } from "framer-motion";

interface Resource {
  id: number;
  title: string;
  description: string;
  category: string;
  iconName: string;
  order: number;
}

const iconMap: Record<string, any> = {
  Compass, BookOpen, Lightbulb, Users, Palette, PenTool,
  HelpCircle, FileText, Scissors, Image,
};

const categoryLabels: Record<string, string> = {
  getting_started: "Getting Started",
  session_prep: "Session Prep Guides",
  faq: "FAQs",
  brand_resources: "Brand Resources",
};

const categoryDescriptions: Record<string, string> = {
  getting_started: "Welcome guides and portal orientation",
  session_prep: "What to prepare before each session",
  faq: "Common questions about process, timelines & deliverables",
  brand_resources: "Style guides, templates & industry knowledge",
};

const categoryIcons: Record<string, any> = {
  getting_started: Compass,
  session_prep: BookOpen,
  faq: HelpCircle,
  brand_resources: Palette,
};

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data: resources, isLoading } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  if (isLoading || !resources) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-36" />)}
        </div>
      </div>
    );
  }

  // Group by category
  const categories = ["getting_started", "session_prep", "faq", "brand_resources"];
  const grouped = categories.reduce<Record<string, Resource[]>>((acc, cat) => {
    acc[cat] = resources.filter((r) => r.category === cat);
    return acc;
  }, {});

  const filteredCategories = activeCategory === "all" ? categories : [activeCategory];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" data-testid="resources-page">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Guides, FAQs, and reference materials to help you get the most from your program
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory("all")}
          data-testid="filter-all-resources"
        >
          All
        </Button>
        {categories.map((cat) => {
          const CatIcon = categoryIcons[cat];
          return (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              data-testid={`filter-${cat}`}
            >
              <CatIcon className="w-3.5 h-3.5 mr-1" />
              {categoryLabels[cat]}
            </Button>
          );
        })}
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {filteredCategories.map((cat) => {
          const items = grouped[cat] || [];
          if (items.length === 0) return null;
          const SectionIcon = categoryIcons[cat];
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <SectionIcon className="w-4 h-4 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {categoryLabels[cat]}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{categoryDescriptions[cat]}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((resource, i) => {
                  const Icon = iconMap[resource.iconName] || FileText;
                  return (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className="border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer h-full"
                        data-testid={`resource-card-${resource.id}`}
                      >
                        <CardContent className="p-4 flex gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground leading-snug">
                              {resource.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                              {resource.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
