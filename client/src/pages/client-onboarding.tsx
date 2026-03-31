import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Pencil,
  Search,
  Hammer,
  LayoutDashboard,
  Milestone,
  Palette,
  Package,
  FileText,
  MessageSquare,
  LifeBuoy,
  ShieldCheck,
  FileSignature,
  Lock,
  Handshake,
  ArrowRight,
  Star,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OnboardingStatusResponse {
  status: "not_started" | "in_progress" | "completed";
  completedSteps: string[];
  currentStep: string;
}

const STEP_KEYS = [
  "welcome",
  "brand_profile",
  "how_it_works",
  "portal_tour",
  "key_documents",
  "signoff",
] as const;

type StepKey = typeof STEP_KEYS[number];

// ─────────────────────────────────────────────────────────────────────────────
// Step labels for the progress bar
// ─────────────────────────────────────────────────────────────────────────────

const STEP_LABELS: Record<StepKey, string> = {
  welcome: "Welcome",
  brand_profile: "Your Brand",
  how_it_works: "How It Works",
  portal_tour: "Portal Tour",
  key_documents: "Documents",
  signoff: "Sign-Off",
};

// ─────────────────────────────────────────────────────────────────────────────
// LEAA SVG Logo
// ─────────────────────────────────────────────────────────────────────────────

