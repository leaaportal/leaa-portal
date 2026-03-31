// dashboard-calendar.tsx
// Place at: client/src/components/dashboard-calendar.tsx

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarEventType = "session" | "task" | "deliverable" | "lead_followup";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string;        // "YYYY-MM-DD"
  time?: string;       // "10:00 AM" — optional
  clientName?: string; // admin only
  brandName?: string;  // admin only
  status?: string;
  priority?: string;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
  month: string; // "YYYY-MM"
}

export interface DashboardCalendarProps {
  isAdmin?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<CalendarEventType, string> = {
  session: "#B7542E",       // Terracotta
  task: "#2D2F36",          // Charcoal
  deliverable: "#16a34a",   // Green
  lead_followup: "#D9C9B6", // Warm Sand
};

const EVENT_LABELS: Record<CalendarEventType, string> = {
  session: "Session",
  task: "Task",
  deliverable: "Deliverable",
  lead_followup: "Follow-up",
};

const EVENT_LINK: Record<CalendarEventType, { admin: string; client: string }> = {
  session: { admin: "/admin/clients", client: "/milestones" },
  task: { admin: "/admin/tasks", client: "/milestones" },
  deliverable: { admin: "/admin/deliverables", client: "/deliverables" },
  lead_followup: { admin: "/admin/tasks", client: "/milestones" },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventDot({
  type,
  size = 7,
}: {
  type: CalendarEventType;
  size?: number;
}) {
  const color = EVENT_COLORS[type];
  const isLeadFollowup = type === "lead_followup";

  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        border: isLeadFollowup ? "1.5px solid #A5A5A5" : "none",
        flexShrink: 0,
      }}
    />
  );
}

