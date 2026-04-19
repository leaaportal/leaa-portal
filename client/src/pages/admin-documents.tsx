/**
 * LEAA Portal — Admin Documents Page
 * Replaces: client/src/pages/admin-documents.tsx
 *
 * Three tabs:
 *  1. Sent Documents  — table of all docs sent to clients
 *  2. Master Templates — card grid with full-screen editor
 *  3. Send Document   — step-by-step wizard to send a template to a client
 */

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// ─── Brand tokens ────────────────────────────────────────────────────────────
const BRAND = {
  charcoal: "#2D2F36",
  sand: "#D9C9B6",
  ivory: "#F7F4EF",
  terracotta: "#B7542E",
};

// ─── Category options ─────────────────────────────────────────────────────────
const CATEGORIES: { value: string; label: string }[] = [
  { value: "nda", label: "Mutual NDA" },
  { value: "service_agreement", label: "Service Agreement" },
  { value: "mutual_release", label: "Mutual Release" },
  { value: "phase_signoff", label: "Phase Sign-Off" },
  { value: "ip_assignment", label: "IP Assignment" },
  { value: "portfolio_release", label: "Portfolio Release" },
  { value: "contractor_agreement", label: "Contractor Agreement" },
  { value: "service_order", label: "Service Order" },
  { value: "onboarding_checklist", label: "Onboarding Checklist" },
  { value: "other", label: "Other" },
];

// ─── Placeholder chips ────────────────────────────────────────────────────────
const PLACEHOLDERS = [
  "[CLIENT NAME]",
  "[CLIENT LEGAL NAME]",
  "[CLIENT ADDRESS]",
  "[DATE]",
  "[PROJECT NAME]",
  "[SERVICE TYPE]",
  "[TOTAL FEE]",
  "[DEPOSIT AMOUNT]",
  "[BRAND NAME]",
  "[CONTRACTOR NAME]",
];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; style: React.CSSProperties }> = {
    pending: { label: "Pending", style: { backgroundColor: "#D97706", color: "#fff" } },
    sent: { label: "Sent", style: { backgroundColor: "#2563EB", color: "#fff" } },
    viewed: { label: "Viewed", style: { backgroundColor: "#7C3AED", color: "#fff" } },
    signed: { label: "Signed", style: { backgroundColor: "#059669", color: "#fff" } },
  };
  const cfg = map[status?.toLowerCase()] ?? { label: status ?? "Unknown", style: { backgroundColor: "#6B7280", color: "#fff" } };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={cfg.style}
    >
      {cfg.label}
    </span>
  );
}

// ─── Category badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  const label = CATEGORIES.find((c) => c.value === category)?.label ?? category;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ borderColor: BRAND.sand, color: BRAND.charcoal, backgroundColor: BRAND.ivory }}
    >
      {label}
    </span>
  );
}

