/**
 * ProjectTracker — LEAA Portal project health dashboard
 *
 * Drop-in replacement for the "Overall Progress" card at the top of
 * milestones.tsx. Self-contained: owns its own useQuery for
 * /api/projects/:id/tracker.
 *
 * Sections:
 *   A — Stats strip (days elapsed, progress, sessions, deliverables, pending)
 *   B — Visual Gantt-style phase timeline (SVG, no charting library)
 *   C — Lead-time metrics: circular arc (days) + phase health table
 *   D — Delay alert banner (conditional)
 */

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  FileCheck,
  ClipboardList,
} from "lucide-react";
import { format, parseISO } from "date-fns";

// ── Brand tokens ─────────────────────────────────────────────────────────────
const BRAND = {
  charcoal: "#2D2F36",
  sand: "#D9C9B6",
  ivory: "#F7F4EF",
  terracotta: "#B7542E",
  softGrey: "#A5A5A5",
  green: "#3D8F5F",
  amber: "#C97D2E",
  red: "#C0392B",
} as const;

// ── Types ────────────────────────────────────────────────────────────────────
interface TrackerPhase {
  name: string;
  status: "completed" | "in_progress" | "not_started";
  startedAt: string | null;
  completedAt: string | null;
  daysPlanned: number;
  daysActual: number | null;
}

interface TrackerDelay {
  phase: string;
  plannedDays: number;
  actualDays: number;
  delayDays: number;
  reason: string;
}

interface TrackerData {
  project: {
    name: string;
    serviceType: string;
    startDate: string;
    endDate: string | null;
    status: string;
  };
  timeline: {
    totalDays: number;
    daysElapsed: number;
    daysRemaining: number;
    percentElapsed: number;
    isOverdue: boolean;
    estimatedCompletion: string | null;
  };
  progress: {
    overallPercent: number;
    sessionsCompleted: number;
    sessionsTotal: number;
    currentSession: string | null;
    milestonesCompleted: number;
    milestonesTotal: number;
    deliverablesReady: number;
    deliverablesTotal: number;
    pendingApprovals: number;
    pendingDocuments: number;
  };
  phases: TrackerPhase[];
  delays: TrackerDelay[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function phaseHealth(
  phase: TrackerPhase
): "on_track" | "slight_delay" | "significant_delay" | "pending" {
  if (phase.status === "not_started") return "pending";
  if (phase.daysActual === null) return "on_track";
  const ratio = phase.daysActual / phase.daysPlanned;
  if (ratio <= 1.1) return "on_track";
  if (ratio <= 1.4) return "slight_delay";
  return "significant_delay";
}

const healthColors: Record<string, string> = {
  on_track: BRAND.green,
  slight_delay: BRAND.amber,
  significant_delay: BRAND.red,
  pending: BRAND.softGrey,
};

const healthLabels: Record<string, string> = {
  on_track: "On Track",
  slight_delay: "Slight Delay",
  significant_delay: "Significant Delay",
  pending: "Not Started",
};

// ── Section A — Stat Card ────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-white/60 border border-[#D9C9B6]/60 min-w-[110px] flex-1">
      <div className="flex items-center gap-1.5">
        <Icon
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: accent ?? BRAND.softGrey }}
        />
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#A5A5A5]">
          {label}
        </span>
      </div>
      <span
        className="text-xl font-bold leading-none"
        style={{ color: accent ?? BRAND.charcoal }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-[#A5A5A5] leading-tight">{sub}</span>
      )}
    </div>
  );
}

