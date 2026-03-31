import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  PenLine,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

interface LegalDocument {
  id: number;
  projectId: number;
  templateName: string;
  title: string;
  category: string;
  content: string;
  status: string;
  sentAt: string | null;
  signedAt: string | null;
  signedBy: string | null;
  signatureText: string | null;
  dueDate: string | null;
  required: number;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  nda: "NDA",
  service_agreement: "Service Agreement",
  mutual_release: "Mutual Release",
  phase_signoff: "Phase Sign-Off",
  design_approval: "Design Approval",
  ip_assignment: "IP Assignment",
  other: "Other",
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground", icon: Clock },
  sent: { label: "Awaiting Signature", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertCircle },
  viewed: { label: "Viewed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Eye },
  signed: { label: "Signed", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  expired: { label: "Expired", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
};

function DocumentCard({
  doc,
  index,
  onReview,
}: {
  doc: LegalDocument;
  index: number;
  onReview: (doc: LegalDocument) => void;
}) {
  const cfg = statusConfig[doc.status] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  const needsSignature = doc.status === "sent" || doc.status === "viewed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card
        className={`border shadow-sm transition-all ${
          needsSignature
            ? "border-yellow-300 dark:border-yellow-700/40 ring-1 ring-yellow-200 dark:ring-yellow-700/20"
            : doc.status === "signed"
            ? "border-green-200 dark:border-green-900/30"
            : ""
        }`}
      >
        <div className="p-5 flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              doc.status === "signed"
                ? "bg-green-100 dark:bg-green-900/20"
                : needsSignature
                ? "bg-yellow-100 dark:bg-yellow-900/20"
                : "bg-muted/50"
            }`}
          >
            <FileText
              className={`w-5 h-5 ${
                doc.status === "signed"
                  ? "text-green-600"
                  : needsSignature
                  ? "text-yellow-600"
                  : "text-muted-foreground"
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    {categoryLabels[doc.category] || doc.category}
                  </span>
                  {doc.required === 1 && (
                    <span className="text-[10px] font-medium text-[#B7542E] bg-[#B7542E]/10 px-1.5 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground">{doc.title}</h3>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {cfg.label}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {doc.sentAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Sent {format(parseISO(doc.sentAt), "MMM d, yyyy")}</span>
                </div>
              )}
              {doc.dueDate && doc.status !== "signed" && (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Clock className="w-3 h-3" />
                  <span>Due {format(parseISO(doc.dueDate), "MMM d, yyyy")}</span>
                </div>
              )}
              {doc.signedAt && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Signed {format(parseISO(doc.signedAt), "MMM d, yyyy")} by {doc.signedBy}</span>
                </div>
              )}
            </div>

            <div className="mt-3">
              <Button
                size="sm"
                variant={needsSignature ? "default" : "outline"}
                className={needsSignature ? "bg-[#B7542E] hover:bg-[#B7542E]/90 text-white" : ""}
                onClick={() => onReview(doc)}
              >
                {doc.status === "signed" ? (
                  <>
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> View Document
                  </>
                ) : (
                  <>
                    <PenLine className="w-3.5 h-3.5 mr-1.5" /> Review & Sign
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function DocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [signatureText, setSignatureText] = useState("");
  const [agreed, setAgreed] = useState(false);

  const { data: projects } = useQuery<Array<{ id: number }>>({
    queryKey: ["/api/projects"],
  });
  const projectId = projects?.[0]?.id;

  const { data: documents, isLoading } = useQuery<LegalDocument[]>({
    queryKey: ["/api/projects", projectId, "documents"],
    enabled: !!projectId,
  });

  const viewMutation = useMutation({
    mutationFn: (docId: number) => apiRequest("POST", `/api/documents/${docId}/view`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "documents"] });
    },
  });

  const signMutation = useMutation({
    mutationFn: ({ docId, signature }: { docId: number; signature: string }) =>
      apiRequest("POST", `/api/documents/${docId}/sign`, { signatureText: signature }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "documents"] });
      toast({ title: "Document signed", description: "Your signature has been recorded." });
      setSelectedDoc(null);
      setSignatureText("");
      setAgreed(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to sign document.", variant: "destructive" });
    },
  });

  const handleOpenDoc = (doc: LegalDocument) => {
    setSelectedDoc(doc);
    setSignatureText("");
    setAgreed(false);
    if (doc.status === "sent") {
      viewMutation.mutate(doc.id);
    }
  };

  const handleSign = () => {
    if (!selectedDoc || !signatureText.trim() || !agreed) return;
    signMutation.mutate({ docId: selectedDoc.id, signature: signatureText });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-40" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const docs = documents || [];
  const pendingDocs = docs.filter((d) => d.status === "sent" || d.status === "viewed");
  const signedDocs = docs.filter((d) => d.status === "signed");

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto" data-testid="documents-page">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Legal documents, agreements, and sign-offs for your project
        </p>
      </div>

      {/* Alert if any docs need signing */}
      {pendingDocs.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">
              {pendingDocs.length} document{pendingDocs.length > 1 ? "s" : ""} awaiting your signature
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-0.5">
              Required documents must be signed before work on the next phase can begin.
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{docs.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Documents</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingDocs.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Awaiting Signature</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{signedDocs.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Signed</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents list */}
      {docs.length > 0 ? (
        <div className="space-y-3">
          {docs.map((doc, i) => (
            <DocumentCard key={doc.id} doc={doc} index={i} onReview={handleOpenDoc} />
          ))}
        </div>
      ) : (
        <Card className="border border-dashed">
          <CardContent className="py-14 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No documents yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              LEAA will send documents for review and signature as your project progresses.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Document review dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => { if (!open) setSelectedDoc(null); }}>
        {selectedDoc && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {categoryLabels[selectedDoc.category] || selectedDoc.category}
                </span>
              </div>
              <DialogTitle className="text-lg">{selectedDoc.title}</DialogTitle>
            </DialogHeader>

            {/* Document content */}
            <div className="my-4 p-4 rounded-lg bg-muted/20 border border-border/40 max-h-64 overflow-y-auto">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {selectedDoc.content}
              </pre>
            </div>

            {selectedDoc.status === "signed" ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-400">
                    Signed by {selectedDoc.signedBy}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-500">
                    Signature: "{selectedDoc.signatureText}" ·{" "}
                    {selectedDoc.signedAt && format(parseISO(selectedDoc.signedAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Acknowledgment checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border text-[#B7542E] focus:ring-[#B7542E]"
                  />
                  <span className="text-sm text-foreground">
                    I have read and understand this document, and I acknowledge and agree to its terms.
                  </span>
                </label>

                {/* Digital signature */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <PenLine className="w-4 h-4" />
                    Digital Signature
                  </label>
                  <Input
                    placeholder="Type your full legal name to sign"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    className="font-serif italic text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    By typing your name, you are providing a legally binding electronic signature.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Your signature will be timestamped and recorded securely.</span>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedDoc(null)}>
                Close
              </Button>
              {selectedDoc.status !== "signed" && (
                <Button
                  className="bg-[#B7542E] hover:bg-[#B7542E]/90 text-white"
                  disabled={!agreed || !signatureText.trim() || signMutation.isPending}
                  onClick={handleSign}
                >
                  {signMutation.isPending ? "Signing..." : "Sign Document"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