function LeaaLogo({ size = 48, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg
      aria-label="Lane Ellis Apparel Agency"
      viewBox="0 0 120 40"
      width={size * 3}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Needle + thread mark */}
      <circle
        cx="12"
        cy="20"
        r="9"
        stroke={light ? "#F7F4EF" : "#2D2F36"}
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="12" cy="20" r="2.5" fill="#B7542E" />
      <line
        x1="12"
        y1="11"
        x2="12"
        y2="4"
        stroke="#B7542E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* L E A A lettermark */}
      <text
        x="28"
        y="26"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="18"
        fontWeight="700"
        fill={light ? "#F7F4EF" : "#2D2F36"}
        letterSpacing="3"
      >
        LEAA
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress bar component
// ─────────────────────────────────────────────────────────────────────────────

interface StepProgressBarProps {
  currentStepIndex: number;
  completedSteps: string[];
}

function StepProgressBar({ currentStepIndex, completedSteps }: StepProgressBarProps) {
  return (
    <div className="w-full px-6 py-4 bg-white border-b border-[#EDE8E2]">
      <div className="max-w-3xl mx-auto">
        {/* Linear progress track */}
        <div className="mb-3">
          <Progress
            value={((currentStepIndex) / STEP_KEYS.length) * 100}
            className="h-1.5 bg-[#EDE8E2]"
            data-testid="onboarding-progress-bar"
          />
        </div>

        {/* Step dots + labels */}
        <div className="flex items-center justify-between">
          {STEP_KEYS.map((key, idx) => {
            const isCompleted = completedSteps.includes(key);
            const isCurrent = idx === currentStepIndex;
            const isUpcoming = idx > currentStepIndex && !isCompleted;

            return (
              <div key={key} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-center w-full">
                  {/* Connector line before */}
                  <div
                    className={`flex-1 h-px transition-colors ${
                      idx === 0 ? "invisible" : isCompleted || isCurrent ? "bg-[#B7542E]" : "bg-[#EDE8E2]"
                    }`}
                  />
                  {/* Step indicator */}
                  <div
                    data-testid={`step-indicator-${key}`}
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isCompleted
                        ? "bg-[#B7542E] text-white"
                        : isCurrent
                        ? "bg-[#2D2F36] text-white ring-2 ring-offset-2 ring-[#2D2F36]"
                        : "bg-[#EDE8E2] text-[#A5A5A5]"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={14} strokeWidth={2.5} />
                    ) : (
                      <span className="text-xs font-semibold">{idx + 1}</span>
                    )}
                  </div>
                  {/* Connector line after */}
                  <div
                    className={`flex-1 h-px transition-colors ${
                      idx === STEP_KEYS.length - 1 ? "invisible" : isCompleted ? "bg-[#B7542E]" : "bg-[#EDE8E2]"
                    }`}
                  />
                </div>
                {/* Label — hidden on small screens */}
                <span
                  className={`text-[10px] font-medium hidden sm:block text-center leading-tight ${
                    isCurrent
                      ? "text-[#2D2F36]"
                      : isCompleted
                      ? "text-[#B7542E]"
                      : "text-[#A5A5A5]"
                  }`}
                >
                  {STEP_LABELS[key]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Welcome
// ─────────────────────────────────────────────────────────────────────────────

function StepWelcome({ userName }: { userName: string }) {
  const firstName = userName.split(" ")[0];

  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
      {/* Hero section */}
      <div className="w-full rounded-2xl bg-[#2D2F36] px-8 py-14 mb-8 relative overflow-hidden">
        {/* Subtle decorative element */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-8 w-40 h-40 rounded-full border border-white" />
          <div className="absolute -bottom-8 -left-8 w-56 h-56 rounded-full border border-white" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          <LeaaLogo size={40} light />
          <div>
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#F7F4EF] leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              data-testid="welcome-heading"
            >
              Welcome to the LEAA Portal
            </h1>
            <p className="mt-3 text-[#D9C9B6] text-lg font-light">
              Lane Ellis Apparel Agency
            </p>
          </div>
        </div>
      </div>

      {/* Welcome copy */}
      <div className="w-full text-left space-y-4">
        <p className="text-xl text-[#2D2F36] font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          Hello, {firstName}. We're glad you're here.
        </p>
        <p className="text-[#555] leading-relaxed">
          Your journey from concept to collection starts here. This short walkthrough
          will introduce you to the LEAA process, show you how the portal works, and
          make sure you have everything you need before your project begins.
        </p>
        <p className="text-[#555] leading-relaxed">
          It takes about three minutes. At the end, you'll provide a digital
          acknowledgement before accessing your portal dashboard.
        </p>

        {/* Callout */}
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#F7F4EF] border border-[#EDE8E2] p-4">
          <Sparkles size={20} className="text-[#B7542E] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#555]">
            <span className="font-semibold text-[#2D2F36]">Your project, your approvals, your final say.</span>
            {" "}Every major decision requires your sign-off before LEAA proceeds. You are always in control.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Brand Profile
// ─────────────────────────────────────────────────────────────────────────────

interface StepBrandProfileProps {
  userName: string;
  brandName: string;
  brandVision: string;
  onBrandVisionChange: (v: string) => void;
}

function StepBrandProfile({
  userName,
  brandName,
  brandVision,
  onBrandVisionChange,
}: StepBrandProfileProps) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2
          className="text-2xl font-bold text-[#2D2F36]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          data-testid="brand-profile-heading"
        >
          Your Brand Profile
        </h2>
        <p className="mt-2 text-[#777]">
          We've set up your portal around your brand. Let's confirm a few details.
        </p>
      </div>

      {/* Profile card */}
      <Card className="border border-[#EDE8E2] shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-[#A5A5A5] font-semibold">
                Client Name
              </Label>
              <p
                className="mt-1 text-[#2D2F36] font-semibold text-lg"
                data-testid="profile-client-name"
              >
                {userName}
              </p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-[#A5A5A5] font-semibold">
                Brand Name
              </Label>
              <p
                className="mt-1 text-[#2D2F36] font-semibold text-lg"
                data-testid="profile-brand-name"
              >
                {brandName}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#EDE8E2] flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-[#F7F4EF] text-[#B7542E] border border-[#EDE8E2] text-xs"
            >
              <CheckCircle2 size={11} className="mr-1" />
              Portal Access Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Brand vision input */}
      <div className="space-y-2">
        <Label
          htmlFor="brand-vision"
          className="text-sm font-semibold text-[#2D2F36]"
        >
          Brand Vision{" "}
          <span className="font-normal text-[#A5A5A5]">(optional)</span>
        </Label>
        <Textarea
          id="brand-vision"
          data-testid="input-brand-vision"
          placeholder="In a few words, describe what you want your brand to stand for. E.g. 'Elevated everyday basics for modern women.'"
          value={brandVision}
          onChange={(e) => onBrandVisionChange(e.target.value)}
          className="resize-none min-h-[100px] border-[#D9C9B6] focus:border-[#B7542E] focus:ring-[#B7542E]"
          maxLength={500}
        />
        <p className="text-xs text-[#A5A5A5]">
          This helps us personalise your portal experience. You can update it anytime in your profile.
        </p>
      </div>

      {/* Reassurance callout */}
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#FDF9F5] border border-[#EDE8E2] p-4">
        <Star size={18} className="text-[#B7542E] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#555]">
          If anything looks incorrect above, contact your LEAA team through the{" "}
          <span className="font-semibold text-[#2D2F36]">Messages</span> section
          after completing onboarding and we'll update your details right away.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: How LEAA Works
// ─────────────────────────────────────────────────────────────────────────────

const PROCESS_STEPS = [
  {
    icon: Lightbulb,
    label: "Concept",
    description: "We define your brand identity, target customer, and product direction through deep discovery sessions.",
  },
  {
    icon: Pencil,
    label: "Design",
    description: "Sketches, mood boards, and technical specifications are created and submitted for your approval.",
  },
  {
    icon: Search,
    label: "Source",
    description: "We identify the right fabrics, trims, and manufacturing partners that match your quality and budget.",
  },
  {
    icon: Hammer,
    label: "Produce",
    description: "Samples are made, reviewed, and refined until you sign off. Production begins only with your approval.",
  },
];

function StepHowItWorks() {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2
          className="text-2xl font-bold text-[#2D2F36]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          data-testid="how-it-works-heading"
        >
          How LEAA Works
        </h2>
        <p className="mt-2 text-[#777]">
          A structured, client-guided process from first idea to finished collection.
        </p>
      </div>

      {/* 4-step process grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {PROCESS_STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Card
              key={step.label}
              className="border border-[#EDE8E2] shadow-sm hover:shadow-md transition-shadow"
              data-testid={`process-step-${idx + 1}`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#2D2F36] flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-[#D9C9B6]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#B7542E] uppercase tracking-widest">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="font-bold text-[#2D2F36] text-base"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-[#666] leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Flow connector */}
      <div className="flex items-center gap-2 justify-center text-[#A5A5A5] text-xs font-medium mb-6">
        {["Concept", "Design", "Source", "Produce"].map((label, idx, arr) => (
          <span key={label} className="flex items-center gap-2">
            <span className="text-[#2D2F36] font-semibold">{label}</span>
            {idx < arr.length - 1 && <ArrowRight size={12} className="text-[#B7542E]" />}
          </span>
        ))}
      </div>

      {/* Key principles */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl bg-[#2D2F36] p-4">
          <ShieldCheck size={18} className="text-[#D9C9B6] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#F7F4EF]">
            <span className="font-semibold">We are not the brand — we are the guide.</span>{" "}
            Your project, your approvals, your final say. LEAA brings the expertise;
            you bring the vision.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-[#FDF9F5] border border-[#EDE8E2] p-4">
          <CheckCircle2 size={18} className="text-[#B7542E] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#555]">
            <span className="font-semibold text-[#2D2F36]">Every major decision requires your sign-off before we proceed.</span>{" "}
            Gate approvals are built into every milestone. Nothing moves forward without
            your explicit confirmation in the portal.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Portal Tour
// ─────────────────────────────────────────────────────────────────────────────

const PORTAL_SECTIONS = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    description: "Your project at a glance — progress, upcoming sessions, and recent activity.",
    path: "/",
  },
  {
    icon: Milestone,
    label: "Milestone Tracker",
    description: "Follow every step of development from concept to finished collection.",
    path: "/milestones",
  },
  {
    icon: Palette,
    label: "Design Board",
    description: "Review mood boards, sketches, and tech packs submitted by your LEAA team.",
    path: "/design-board",
  },
  {
    icon: Package,
    label: "Materials & Sourcing",
    description: "Fabric selections, trims, cost breakdowns, and supplier information.",
    path: "/sourcing",
  },
  {
    icon: FileText,
    label: "Documents",
    description: "Legal agreements, phase approvals, and sign-off documents — all in one place.",
    path: "/documents",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    description: "Your direct line to the LEAA team for project updates and questions.",
    path: "/messages",
  },
  {
    icon: LifeBuoy,
    label: "Support",
    description: "Submit tickets for revision requests, scheduling changes, or general questions.",
    path: "/support",
  },
] as const;

function StepPortalTour() {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2
          className="text-2xl font-bold text-[#2D2F36]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          data-testid="portal-tour-heading"
        >
          Your Portal At a Glance
        </h2>
        <p className="mt-2 text-[#777]">
          Here's where to find everything you need throughout your project.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PORTAL_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.label}
              className="flex items-start gap-3 rounded-xl border border-[#EDE8E2] bg-white p-4 hover:border-[#D9C9B6] hover:bg-[#FDF9F5] transition-all"
              data-testid={`portal-section-${section.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#F7F4EF] border border-[#EDE8E2] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={15} className="text-[#B7542E]" />
              </div>
              <div>
                <p className="font-semibold text-[#2D2F36] text-sm leading-snug">
                  {section.label}
                </p>
                <p className="text-xs text-[#777] mt-0.5 leading-relaxed">
                  {section.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#FDF9F5] border border-[#EDE8E2] p-4">
        <Handshake size={18} className="text-[#B7542E] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#555]">
          All communication and approvals happen <span className="font-semibold text-[#2D2F36]">inside this portal</span>.
          This keeps your project timeline accurate and creates a clear record of every decision.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5: Key Documents
// ─────────────────────────────────────────────────────────────────────────────

const KEY_DOCS = [
  {
    icon: Lock,
    label: "Mutual Non-Disclosure Agreement (NDA)",
    description: "Protects your brand concepts, designs, and business information shared with LEAA.",
    when: "Before project begins",
  },
  {
    icon: FileSignature,
    label: "Service Agreement",
    description: "Defines the scope of work, session schedule, deliverables, and payment terms.",
    when: "Before project begins",
  },
  {
    icon: CheckCircle2,
    label: "Phase Sign-Off Documents",
    description: "Formal confirmations that you've reviewed and approved each completed phase of development.",
    when: "At each milestone gate",
  },
];

function StepKeyDocuments() {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2
          className="text-2xl font-bold text-[#2D2F36]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          data-testid="key-documents-heading"
        >
          Key Documents
        </h2>
        <p className="mt-2 text-[#777]">
          Before your project begins, you'll review and sign key legal documents directly in the portal.
        </p>
      </div>

      {/* Document list */}
      <div className="space-y-4 mb-8">
        {KEY_DOCS.map((doc, idx) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.label}
              className="flex items-start gap-4 rounded-xl border border-[#EDE8E2] bg-white p-5"
              data-testid={`key-doc-${idx + 1}`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#2D2F36] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={16} className="text-[#D9C9B6]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-[#2D2F36] text-sm leading-snug">
                    {doc.label}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-medium text-[#B7542E] border-[#D9C9B6] bg-[#FDF9F5] flex-shrink-0"
                  >
                    {doc.when}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[#777] leading-relaxed">
                  {doc.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Documents path note */}
      <div className="flex items-start gap-3 rounded-xl bg-[#2D2F36] p-4 mb-4">
        <FileText size={18} className="text-[#D9C9B6] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#F7F4EF]">
          All documents live in the{" "}
          <span className="font-semibold text-[#D9C9B6]">Documents</span> section
          of your portal. You'll receive a notification when each document is ready
          for your review and signature.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-[#FDF9F5] border border-[#EDE8E2] p-4">
        <ShieldCheck size={18} className="text-[#B7542E] mt-0.5 flex-shrink-0" />
        <p className="text-sm text-[#555]">
          <span className="font-semibold text-[#2D2F36]">We take protecting your brand as seriously as you do.</span>{" "}
          All documents are stored securely and accessible only to you and the LEAA team.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 6: Sign-Off
// ─────────────────────────────────────────────────────────────────────────────

const ACKNOWLEDGEMENTS = [
  "I understand the LEAA development process (Concept → Design → Source → Produce).",
  "I will provide timely approvals at each milestone gate so my project stays on schedule.",
  "I agree to communicate through the portal for all project-related matters.",
  "I have reviewed the portal features and understand how to navigate my dashboard.",
];

interface StepSignOffProps {
  userName: string;
  acknowledged: boolean;
  onAcknowledgedChange: (v: boolean) => void;
  signatureName: string;
  onSignatureNameChange: (v: string) => void;
  isSubmitting: boolean;
}

function StepSignOff({
  userName,
  acknowledged,
  onAcknowledgedChange,
  signatureName,
  onSignatureNameChange,
  isSubmitting,
}: StepSignOffProps) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h2
          className="text-2xl font-bold text-[#2D2F36]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          data-testid="signoff-heading"
        >
          Acknowledgement & Sign-Off
        </h2>
        <p className="mt-2 text-[#777]">
          Almost done. By completing this onboarding, you acknowledge the following:
        </p>
      </div>

      {/* Acknowledgements list */}
      <Card className="border border-[#EDE8E2] shadow-sm mb-6">
        <CardContent className="p-6">
          <ul className="space-y-4">
            {ACKNOWLEDGEMENTS.map((text, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3"
                data-testid={`acknowledgement-${idx + 1}`}
              >
                <CheckCircle2
                  size={16}
                  className="text-[#B7542E] mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-[#444] leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Checkbox agreement */}
      <div
        className="flex items-start gap-3 rounded-xl border border-[#EDE8E2] bg-[#FDF9F5] p-4 mb-6 cursor-pointer"
        onClick={() => onAcknowledgedChange(!acknowledged)}
      >
        <Checkbox
          id="acknowledge-checkbox"
          data-testid="checkbox-acknowledge"
          checked={acknowledged}
          onCheckedChange={(v) => onAcknowledgedChange(Boolean(v))}
          className="mt-0.5 border-[#B7542E] data-[state=checked]:bg-[#B7542E] data-[state=checked]:border-[#B7542E]"
          onClick={(e) => e.stopPropagation()}
        />
        <Label
          htmlFor="acknowledge-checkbox"
          className="text-sm font-semibold text-[#2D2F36] leading-relaxed cursor-pointer"
        >
          I acknowledge and agree to the terms above.
        </Label>
      </div>

      {/* Digital signature */}
      <div className="space-y-2 mb-2">
        <Label
          htmlFor="signature-name"
          className="text-sm font-semibold text-[#2D2F36]"
        >
          Digital Signature — Type Your Full Name
        </Label>
        <Input
          id="signature-name"
          data-testid="input-signature-name"
          placeholder={`e.g. ${userName}`}
          value={signatureName}
          onChange={(e) => onSignatureNameChange(e.target.value)}
          className="border-[#D9C9B6] focus:border-[#B7542E] focus:ring-[#B7542E] font-medium text-[#2D2F36]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          disabled={isSubmitting}
        />
        <p className="text-xs text-[#A5A5A5]">
          Typing your full name serves as your digital signature and confirms your agreement.
        </p>
      </div>

      {/* Validation hint */}
      {!acknowledged && (
        <p className="text-xs text-[#B7542E] mt-3 flex items-center gap-1.5">
          <Circle size={10} fill="currentColor" />
          Please check the acknowledgement box above to continue.
        </p>
      )}
      {acknowledged && !signatureName.trim() && (
        <p className="text-xs text-[#B7542E] mt-3 flex items-center gap-1.5">
          <Circle size={10} fill="currentColor" />
          Please type your full name to complete your sign-off.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ClientOnboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClientHook = useQueryClient();
  const { toast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [brandVision, setBrandVision] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const currentStepKey = STEP_KEYS[currentStepIndex];

  // ── Fetch current onboarding status ───────────────────────────────────────
  const { data: statusData, isLoading: isStatusLoading } =
    useQuery<OnboardingStatusResponse>({
      queryKey: ["/api/onboarding/status"],
      retry: false,
    });

  // Initialise step from saved progress
  useEffect(() => {
    if (statusData) {
      setCompletedSteps(statusData.completedSteps);

      // Resume from the furthest completed step + 1
      const lastCompletedIndex = statusData.completedSteps.reduce(
        (max, step) => {
          const idx = STEP_KEYS.indexOf(step as StepKey);
          return idx > max ? idx : max;
        },
        -1
      );
      if (lastCompletedIndex >= 0 && lastCompletedIndex + 1 < STEP_KEYS.length) {
        setCurrentStepIndex(lastCompletedIndex + 1);
      }
    }
  }, [statusData]);

  // ── Mutation: complete a step ──────────────────────────────────────────────
  const completeStepMutation = useMutation({
    mutationFn: async ({
      step,
      data,
    }: {
      step: string;
      data?: string;
    }) => {
      const res = await apiRequest("POST", "/api/onboarding/complete-step", {
        step,
        data,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setCompletedSteps(data.completedSteps ?? []);
      queryClientHook.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "We couldn't save your progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  // ── Mutation: complete onboarding ──────────────────────────────────────────
  const completeOnboardingMutation = useMutation({
    mutationFn: async (signatureText: string) => {
      const res = await apiRequest("POST", "/api/onboarding/complete", {
        signatureText,
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate auth — next /api/auth/me will return updated onboardingStatus
      queryClientHook.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClientHook.invalidateQueries({ queryKey: ["/api/onboarding/status"] });

      toast({
        title: "Welcome to LEAA!",
        description: "Your onboarding is complete. Your dashboard is ready.",
      });

      // Navigate to dashboard after a brief moment
      setTimeout(() => navigate("/"), 800);
    },
    onError: () => {
      toast({
        title: "Sign-off failed",
        description: "We couldn't record your sign-off. Please try again.",
        variant: "destructive",
      });
    },
  });

  // ── Scroll to top on step change ───────────────────────────────────────────
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStepIndex]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const canAdvance =
    currentStepKey !== "signoff" ||
    (acknowledged && signatureName.trim().length > 0);

  const isLastStep = currentStepIndex === STEP_KEYS.length - 1;
  const isSubmitting = completeOnboardingMutation.isPending;

  function handleNext() {
    if (isSubmitting) return;

    const stepData =
      currentStepKey === "brand_profile" && brandVision.trim()
        ? JSON.stringify({ brandVision })
        : undefined;

    // Mark step complete then advance
    completeStepMutation.mutate(
      { step: currentStepKey, data: stepData },
      {
        onSuccess: () => {
          if (isLastStep) {
            // Last step handled by handleComplete
            return;
          }
          setCurrentStepIndex((prev) => Math.min(prev + 1, STEP_KEYS.length - 1));
        },
      }
    );

    // Optimistically advance if not last step
    if (!isLastStep) {
      setCurrentStepIndex((prev) => Math.min(prev + 1, STEP_KEYS.length - 1));
    }
  }

  function handleBack() {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }

  function handleComplete() {
    if (!canAdvance || isSubmitting) return;

    // Also complete the signoff step record
    completeStepMutation.mutate({
      step: "signoff",
      data: JSON.stringify({ signatureText: signatureName }),
    });

    completeOnboardingMutation.mutate(signatureName.trim());
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isStatusLoading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#B7542E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#A5A5A5]">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  // ── Completed screen ───────────────────────────────────────────────────────
  if (statusData?.status === "completed" && !completeOnboardingMutation.isPending) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-[#B7542E] flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h2
            className="text-2xl font-bold text-[#2D2F36] mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Onboarding Complete
          </h2>
          <p className="text-[#777] mb-6">
            You've already completed your portal onboarding. Redirecting you to
            your dashboard...
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-[#B7542E] hover:bg-[#9e4627] text-white"
            data-testid="button-go-to-dashboard"
          >
            Go to Dashboard
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col" data-testid="onboarding-page">
      {/* Sticky progress bar */}
      <div className="sticky top-0 z-20">
        <StepProgressBar
          currentStepIndex={currentStepIndex}
          completedSteps={completedSteps}
        />
      </div>

      {/* Scrollable content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 90px)" }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-32">
          {/* Step counter */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-bold text-[#B7542E] uppercase tracking-widest">
              Step {currentStepIndex + 1} of {STEP_KEYS.length}
            </span>
            <span className="text-[#EDE8E2]">·</span>
            <span className="text-xs text-[#A5A5A5] font-medium">
              {STEP_LABELS[currentStepKey]}
            </span>
          </div>

          {/* Animated step content */}
          <div
            key={currentStepKey}
            className="animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {currentStepKey === "welcome" && (
              <StepWelcome userName={user?.name ?? ""} />
            )}
            {currentStepKey === "brand_profile" && (
              <StepBrandProfile
                userName={user?.name ?? ""}
                brandName={user?.brandName ?? ""}
                brandVision={brandVision}
                onBrandVisionChange={setBrandVision}
              />
            )}
            {currentStepKey === "how_it_works" && <StepHowItWorks />}
            {currentStepKey === "portal_tour" && <StepPortalTour />}
            {currentStepKey === "key_documents" && <StepKeyDocuments />}
            {currentStepKey === "signoff" && (
              <StepSignOff
                userName={user?.name ?? ""}
                acknowledged={acknowledged}
                onAcknowledgedChange={setAcknowledged}
                signatureName={signatureName}
                onSignatureNameChange={setSignatureName}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#EDE8E2] shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || completeStepMutation.isPending}
            className="text-[#777] hover:text-[#2D2F36] disabled:opacity-30"
            data-testid="button-back"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back
          </Button>

          {/* Step hint */}
          <p className="text-xs text-[#A5A5A5] hidden sm:block text-center flex-1">
            {isLastStep
              ? "Review your acknowledgements, then complete your sign-off."
              : `${STEP_KEYS.length - currentStepIndex - 1} step${STEP_KEYS.length - currentStepIndex - 1 !== 1 ? "s" : ""} remaining`}
          </p>

          {/* Continue / Complete button */}
          {isLastStep ? (
            <Button
              onClick={handleComplete}
              disabled={!canAdvance || isSubmitting}
              className="bg-[#B7542E] hover:bg-[#9e4627] text-white font-semibold px-6 disabled:opacity-40 min-w-[160px]"
              data-testid="button-complete-onboarding"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Completing...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Complete Onboarding
                  <CheckCircle2 size={15} />
                </span>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={completeStepMutation.isPending}
              className="bg-[#2D2F36] hover:bg-[#1e2028] text-white font-semibold px-6 min-w-[120px]"
              data-testid="button-continue"
            >
              {completeStepMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Continue
                  <ChevronRight size={15} />
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