// ─── Date formatter ───────────────────────────────────────────────────────────
function fmt(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function todayFormatted() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Template {
  id: number;
  name: string;
  category: string;
  content: string;
  isActive?: number;
  createdAt?: string;
}

interface SentDocument {
  id: number;
  title: string;
  category?: string;
  status: string;
  content?: string;
  sentDate?: string;
  signedDate?: string;
  dueDate?: string;
  userId?: number;
  projectId?: number;
  required?: boolean;
  signatureData?: string;
}

interface Client {
  id: number;
  name?: string;
  email?: string;
  brandName?: string;
  projectName?: string;
  company?: string;
}

// ─── Template Editor Dialog ───────────────────────────────────────────────────
interface TemplateEditorProps {
  template: Partial<Template> | null;
  open: boolean;
  onClose: () => void;
  onSendToClient: (template: Template) => void;
}

function TemplateEditorDialog({ template, open, onClose, onSendToClient }: TemplateEditorProps) {
  const qc = useQueryClient();
  const isNew = !template?.id;

  const [name, setName] = useState(template?.name ?? "");
  const [category, setCategory] = useState(template?.category ?? "service_agreement");
  const [content, setContent] = useState(template?.content ?? "");
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when template changes
  const resetState = useCallback(() => {
    setName(template?.name ?? "");
    setCategory(template?.category ?? "service_agreement");
    setContent(template?.content ?? "");
    setShowPreview(false);
    setSaved(false);
  }, [template]);

  // Sync when dialog opens
  const handleOpenChange = (o: boolean) => {
    if (o) resetState();
    if (!o) onClose();
  };

  // Insert placeholder at cursor position
  const insertPlaceholder = (placeholder: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + placeholder);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const newContent = content.slice(0, start) + placeholder + content.slice(end);
    setContent(newContent);
    // Restore focus & cursor after state update
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  const createMutation = useMutation({
    mutationFn: (data: { name: string; category: string; content: string }) =>
      apiRequest("POST", "/api/admin/document-templates", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/document-templates"] });
      setSaved(true);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; category: string; content: string }) =>
      apiRequest("PUT", `/api/admin/document-templates/${template?.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/document-templates"] });
      setSaved(true);
    },
  });

  const handleSave = () => {
    const payload = { name, category, content };
    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[95vw] w-[1100px] h-[90vh] flex flex-col p-0 overflow-hidden"
        style={{ backgroundColor: BRAND.ivory }}
      >
        {/* Header */}
        <DialogHeader
          className="px-6 pt-5 pb-3 border-b flex-shrink-0"
          style={{ borderColor: BRAND.sand, backgroundColor: "#fff" }}
        >
          <DialogTitle style={{ color: BRAND.charcoal, fontSize: "1.1rem", fontWeight: 700 }}>
            {isNew ? "Create New Template" : "Edit Template"}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor panel */}
          <div className="flex flex-col flex-1 overflow-hidden p-6 gap-4">
            {/* Name + Category row */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Label style={{ color: BRAND.charcoal, fontWeight: 600, fontSize: "0.8rem" }}>
                  Template Name
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Master Service Agreement"
                  className="mt-1"
                  style={{ borderColor: BRAND.sand, backgroundColor: "#fff" }}
                />
              </div>
              <div className="w-56">
                <Label style={{ color: BRAND.charcoal, fontWeight: 600, fontSize: "0.8rem" }}>
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1" style={{ borderColor: BRAND.sand, backgroundColor: "#fff" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Placeholder chips */}
            <div>
              <Label style={{ color: BRAND.charcoal, fontWeight: 600, fontSize: "0.8rem" }}>
                Insert Placeholder
              </Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PLACEHOLDERS.map((ph) => (
                  <button
                    key={ph}
                    type="button"
                    onClick={() => insertPlaceholder(ph)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-opacity hover:opacity-80 cursor-pointer"
                    style={{
                      backgroundColor: BRAND.terracotta,
                      color: "#fff",
                      borderColor: BRAND.terracotta,
                      fontFamily: "monospace",
                    }}
                  >
                    {ph}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea / Preview toggle */}
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-xs font-semibold px-3 py-1 rounded transition-colors"
                style={{
                  backgroundColor: !showPreview ? BRAND.charcoal : "transparent",
                  color: !showPreview ? "#fff" : BRAND.charcoal,
                  border: `1px solid ${BRAND.charcoal}`,
                }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="text-xs font-semibold px-3 py-1 rounded transition-colors"
                style={{
                  backgroundColor: showPreview ? BRAND.charcoal : "transparent",
                  color: showPreview ? "#fff" : BRAND.charcoal,
                  border: `1px solid ${BRAND.charcoal}`,
                }}
              >
                Preview
              </button>
            </div>

            {!showPreview ? (
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 resize-none text-sm leading-relaxed"
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  backgroundColor: "#fff",
                  borderColor: BRAND.sand,
                  color: BRAND.charcoal,
                  minHeight: "300px",
                }}
                placeholder="Paste or type the full legal document content here. Use placeholders like [CLIENT NAME], [DATE], etc."
              />
            ) : (
              <ScrollArea className="flex-1 rounded border" style={{ borderColor: BRAND.sand, backgroundColor: "#fff" }}>
                <div
                  className="p-8 max-w-2xl mx-auto"
                  style={{ color: BRAND.charcoal, lineHeight: 1.8 }}
                >
                  <DocumentPreview content={content} />
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter
          className="px-6 py-4 border-t flex-shrink-0 flex flex-row justify-between items-center"
          style={{ borderColor: BRAND.sand, backgroundColor: "#fff" }}
        >
          <div className="flex gap-2 items-center">
            {saved && (
              <span className="text-xs font-medium" style={{ color: "#059669" }}>
                ✓ Saved successfully
              </span>
            )}
            {(createMutation.isError || updateMutation.isError) && (
              <span className="text-xs font-medium text-red-600">
                Save failed — please try again
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              style={{ borderColor: BRAND.sand }}
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (template?.id) {
                  onSendToClient({ id: template.id, name, category, content });
                  onClose();
                }
              }}
              disabled={isNew || !template?.id}
              style={{
                borderColor: BRAND.terracotta,
                color: BRAND.terracotta,
              }}
            >
              Send to Client →
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !name.trim() || !content.trim()}
              style={{ backgroundColor: BRAND.charcoal, color: "#fff" }}
            >
              {isSaving ? "Saving…" : isNew ? "Create Template" : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Document Preview ─────────────────────────────────────────────────────────
function DocumentPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="text-sm italic" style={{ color: "#9CA3AF" }}>
        No content to preview yet.
      </p>
    );
  }

  // Render markdown-ish content: headings, tables, bold, etc.
  const lines = content.split("\n");
  return (
    <div className="space-y-1" style={{ fontFamily: "Georgia, serif", fontSize: "0.88rem" }}>
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return <h1 key={i} className="text-xl font-bold mt-6 mb-2" style={{ color: BRAND.charcoal }}>{line.slice(2)}</h1>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={i} className="text-base font-bold mt-5 mb-1 uppercase tracking-wide" style={{ color: BRAND.charcoal }}>{line.slice(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} className="text-sm font-bold mt-4 mb-1" style={{ color: BRAND.charcoal }}>{line.slice(4)}</h3>;
        }
        if (line.startsWith("---")) {
          return <hr key={i} className="my-3" style={{ borderColor: BRAND.sand }} />;
        }
        if (line.startsWith("> ")) {
          return (
            <blockquote key={i} className="pl-4 border-l-4 italic text-sm my-2" style={{ borderColor: BRAND.terracotta, color: "#6B7280" }}>
              {line.slice(2)}
            </blockquote>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-2" />;
        }
        // Highlight placeholders in terracotta
        const parts = line.split(/(\[[A-Z][A-Z\s/]+\])/g);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) =>
              /^\[[A-Z][A-Z\s/]+\]$/.test(part) ? (
                <span key={j} className="font-semibold" style={{ color: BRAND.terracotta }}>
                  {part}
                </span>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

// ─── Tab 1: Sent Documents ────────────────────────────────────────────────────
function SentDocumentsTab({ clients }: { clients: Client[] }) {
  const { data: docs = [], isLoading } = useQuery<SentDocument[]>({
    queryKey: ["/api/admin/documents"],
    queryFn: () => apiRequest("GET", "/api/admin/documents"),
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getClientName = (userId?: number) => {
    if (!userId) return "—";
    const c = clients.find((cl) => cl.id === userId);
    return c ? (c.name ?? c.email ?? `Client #${userId}`) : `Client #${userId}`;
  };

  const filtered = docs.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (clientFilter !== "all" && String(d.userId) !== clientFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs font-semibold mb-1 block" style={{ color: BRAND.charcoal }}>
            Filter by Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-8 text-xs" style={{ borderColor: BRAND.sand }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold mb-1 block" style={{ color: BRAND.charcoal }}>
            Filter by Client
          </Label>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48 h-8 text-xs" style={{ borderColor: BRAND.sand }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name ?? c.email ?? `Client #${c.id}`}
                  {c.brandName ? ` — ${c.brandName}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-gray-500 self-end pb-0.5">
          {filtered.length} of {docs.length} documents
        </div>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-sm text-gray-500">Loading documents…</div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div
          className="py-16 text-center rounded-lg border"
          style={{ borderColor: BRAND.sand, backgroundColor: "#fff" }}
        >
          <p className="text-sm font-medium" style={{ color: BRAND.charcoal }}>No documents found</p>
          <p className="text-xs text-gray-500 mt-1">
            {docs.length === 0 ? "No documents have been sent yet." : "Try adjusting your filters."}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: BRAND.sand }}>
          {/* Table header */}
          <div
            className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2.5"
            style={{
              gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr",
              backgroundColor: BRAND.charcoal,
              color: BRAND.sand,
            }}
          >
            <span>Title</span>
            <span>Client</span>
            <span>Status</span>
            <span>Sent</span>
            <span>Due</span>
            <span>Signed</span>
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ divideColor: BRAND.sand }}>
            {filtered.map((doc) => (
              <div key={doc.id}>
                <button
                  type="button"
                  className="w-full text-left hover:bg-orange-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                  style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", padding: "12px 16px", alignItems: "center" }}
                >
                  <div>
                    <span className="text-sm font-medium" style={{ color: BRAND.charcoal }}>
                      {doc.title}
                    </span>
                    {doc.required && (
                      <span className="ml-2 text-xs font-medium" style={{ color: BRAND.terracotta }}>
                        Required
                      </span>
                    )}
                    {doc.category && (
                      <div className="mt-0.5">
                        <CategoryBadge category={doc.category} />
                      </div>
                    )}
                  </div>
                  <span className="text-sm" style={{ color: BRAND.charcoal }}>
                    {getClientName(doc.userId)}
                  </span>
                  <StatusBadge status={doc.status} />
                  <span className="text-xs text-gray-500">{fmt(doc.sentDate)}</span>
                  <span className="text-xs text-gray-500">{fmt(doc.dueDate)}</span>
                  <span className="text-xs text-gray-500">{fmt(doc.signedDate)}</span>
                </button>

                {expandedId === doc.id && (
                  <div
                    className="px-6 pb-6 pt-3"
                    style={{ backgroundColor: BRAND.ivory, borderTop: `1px solid ${BRAND.sand}` }}
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.charcoal }}>
                          Document Content
                        </h4>
                        <div
                          className="rounded p-4 text-xs leading-relaxed max-h-80 overflow-y-auto"
                          style={{
                            backgroundColor: "#fff",
                            border: `1px solid ${BRAND.sand}`,
                            fontFamily: "'Courier New', monospace",
                            whiteSpace: "pre-wrap",
                            color: BRAND.charcoal,
                          }}
                        >
                          {doc.content ?? "No content stored."}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.charcoal }}>
                          Signature Details
                        </h4>
                        {doc.signatureData ? (
                          <div
                            className="rounded p-4 text-xs"
                            style={{ backgroundColor: "#fff", border: `1px solid ${BRAND.sand}` }}
                          >
                            <pre className="text-xs whitespace-pre-wrap break-all" style={{ color: BRAND.charcoal }}>
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(doc.signatureData), null, 2);
                                } catch {
                                  return doc.signatureData;
                                }
                              })()}
                            </pre>
                          </div>
                        ) : (
                          <div
                            className="rounded p-4 text-sm italic text-gray-400"
                            style={{ backgroundColor: "#fff", border: `1px solid ${BRAND.sand}` }}
                          >
                            {doc.status === "signed" ? "Signature data not available." : "Not yet signed."}
                          </div>
                        )}
                        <div className="mt-4 space-y-1 text-xs" style={{ color: BRAND.charcoal }}>
                          <div><span className="font-semibold">Document ID:</span> #{doc.id}</div>
                          {doc.projectId && <div><span className="font-semibold">Project ID:</span> #{doc.projectId}</div>}
                          <div><span className="font-semibold">Required:</span> {doc.required ? "Yes" : "No"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Master Templates ──────────────────────────────────────────────────
function MasterTemplatesTab({
  onSendToClient,
}: {
  onSendToClient: (template: Template) => void;
}) {
  const qc = useQueryClient();
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["/api/admin/document-templates"],
    queryFn: () => apiRequest("GET", "/api/admin/document-templates"),
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/admin/document-templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/document-templates"] });
      setDeleteTarget(null);
    },
  });

  const activeTemplates = templates.filter((t) => t.isActive !== 0);

  const openEditor = (tpl: Partial<Template> | null) => {
    setEditingTemplate(tpl);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {activeTemplates.length} active template{activeTemplates.length !== 1 ? "s" : ""}
        </p>
        <Button
          onClick={() => openEditor({})}
          style={{ backgroundColor: BRAND.charcoal, color: "#fff" }}
        >
          + Create New Template
        </Button>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-sm text-gray-500">Loading templates…</div>
      )}

      {!isLoading && activeTemplates.length === 0 && (
        <div
          className="py-16 text-center rounded-lg border"
          style={{ borderColor: BRAND.sand, backgroundColor: "#fff" }}
        >
          <p className="text-sm font-medium" style={{ color: BRAND.charcoal }}>No templates yet</p>
          <p className="text-xs text-gray-500 mt-1">Create your first legal template to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTemplates.map((tpl) => (
          <Card
            key={tpl.id}
            className="flex flex-col"
            style={{ backgroundColor: "#fff", borderColor: BRAND.sand }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-bold leading-tight" style={{ color: BRAND.charcoal }}>
                  {tpl.name}
                </CardTitle>
                <CategoryBadge category={tpl.category} />
              </div>
              {tpl.createdAt && (
                <CardDescription className="text-xs">
                  Created {fmt(tpl.createdAt)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1 pb-2">
              <p
                className="text-xs leading-relaxed line-clamp-4"
                style={{
                  color: "#6B7280",
                  fontFamily: "'Courier New', monospace",
                  whiteSpace: "pre-wrap",
                }}
              >
                {tpl.content?.slice(0, 220) ?? "No content."}
                {(tpl.content?.length ?? 0) > 220 ? "…" : ""}
              </p>
            </CardContent>
            <CardFooter className="pt-3 gap-2 flex-wrap border-t" style={{ borderColor: BRAND.sand }}>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                style={{ borderColor: BRAND.charcoal, color: BRAND.charcoal }}
                onClick={() => openEditor(tpl)}
              >
                Edit Template
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs"
                style={{ backgroundColor: BRAND.terracotta, color: "#fff", border: "none" }}
                onClick={() => onSendToClient(tpl)}
              >
                Send to Client
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => setDeleteTarget(tpl)}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Editor dialog */}
      <TemplateEditorDialog
        template={editingTemplate}
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingTemplate(null); }}
        onSendToClient={(tpl) => {
          setEditorOpen(false);
          onSendToClient(tpl);
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent style={{ backgroundColor: BRAND.ivory }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: BRAND.charcoal }}>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              "<strong>{deleteTarget?.name}</strong>" will be archived. This action can be reversed by a developer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              style={{ backgroundColor: "#DC2626", color: "#fff" }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Tab 3: Send Document ─────────────────────────────────────────────────────
interface SendDocumentTabProps {
  preselectedTemplateId?: number | null;
  clients: Client[];
}

function SendDocumentTab({ preselectedTemplateId, clients }: SendDocumentTabProps) {
  const qc = useQueryClient();
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/admin/document-templates"],
    queryFn: () => apiRequest("GET", "/api/admin/document-templates"),
  });

  const [templateId, setTemplateId] = useState<string>(
    preselectedTemplateId ? String(preselectedTemplateId) : ""
  );
  const [clientId, setClientId] = useState<string>("");
  const [editableContent, setEditableContent] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [required, setRequired] = useState(false);
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  // Sync template selection when preselectedTemplateId changes from parent
  const prevPreselected = useRef<number | null | undefined>(null);
  if (prevPreselected.current !== preselectedTemplateId && preselectedTemplateId) {
    prevPreselected.current = preselectedTemplateId;
    setTemplateId(String(preselectedTemplateId));
    setStep(1);
  }

  const selectedTemplate = templates.find((t) => String(t.id) === templateId);
  const selectedClient = clients.find((c) => String(c.id) === clientId);

  // Auto-fill placeholders when both template + client are chosen
  const fillPlaceholders = useCallback(
    (rawContent: string, client: Client | undefined) => {
      if (!client) return rawContent;
      let out = rawContent;
      const clientName = client.name ?? client.email ?? "Client";
      const brandName = client.brandName ?? "";
      const projectName = client.projectName ?? "(project)";
      out = out.replace(/\[CLIENT NAME\]/g, clientName);
      out = out.replace(
        /\[CLIENT LEGAL NAME\]/g,
        brandName ? `${clientName} d/b/a ${brandName}` : clientName
      );
      out = out.replace(
        /\[CLIENT ADDRESS\]/g,
        "(to be provided)"
      );
      out = out.replace(/\[DATE\]/g, todayFormatted());
      out = out.replace(/\[PROJECT NAME\]/g, projectName);
      out = out.replace(/\[BRAND NAME\]/g, brandName || clientName);
      return out;
    },
    []
  );

  // When template changes, reset content
  const handleTemplateChange = (val: string) => {
    setTemplateId(val);
    const tpl = templates.find((t) => String(t.id) === val);
    if (tpl) {
      setTitle(tpl.name);
      setEditableContent(fillPlaceholders(tpl.content, selectedClient));
    }
  };

  // When client changes, re-fill placeholders from scratch
  const handleClientChange = (val: string) => {
    setClientId(val);
    const client = clients.find((c) => String(c.id) === val);
    if (selectedTemplate) {
      setEditableContent(fillPlaceholders(selectedTemplate.content, client));
    }
  };

  const sendMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest("POST", "/api/admin/documents", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      setStep(7); // success step
    },
  });

  const handleSend = () => {
    sendMutation.mutate({
      templateId: selectedTemplate?.id,
      userId: selectedClient?.id,
      projectId: null,
      title,
      category: selectedTemplate?.category ?? "other",
      content: editableContent,
      dueDate: dueDate || null,
      required,
    });
  };

  const canProceedStep1 = !!templateId;
  const canProceedStep2 = !!clientId;

  return (
    <div className="max-w-3xl">
      {step === 7 ? (
        // Success state
        <div
          className="rounded-lg border p-12 text-center"
          style={{ borderColor: "#059669", backgroundColor: "#ECFDF5" }}
        >
          <div className="text-4xl mb-3">✓</div>
          <h3 className="text-lg font-bold" style={{ color: "#065F46" }}>
            Document Sent Successfully
          </h3>
          <p className="text-sm text-green-700 mt-1">
            "{title}" has been sent to {selectedClient?.name ?? "the client"}.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setStep(1);
              setTemplateId("");
              setClientId("");
              setEditableContent("");
              setTitle("");
              setDueDate("");
              setRequired(false);
              setShowPreview(false);
            }}
            style={{ backgroundColor: BRAND.charcoal, color: "#fff" }}
          >
            Send Another Document
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step progress */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: step >= s ? BRAND.charcoal : BRAND.sand,
                    color: step >= s ? "#fff" : BRAND.charcoal,
                  }}
                >
                  {s}
                </div>
                {s < 5 && (
                  <div
                    className="w-10 h-0.5"
                    style={{ backgroundColor: step > s ? BRAND.charcoal : BRAND.sand }}
                  />
                )}
              </div>
            ))}
            <span className="ml-3 text-xs text-gray-500">
              {["Select Template", "Select Client", "Edit Content", "Document Details", "Review & Send"][step - 1]}
            </span>
          </div>

          {/* Step 1: Select Template */}
          {step === 1 && (
            <Card style={{ borderColor: BRAND.sand }}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: BRAND.charcoal }}>Step 1 — Select a Template</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={templateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger style={{ borderColor: BRAND.sand }}>
                    <SelectValue placeholder="Choose a legal template…" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates
                      .filter((t) => t.isActive !== 0)
                      .map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                          <span className="ml-2 text-xs text-gray-400">
                            ({CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category})
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <div
                    className="mt-4 p-3 rounded text-xs leading-relaxed line-clamp-5"
                    style={{
                      backgroundColor: BRAND.ivory,
                      border: `1px solid ${BRAND.sand}`,
                      fontFamily: "'Courier New', monospace",
                      color: BRAND.charcoal,
                    }}
                  >
                    {selectedTemplate.content.slice(0, 400)}…
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Button
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                  style={{ backgroundColor: BRAND.charcoal, color: "#fff" }}
                >
                  Next: Select Client →
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 2: Select Client */}
          {step === 2 && (
            <Card style={{ borderColor: BRAND.sand }}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: BRAND.charcoal }}>Step 2 — Select a Client</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={clientId} onValueChange={handleClientChange}>
                  <SelectTrigger style={{ borderColor: BRAND.sand }}>
                    <SelectValue placeholder="Choose a client…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name ?? c.email ?? `Client #${c.id}`}
                        {c.brandName ? ` — ${c.brandName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClient && (
                  <div
                    className="mt-4 p-3 rounded text-xs space-y-1"
                    style={{ backgroundColor: BRAND.ivory, border: `1px solid ${BRAND.sand}` }}
                  >
                    {selectedClient.name && <div><span className="font-semibold">Name:</span> {selectedClient.name}</div>}
                    {selectedClient.brandName && <div><span className="font-semibold">Brand:</span> {selectedClient.brandName}</div>}
                    {selectedClient.email && <div><span className="font-semibold">Email:</span> {selectedClient.email}</div>}
                    {selectedClient.projectName && <div><span className="font-semibold">Project:</span> {selectedClient.projectName}</div>}
                    <div className="pt-1 text-green-700 font-medium">
                      ✓ Placeholders will be auto-filled from this profile
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setStep(1)} style={{ borderColor: BRAND.sand }}>
                  ← Back
                </Button>
                <Button
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                  style={{ backgroundColor: BRAND.charcoal, color: "#fff" }}
                >
                  Next: Edit Content →
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 3: Edit Content */}
          {step === 3 && (
            <Card style={{ borderColor: BRAND.sand }}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: BRAND.charcoal }}>Step 3 — Review & Edit Document Content</CardTitle>
                <CardDescription className="text-xs">
                  Placeholders have been auto-filled where possible. Review and edit as needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="text-xs font-semibold px-3 py-1 rounded"
                    style={{
                      backgroundColor: !showPreview ? BRAND.charcoal : "transparent",
                      color: !showPreview ? "#fff" : BRAND.charcoal,
                      border: `1px solid ${BRAND.charcoal}`,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="text-xs font-semibold px-3 py-1 rounded"
                    style={{
                      backgroundColor: showPreview ? BRAND.charcoal : "transparent",
                      color: showPreview ? "#fff" : BRAND.charcoal,
                      border: `1px solid ${BRAND.charcoal}`,
                    }}
                  >
                    Preview
                  </button>
                </div>

                {!showPreview ? (
                  <Textarea
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    rows={18}
                    className="text-xs leading-relaxed resize-none"
                    style={{
                      fontFamily: "'Courier New', monospace",
                      borderColor: BRAND.sand,
                      backgroundColor: "#fff",
                      color: BRAND.charcoal,
                    }}
                  />
                ) : (
                  <ScrollArea className="h-96 rounded border" style={{ borderColor: BRAND.sand, backgroundColor: "#fff" }}>
                    <div className="p-6 max-w-xl mx-auto" style={{ color: BRAND.charcoal }}>
                      <DocumentPreview content={editableContent} />
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setStep(2)} style={{ borderColor: BRAND.sand }}>
                  ← Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  style={{ backgroundColor: BRAND.charcoal, color: "#fff" }}
                >
                  Next: Document Details →
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 4: Document Details */}
          {step === 4 && (
            <Card style={{ borderColor: BRAND.sand }}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: BRAND.charcoal }}>Step 4 — Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold" style={{ color: BRAND.charcoal }}>
                    Document Title
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Master Service Agreement — Studio Noir"
                    className="mt-1"
                    style={{ borderColor: BRAND.sand }}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold" style={{ color: BRAND.charcoal }}>
                    Due Date (optional)
                  </Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 w-52"
                    style={{ borderColor: BRAND.sand }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="required"
                    checked={required}
                    onCheckedChange={(v) => setRequired(!!v)}
                  />
                  <Label htmlFor="required" className="text-sm cursor-pointer" style={{ color: BRAND.charcoal }}>
                    Mark as required (client must sign before proceeding)
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setStep(3)} style={{ borderColor: BRAND.sand }}>
                  ← Back
                </Button>
                <Button
                  disabled={!title.trim()}
                  onClick={() => setStep(5)}
                  style={{ backgroundColor: BRAND.charcoal, color: "#fff" }}
                >
                  Next: Review →
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 5: Preview & Send */}
          {step === 5 && (
            <Card style={{ borderColor: BRAND.sand }}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: BRAND.charcoal }}>Step 5 — Review & Send</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div
                  className="rounded-lg p-4 text-sm space-y-2"
                  style={{ backgroundColor: BRAND.ivory, border: `1px solid ${BRAND.sand}` }}
                >
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="font-semibold" style={{ color: BRAND.charcoal }}>Title:</span> {title}</div>
                    <div><span className="font-semibold" style={{ color: BRAND.charcoal }}>Client:</span> {selectedClient?.name ?? "—"}</div>
                    <div><span className="font-semibold" style={{ color: BRAND.charcoal }}>Template:</span> {selectedTemplate?.name ?? "—"}</div>
                    <div><span className="font-semibold" style={{ color: BRAND.charcoal }}>Category:</span> <CategoryBadge category={selectedTemplate?.category ?? "other"} /></div>
                    <div><span className="font-semibold" style={{ color: BRAND.charcoal }}>Due Date:</span> {dueDate ? fmt(dueDate) : "None"}</div>
                    <div><span className="font-semibold" style={{ color: BRAND.charcoal }}>Required:</span> {required ? "Yes" : "No"}</div>
                  </div>
                </div>

                {/* Document preview */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.charcoal }}>
                    Final Document Preview
                  </h4>
                  <ScrollArea
                    className="h-80 rounded border"
                    style={{ borderColor: BRAND.sand, backgroundColor: "#fff" }}
                  >
                    <div
                      className="p-8 max-w-xl mx-auto"
                      style={{ color: BRAND.charcoal }}
                    >
                      <DocumentPreview content={editableContent} />
                    </div>
                  </ScrollArea>
                </div>

                {sendMutation.isError && (
                  <div className="text-xs text-red-600 font-medium">
                    Failed to send — please check your connection and try again.
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setStep(4)} style={{ borderColor: BRAND.sand }}>
                  ← Back
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sendMutation.isPending}
                  style={{ backgroundColor: BRAND.terracotta, color: "#fff", fontWeight: 700 }}
                >
                  {sendMutation.isPending ? "Sending…" : "Send Document →"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function AdminDocumentsPage() {
  const [activeTab, setActiveTab] = useState("sent");
  const [sendTemplateId, setSendTemplateId] = useState<number | null>(null);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/admin/clients"],
    queryFn: () => apiRequest("GET", "/api/admin/clients"),
  });

  const handleSendToClient = (template: Template) => {
    setSendTemplateId(template.id);
    setActiveTab("send");
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: BRAND.ivory, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BRAND.charcoal }}>
          Legal Documents
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage templates, sent documents, and client agreements.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className="mb-6"
          style={{ backgroundColor: BRAND.sand }}
        >
          <TabsTrigger
            value="sent"
            style={{ fontWeight: 600, fontSize: "0.85rem" }}
          >
            Sent Documents
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            style={{ fontWeight: 600, fontSize: "0.85rem" }}
          >
            Master Templates
          </TabsTrigger>
          <TabsTrigger
            value="send"
            style={{ fontWeight: 600, fontSize: "0.85rem" }}
          >
            Send Document
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent">
          <SentDocumentsTab clients={clients} />
        </TabsContent>

        <TabsContent value="templates">
          <MasterTemplatesTab onSendToClient={handleSendToClient} />
        </TabsContent>

        <TabsContent value="send">
          <SendDocumentTab
            preselectedTemplateId={sendTemplateId}
            clients={clients}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

