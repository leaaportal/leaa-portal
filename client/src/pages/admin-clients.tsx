import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  User,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  FolderOpen,
  Eye,
} from "lucide-react";
import { useLocation } from "wouter";

const SERVICE_TYPES = [
  { value: "Concept Development 60-Day", label: "Concept Development (60-Day)" },
  { value: "Monthly Retainer 5hr", label: "Monthly Retainer — 5 hr/mo" },
  { value: "Monthly Retainer 10hr", label: "Monthly Retainer — 10 hr/mo" },
  { value: "Monthly Retainer 20hr", label: "Monthly Retainer — 20 hr/mo" },
  { value: "B.E.A.M. Program", label: "B.E.A.M. Program" },
];

const DOCUMENT_OPTIONS = [
  { id: "nda", label: "Mutual Non-Disclosure Agreement (NDA)", required: true },
  { id: "service_agreement", label: "Service Agreement", required: true },
  { id: "ip_assignment", label: "IP Assignment Agreement", required: false },
  { id: "mutual_release", label: "Mutual Release Agreement", required: false },
];

const SERVICE_MILESTONES: Record<string, { sessions: number; desc: string }> = {
  "Concept Development 60-Day": {
    sessions: 4,
    desc: "4 sessions: Vision, Customer Profile, Design & Fabric, Design Development",
  },
  "Monthly Retainer 5hr": { sessions: 3, desc: "3 monthly milestones — 5 hours each" },
  "Monthly Retainer 10hr": { sessions: 3, desc: "3 monthly milestones — 10 hours each" },
  "Monthly Retainer 20hr": { sessions: 3, desc: "3 monthly milestones — 20 hours each" },
  "B.E.A.M. Program": { sessions: 4, desc: "4 sessions with B.E.A.M. methodology" },
};

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "LEAA";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const STEPS = [
  { id: 1, label: "Client Info" },
  { id: 2, label: "Legal Docs" },
  { id: 3, label: "Project Setup" },
  { id: 4, label: "Review & Create" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            step.id < current
              ? "bg-green-500 text-white"
              : step.id === current
              ? "bg-[#B7542E] text-white"
              : "bg-muted text-muted-foreground"
          }`}>
            {step.id < current ? <Check className="w-3.5 h-3.5" /> : step.id}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${
            step.id === current ? "text-foreground" : "text-muted-foreground"
          }`}>
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`w-6 h-px ${step.id < current ? "bg-green-500" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function OnboardingWizard({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (clientId: number) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const [clientInfo, setClientInfo] = useState({
    name: "",
    email: "",
    brandName: "",
    serviceType: "",
    startDate: new Date().toISOString().split("T")[0],
    accessCode: generateAccessCode(),
  });

  const [selectedDocs, setSelectedDocs] = useState<string[]>(["nda", "service_agreement"]);

  const toggleDoc = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]
    );
  };

  const createClient = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/clients-full", {
        ...clientInfo,
        documents: selectedDocs,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Client created successfully!",
        description: `${clientInfo.name} has been onboarded. Onboarding tasks and documents created.`,
      });
      onCreated(data.user.id);
    },
    onError: (e: any) => {
      toast({ title: "Error creating client", description: e.message, variant: "destructive" });
    },
  });

  const serviceInfo = SERVICE_MILESTONES[clientInfo.serviceType];

  // Step validation
  const step1Valid =
    clientInfo.name.trim() &&
    clientInfo.email.trim() &&
    clientInfo.brandName.trim() &&
    clientInfo.serviceType &&
    clientInfo.startDate &&
    clientInfo.accessCode.trim();

  return (
    <div>
      <StepIndicator current={step} />

      {/* Step 1: Client Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={clientInfo.name}
                onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={clientInfo.email}
                onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                placeholder="jane@brand.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Brand Name *</Label>
            <Input
              value={clientInfo.brandName}
              onChange={(e) => setClientInfo({ ...clientInfo, brandName: e.target.value })}
              placeholder="Jane's Brand Co."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Service Type *</Label>
            <Select
              value={clientInfo.serviceType}
              onValueChange={(v) => setClientInfo({ ...clientInfo, serviceType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service..." />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Start Date *</Label>
            <Input
              type="date"
              value={clientInfo.startDate}
              onChange={(e) => setClientInfo({ ...clientInfo, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Access Code *</Label>
            <div className="flex gap-2">
              <Input
                value={clientInfo.accessCode}
                onChange={(e) => setClientInfo({ ...clientInfo, accessCode: e.target.value })}
                placeholder="LEAAXXXX"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setClientInfo({ ...clientInfo, accessCode: generateAccessCode() })}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Legal Documents */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-foreground font-medium mb-1">Select documents to send</p>
            <p className="text-xs text-muted-foreground">
              Selected documents will be created from templates and sent to {clientInfo.name || "the client"}.
            </p>
          </div>
          <div className="space-y-3">
            {DOCUMENT_OPTIONS.map((doc) => {
              const checked = selectedDocs.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked ? "border-[#B7542E]/40 bg-[#B7542E]/5" : "border-border hover:bg-muted/20"
                  }`}
                  onClick={() => !doc.required && toggleDoc(doc.id)}
                >
                  <Checkbox
                    checked={checked}
                    disabled={doc.required}
                    onCheckedChange={() => !doc.required && toggleDoc(doc.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{doc.label}</p>
                    {doc.required && (
                      <p className="text-xs text-muted-foreground">Required for all clients</p>
                    )}
                  </div>
                  <FileText className={`w-4 h-4 ${checked ? "text-[#B7542E]" : "text-muted-foreground/40"}`} />
                </div>
              );
            })}
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground">
              <strong>{selectedDocs.length}</strong> document{selectedDocs.length !== 1 ? "s" : ""} will be created
              with status "Sent" and due within 7 days.
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Project Setup */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-foreground font-medium mb-1">Project & Milestone Preview</p>
            <p className="text-xs text-muted-foreground">
              Based on the selected service type, the following will be auto-created:
            </p>
          </div>
          {clientInfo.serviceType && serviceInfo ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="w-4 h-4 text-[#B7542E]" />
                  <p className="text-sm font-medium">
                    {clientInfo.brandName || "Brand"} — {clientInfo.serviceType}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{serviceInfo.desc}</p>
              </div>

              <div className="space-y-2">
                {Array.from({ length: serviceInfo.sessions }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40">
                    <div className="w-6 h-6 rounded-full bg-[#B7542E]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#B7542E]">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {clientInfo.serviceType.includes("Concept")
                          ? ["Understanding the Vision", "Customer Profile Development", "Design & Fabric Selection", "Design Development"][i]
                          : `Month ${i + 1} Retainer`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {clientInfo.serviceType.includes("Concept")
                          ? ["6 hrs — $450", "16 hrs — $1,200", "8 hrs — $600", "6 hrs — $450"][i]
                          : `${clientInfo.serviceType.includes("5hr") ? 5 : clientInfo.serviceType.includes("10hr") ? 10 : 20} hours`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-xs font-medium text-blue-700 mb-1">Auto-generated onboarding tasks:</p>
                <ul className="text-xs text-blue-600/80 space-y-0.5 list-disc list-inside">
                  <li>Send NDA (urgent — due tomorrow)</li>
                  <li>Send Service Agreement (urgent — due tomorrow)</li>
                  <li>Schedule Session 1 (high — due in 3 days)</li>
                  <li>Set up Google Drive folder (normal — due in 2 days)</li>
                  <li>Send welcome email (high — due tomorrow)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No service type selected
            </div>
          )}
        </div>
      )}

      {/* Step 4: Review & Create */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-foreground font-medium mb-1">Review Before Creating</p>
            <p className="text-xs text-muted-foreground">
              Confirm all details are correct, then click "Create Client & Send Welcome" to proceed.
            </p>
          </div>

          <div className="space-y-3">
            {/* Client Info Summary */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Client</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{clientInfo.name}</span>
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{clientInfo.email}</span>
                <span className="text-muted-foreground">Brand</span>
                <span className="font-medium">{clientInfo.brandName}</span>
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{clientInfo.serviceType}</span>
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium">{clientInfo.startDate}</span>
                <span className="text-muted-foreground">Access Code</span>
                <span className="font-mono font-medium">{clientInfo.accessCode}</span>
              </div>
            </div>

            {/* Documents */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Documents ({selectedDocs.length})
              </p>
              <ul className="space-y-1">
                {selectedDocs.map((d) => {
                  const doc = DOCUMENT_OPTIONS.find((o) => o.id === d);
                  return (
                    <li key={d} className="flex items-center gap-2 text-xs">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>{doc?.label || d}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* What will be created */}
            <div className="p-3 rounded-lg bg-[#B7542E]/5 border border-[#B7542E]/20">
              <p className="text-xs font-semibold text-[#B7542E] uppercase tracking-wider mb-2">
                Will be created
              </p>
              <ul className="text-xs text-foreground/80 space-y-0.5 list-disc list-inside">
                <li>Client user account</li>
                <li>
                  Project with {serviceInfo?.sessions || "—"} milestones & sub-milestones
                </li>
                <li>{selectedDocs.length} legal document(s) — status: Sent</li>
                <li>5 onboarding admin tasks</li>
                <li>Admin notification for new client</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/40">
        <Button
          variant="outline"
          onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
        >
          {step === 1 ? "Cancel" : (
            <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>
          )}
        </Button>
        {step < 4 ? (
          <Button
            className="bg-[#B7542E] hover:bg-[#a3472a] text-white"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && !step1Valid}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            className="bg-[#B7542E] hover:bg-[#a3472a] text-white"
            onClick={() => createClient.mutate()}
            disabled={createClient.isPending}
          >
            {createClient.isPending ? "Creating..." : "Create Client & Send Welcome"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AdminClients() {
  const [, navigate] = useLocation();
  const [showWizard, setShowWizard] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/clients"],
  });

  const handleCreated = (clientId: number) => {
    setShowWizard(false);
    setSuccessBanner("Client created successfully! Onboarding tasks and documents are ready.");
    navigate(`/admin/clients/${clientId}`);
  };

  const getStatusColor = (status: string) => {
    if (status === "active") return "border-green-500/40 text-green-600 bg-green-500/5";
    if (status === "paused") return "border-amber-500/40 text-amber-600 bg-amber-500/5";
    return "border-border text-muted-foreground";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Success Banner */}
      {successBanner && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 text-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successBanner}</span>
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5 ml-auto text-green-600 hover:bg-green-500/10"
            onClick={() => setSuccessBanner(null)}
          >
            ×
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Playfair_Display']">
            Client Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clients.length} total client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setShowWizard(true)}
          className="bg-[#B7542E] hover:bg-[#a3472a] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Client
        </Button>
      </div>

      {/* Clients Table */}
      <Card className="bg-card border border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-1 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-16">
              <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No clients yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Add your first client to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Client</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Brand</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider hidden md:table-cell">Service</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider hidden lg:table-cell">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider hidden lg:table-cell">Progress</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client: any) => (
                    <tr
                      key={client.id}
                      className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/clients/${client.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#B7542E]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[#B7542E]">
                              {client.name.split(" ").map((n: string) => n[0]).join("")}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{client.brandName}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-muted-foreground">{client.project?.serviceType || "—"}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(client.project?.status || "")}`}
                        >
                          {client.project?.status || "no project"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[60px]">
                            <div
                              className="h-full bg-[#B7542E] rounded-full transition-all"
                              style={{ width: `${client.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{client.overallProgress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/clients/${client.id}`);
                          }}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Playfair_Display']">New Client Onboarding</DialogTitle>
          </DialogHeader>
          <OnboardingWizard
            onClose={() => setShowWizard(false)}
            onCreated={handleCreated}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