function EventTypeBadge({ type }: { type: CalendarEventType }) {
  const styles: Record<CalendarEventType, string> = {
    session: "bg-[#B7542E]/10 text-[#B7542E] border-[#B7542E]/20",
    task: "bg-[#2D2F36]/10 text-[#2D2F36] border-[#2D2F36]/20",
    deliverable: "bg-green-100 text-green-700 border-green-200",
    lead_followup: "bg-[#D9C9B6]/40 text-[#6b5b4e] border-[#D9C9B6]",
  };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0 rounded border text-[10px] font-medium leading-5 ${styles[type]}`}
    >
      {EVENT_LABELS[type]}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardCalendar({ isAdmin = false }: DashboardCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthParam = format(currentMonth, "yyyy-MM");

  // Fetch events for this month
  const { data, isLoading, error } = useQuery<CalendarEventsResponse>({
    queryKey: ["/api/calendar/events", monthParam],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/calendar/events?month=${monthParam}`);
      return res.json();
    },
  });

  // Group events by date string for O(1) lookup
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    if (data?.events) {
      for (const event of data.events) {
        if (!map[event.date]) map[event.date] = [];
        map[event.date].push(event);
      }
    }
    return map;
  }, [data]);

  // Generate calendar grid days (6 weeks max)
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Events for the selected day
  const selectedDayEvents = useMemo<CalendarEvent[]>(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return eventsByDate[key] ?? [];
  }, [selectedDay, eventsByDate]);

  const handlePrevMonth = () => {
    setCurrentMonth((d) => subMonths(d, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth((d) => addMonths(d, 1));
    setSelectedDay(null);
  };

  const handleDayClick = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    const hasEvents = (eventsByDate[key]?.length ?? 0) > 0;
    if (!hasEvents) {
      setSelectedDay(null);
      return;
    }
    if (selectedDay && isSameDay(selectedDay, day)) {
      setSelectedDay(null); // toggle off
    } else {
      setSelectedDay(day);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#B7542E]" />
            <CardTitle className="font-display text-base font-semibold">
              Calendar
            </CardTitle>
          </div>
          {/* Month navigator */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-foreground min-w-[100px] text-center select-none">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-[10px] text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="grid grid-cols-7 gap-0.5">
                {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                  <Skeleton key={col} className="h-9 rounded" />
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Failed to load calendar events.
          </div>
        ) : (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] font-medium text-muted-foreground py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-px">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDate[dateKey] ?? [];
                const hasEvents = dayEvents.length > 0;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
                const isDayToday = isToday(day);

                // Collect unique event types for dots (max 3)
                const dotsToShow = dayEvents.slice(0, 3);

                return (
                  <button
                    key={dateKey}
                    onClick={() => handleDayClick(day)}
                    disabled={!hasEvents}
                    aria-label={`${format(day, "MMMM d")}${hasEvents ? `, ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}` : ""}`}
                    className={[
                      "relative flex flex-col items-center justify-start pt-1 pb-1 rounded transition-all min-h-[42px]",
                      isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/30",
                      hasEvents && isCurrentMonth
                        ? "cursor-pointer hover:bg-muted/50"
                        : hasEvents
                        ? "cursor-pointer hover:bg-muted/30"
                        : "cursor-default",
                      isSelected
                        ? "bg-[#B7542E]/10 ring-1 ring-[#B7542E]/40"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {/* Day number */}
                    <span
                      className={[
                        "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full leading-none",
                        isDayToday
                          ? "bg-[#B7542E] text-white font-semibold"
                          : "",
                        isSelected && !isDayToday
                          ? "text-[#B7542E] font-semibold"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Event dots */}
                    {hasEvents && isCurrentMonth && (
                      <div className="flex items-center justify-center gap-[2px] mt-0.5">
                        {dotsToShow.map((evt, idx) => (
                          <EventDot key={idx} type={evt.type} size={5} />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] text-muted-foreground leading-none">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 px-1">
              {(["session", "task", "deliverable", "lead_followup"] as CalendarEventType[]).map((type) => (
                <div key={type} className="flex items-center gap-1">
                  <EventDot type={type} size={6} />
                  <span className="text-[10px] text-muted-foreground">{EVENT_LABELS[type]}</span>
                </div>
              ))}
            </div>

            {/* Selected day event panel */}
            {selectedDay && selectedDayEvents.length > 0 && (
              <div className="mt-3 border-t border-border/40 pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {format(selectedDay, "EEEE, MMMM d")}
                </p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {selectedDayEvents.map((evt) => {
                    const linkTarget = isAdmin
                      ? EVENT_LINK[evt.type].admin
                      : EVENT_LINK[evt.type].client;

                    return (
                      <Link key={evt.id} href={linkTarget}>
                        <div className="flex items-start gap-2.5 p-2 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors cursor-pointer group">
                          {/* Dot */}
                          <div className="mt-0.5 flex-shrink-0">
                            <EventDot type={evt.type} size={8} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <EventTypeBadge type={evt.type} />
                              {evt.priority && evt.priority !== "normal" && (
                                <span
                                  className={`text-[10px] font-medium px-1.5 rounded ${
                                    evt.priority === "urgent"
                                      ? "bg-red-100 text-red-600"
                                      : evt.priority === "high"
                                      ? "bg-orange-100 text-orange-600"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {evt.priority}
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-medium text-foreground leading-snug truncate group-hover:text-[#B7542E] transition-colors">
                              {evt.title}
                            </p>

                            <div className="flex items-center gap-3 mt-0.5">
                              {evt.time && (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {evt.time}
                                </span>
                              )}
                              {isAdmin && evt.clientName && (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                                  <User className="w-3 h-3 flex-shrink-0" />
                                  {evt.clientName}
                                  {evt.brandName ? ` · ${evt.brandName}` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state when day clicked but no events (shouldn't reach, but safety) */}
            {selectedDay && selectedDayEvents.length === 0 && (
              <div className="mt-3 border-t border-border/40 pt-3 text-center text-xs text-muted-foreground">
                No events on {format(selectedDay, "MMMM d")}.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardCalendar;