// ── Section B — Timeline ─────────────────────────────────────────────────────
function TimelineBar({
  phases,
  percentElapsed,
  isOverdue,
}: {
  phases: TrackerPhase[];
  percentElapsed: number;
  isOverdue: boolean;
}) {
  const total = phases.reduce((s, p) => s + p.daysPlanned, 0);
  if (total === 0) return null;

  const clampedElapsed = Math.min(100, percentElapsed);

  return (
    <div className="space-y-3">
      {/* Main bar */}
      <div className="relative h-10 rounded-xl overflow-hidden bg-[#F0EBE3] border border-[#D9C9B6]/50">
        {/* Phase segments */}
        <div className="absolute inset-0 flex">
          {phases.map((phase, i) => {
            const width = (phase.daysPlanned / total) * 100;
            const health = phaseHealth(phase);
            let bg: string;
            if (phase.status === "completed") {
              bg = BRAND.green;
            } else if (phase.status === "in_progress") {
              // Animated terracotta gradient
              bg = `linear-gradient(90deg, ${BRAND.terracotta}cc, ${BRAND.terracotta})`;
            } else {
              bg = "transparent";
            }

            return (
              <div
                key={i}
                className="relative flex items-center justify-center h-full transition-all"
                style={{
                  width: `${width}%`,
                  background: bg,
                  borderRight:
                    i < phases.length - 1 ? "1px solid rgba(255,255,255,0.3)" : "none",
                }}
              >
                {/* Delay overflow indicator */}
                {health === "significant_delay" && phase.status === "in_progress" && (
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      background: `repeating-linear-gradient(45deg, ${BRAND.red}, ${BRAND.red} 4px, transparent 4px, transparent 12px)`,
                    }}
                  />
                )}
                {/* In-progress shimmer */}
                {phase.status === "in_progress" && (
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)`,
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <span className="text-[9px] font-semibold text-white/90 px-1 truncate z-10 relative select-none">
                  S{i + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Today marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 z-20 flex flex-col items-center"
          style={{
            left: `${clampedElapsed}%`,
            background: isOverdue ? BRAND.red : BRAND.charcoal,
          }}
        >
          {/* Needle cap */}
          <div
            className="w-2 h-2 rounded-full mt-1 shrink-0"
            style={{ background: isOverdue ? BRAND.red : BRAND.charcoal }}
          />
        </div>
      </div>

      {/* Phase labels row */}
      <div className="flex text-[10px] text-[#A5A5A5]">
        {phases.map((phase, i) => {
          const width = (phase.daysPlanned / total) * 100;
          const health = phaseHealth(phase);
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-0.5 text-center"
              style={{ width: `${width}%` }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: healthColors[health] }}
              />
              <span
                className="leading-tight px-1 font-medium"
                style={{
                  color:
                    phase.status === "not_started"
                      ? BRAND.softGrey
                      : phase.status === "in_progress"
                      ? BRAND.terracotta
                      : BRAND.green,
                }}
              >
                {phase.name.length > 18
                  ? phase.name.slice(0, 16) + "…"
                  : phase.name}
              </span>
              {phase.daysActual !== null && (
                <span className="text-[9px] text-[#A5A5A5]">
                  {phase.daysActual}d / {phase.daysPlanned}d
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Today label */}
      <div className="relative h-4">
        <div
          className="absolute text-[10px] font-semibold -translate-x-1/2"
          style={{
            left: `${clampedElapsed}%`,
            color: isOverdue ? BRAND.red : BRAND.charcoal,
          }}
        >
          Today
        </div>
      </div>
    </div>
  );
}

// ── Section C — Arc Clock ────────────────────────────────────────────────────
function ArcClock({
  daysElapsed,
  totalDays,
  isOverdue,
}: {
  daysElapsed: number;
  totalDays: number;
  isOverdue: boolean;
}) {
  const r = 40;
  const cx = 52;
  const cy = 52;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(1, daysElapsed / Math.max(1, totalDays));
  const dashOffset = circumference * (1 - pct);
  const strokeColor = isOverdue ? BRAND.red : BRAND.terracotta;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="104" height="104" viewBox="0 0 104 104">
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#E8E1D8"
            strokeWidth="9"
          />
          {/* Progress arc — start at top (−90°) */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px`, transform: "rotate(-90deg)" }}
          />
          {/* Center text */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fontSize="18"
            fontWeight="700"
            fill={BRAND.charcoal}
            fontFamily="inherit"
          >
            {daysElapsed}
          </text>
          <text
            x={cx}
            y={cy + 9}
            textAnchor="middle"
            fontSize="9"
            fill={BRAND.softGrey}
            fontFamily="inherit"
          >
            of {totalDays}d
          </text>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-[#2D2F36]">Project Timeline</p>
        <p className="text-[10px] text-[#A5A5A5]">
          {isOverdue ? "Overdue" : `${Math.round(pct * 100)}% elapsed`}
        </p>
      </div>
    </div>
  );
}

// ── Section C — Phase Health List ────────────────────────────────────────────
function PhaseHealthList({ phases }: { phases: TrackerPhase[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-[#2D2F36] mb-0.5">Phase Health</p>
      {phases.map((phase, i) => {
        const health = phaseHealth(phase);
        const color = healthColors[health];
        return (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/70 border border-[#D9C9B6]/40"
          >
            {/* Status dot + session label */}
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#2D2F36] truncate">
                S{i + 1}: {phase.name.length > 22 ? phase.name.slice(0, 20) + "…" : phase.name}
              </p>
              <p className="text-[10px] text-[#A5A5A5]">
                {phase.daysActual !== null
                  ? `${phase.daysActual}d actual · ${phase.daysPlanned}d planned`
                  : `${phase.daysPlanned}d planned`}
              </p>
            </div>
            <span
              className="text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded-md"
              style={{
                color,
                background: color + "18",
              }}
            >
              {healthLabels[health]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Section D — Delay Alerts ─────────────────────────────────────────────────
function DelayAlerts({ delays }: { delays: TrackerDelay[] }) {
  if (delays.length === 0) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35 }}
        className="space-y-2"
      >
        {delays.map((d, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border"
            style={{
              background: `${BRAND.amber}12`,
              borderColor: `${BRAND.amber}40`,
            }}
          >
            <AlertTriangle
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: BRAND.amber }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#2D2F36]">
                {d.phase.length > 30 ? d.phase.slice(0, 28) + "…" : d.phase} is{" "}
                <span style={{ color: BRAND.amber }}>{d.delayDays} days</span> over
                the planned timeline
              </p>
              <p className="text-[10px] text-[#A5A5A5] mt-0.5">
                {d.reason} · Consider scheduling a focused sprint to get back on
                track
              </p>
            </div>
            <Badge
              className="shrink-0 text-[10px] font-semibold border-0"
              style={{
                background: `${BRAND.amber}22`,
                color: BRAND.amber,
              }}
            >
              +{d.delayDays}d
            </Badge>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
interface ProjectTrackerProps {
  projectId: number | undefined;
}

export default function ProjectTracker({ projectId }: ProjectTrackerProps) {
  const { data, isLoading, isError } = useQuery<TrackerData>({
    queryKey: ["/api/projects", projectId, "tracker"],
    enabled: !!projectId,
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading || !data) {
    return (
      <Card className="border-[#D9C9B6]/60 bg-[#F7F4EF]/80 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 flex-1 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-32 w-28 rounded-full" />
            <Skeleton className="h-32 flex-1 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Error / no project ───────────────────────────────────────────────────
  if (isError) {
    return (
      <Card className="border-[#D9C9B6]/60 bg-[#F7F4EF]/80 shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-[#A5A5A5]">
            Unable to load project tracker data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { project, timeline, progress, phases, delays } = data;
  const totalPending = progress.pendingApprovals + progress.pendingDocuments;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-3"
    >
      <Card
        className="border-[#D9C9B6]/60 shadow-sm overflow-hidden"
        style={{ background: "linear-gradient(135deg, #F7F4EF 0%, #F2EDE4 100%)" }}
      >
        <CardContent className="p-5 space-y-5">
          {/* ── Section A — Stats strip ───────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2
                  className="text-sm font-semibold leading-tight"
                  style={{ color: BRAND.charcoal }}
                >
                  Project Tracker
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: BRAND.softGrey }}>
                  {project.serviceType}
                  {project.startDate && (
                    <>
                      {" · Started "}
                      {format(parseISO(project.startDate), "MMM d, yyyy")}
                    </>
                  )}
                  {project.endDate && (
                    <>
                      {" · Due "}
                      {format(parseISO(project.endDate), "MMM d, yyyy")}
                    </>
                  )}
                </p>
              </div>
              <Badge
                className="text-[10px] font-semibold border-0 capitalize"
                style={
                  timeline.isOverdue
                    ? {
                        background: `${BRAND.red}18`,
                        color: BRAND.red,
                      }
                    : project.status === "completed"
                    ? {
                        background: `${BRAND.green}18`,
                        color: BRAND.green,
                      }
                    : {
                        background: `${BRAND.terracotta}18`,
                        color: BRAND.terracotta,
                      }
                }
              >
                {timeline.isOverdue ? "Overdue" : project.status}
              </Badge>
            </div>

            <div className="flex gap-2 flex-wrap">
              <StatCard
                icon={Clock}
                label="Days Elapsed"
                value={`${timeline.daysElapsed}`}
                sub={`of ${timeline.totalDays} total`}
                accent={timeline.isOverdue ? BRAND.red : BRAND.terracotta}
              />
              <StatCard
                icon={TrendingUp}
                label="Progress"
                value={`${progress.overallPercent}%`}
                sub="checkpoints done"
                accent={BRAND.charcoal}
              />
              <StatCard
                icon={ClipboardList}
                label="Session"
                value={`${progress.sessionsCompleted} / ${progress.sessionsTotal}`}
                sub="sessions complete"
                accent={BRAND.charcoal}
              />
              <StatCard
                icon={FileCheck}
                label="Deliverables"
                value={`${progress.deliverablesReady} / ${progress.deliverablesTotal}`}
                sub="files ready"
                accent={BRAND.green}
              />
              {totalPending > 0 && (
                <StatCard
                  icon={Zap}
                  label="Pending"
                  value={`${totalPending}`}
                  sub={`approval${totalPending > 1 ? "s" : ""}`}
                  accent={BRAND.amber}
                />
              )}
            </div>
          </div>

          {/* ── Section B — Gantt Timeline ────────────────────────────── */}
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: BRAND.softGrey }}
            >
              Project Timeline
            </p>
            <TimelineBar
              phases={phases}
              percentElapsed={timeline.percentElapsed}
              isOverdue={timeline.isOverdue}
            />
          </div>

          {/* ── Section C — Lead-time metrics ─────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 pt-1">
            <ArcClock
              daysElapsed={timeline.daysElapsed}
              totalDays={timeline.totalDays}
              isOverdue={timeline.isOverdue}
            />
            <PhaseHealthList phases={phases} />
          </div>

          {/* Estimated completion */}
          {timeline.estimatedCompletion && !timeline.isOverdue && progress.overallPercent < 100 && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px]"
              style={{
                borderColor: `${BRAND.sand}`,
                background: `${BRAND.sand}40`,
                color: BRAND.charcoal,
              }}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: BRAND.terracotta }} />
              <span>
                Estimated completion:{" "}
                <strong>
                  {format(parseISO(timeline.estimatedCompletion), "MMMM d, yyyy")}
                </strong>
              </span>
            </div>
          )}

          {progress.overallPercent === 100 && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px]"
              style={{
                borderColor: `${BRAND.green}40`,
                background: `${BRAND.green}12`,
                color: BRAND.green,
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold">Project complete — all checkpoints finished!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section D — Delay alerts (outside main card) ─────────────────── */}
      {delays.length > 0 && (
        <div>
          <DelayAlerts delays={delays} />
        </div>
      )}
    </motion.div>
  );
}

