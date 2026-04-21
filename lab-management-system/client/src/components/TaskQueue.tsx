/**
 * TaskQueue — Shared task list component with three states:
 *   🔴 جديدة / New        — assigned but never opened
 *   🟡 غير مكتملة / Incomplete — opened but no action taken
 *   ✅ مُنجزة / Completed  — action completed (shown in history)
 *
 * Usage:
 *   <TaskQueue tasks={tasks} lang={lang} onOpen={(task) => navigate(...)} />
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle2, AlertCircle, ChevronRight, History } from "lucide-react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskState = "new" | "incomplete" | "completed";

export interface Task {
  id: number;
  code: string;            // e.g. DIST-2026-001
  title: string;           // primary label (bilingual)
  subtitle?: string;       // secondary label (e.g. sample code)
  meta?: string;           // extra info (e.g. priority, due date)
  state: TaskState;
  createdAt: Date | string;
  completedAt?: Date | string;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const T = {
  new:        { ar: "جديدة",         en: "New" },
  incomplete: { ar: "غير مكتملة",    en: "Incomplete" },
  completed:  { ar: "مُنجزة",         en: "Completed" },
  history:    { ar: "السجل",          en: "History" },
  empty:      { ar: "لا توجد مهام",  en: "No tasks" },
  open:       { ar: "فتح",            en: "Open" },
  tasks:      { ar: "المهام",         en: "Tasks" },
  showHistory:{ ar: "عرض السجل",     en: "Show History" },
  hideHistory:{ ar: "إخفاء السجل",   en: "Hide History" },
};

function t(key: keyof typeof T, lang: string) {
  return lang === "ar" ? T[key].ar : T[key].en;
}

// ─── State badge ──────────────────────────────────────────────────────────────

function StateBadge({ state, lang }: { state: TaskState; lang: string }) {
  if (state === "new")
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
        {t("new", lang)}
      </Badge>
    );
  if (state === "incomplete")
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 text-xs">
        <Clock className="w-3 h-3" />
        {t("incomplete", lang)}
      </Badge>
    );
  return (
    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs">
      <CheckCircle2 className="w-3 h-3" />
      {t("completed", lang)}
    </Badge>
  );
}

// ─── Single task row ──────────────────────────────────────────────────────────

function TaskRow({
  task,
  lang,
  onOpen,
}: {
  task: Task;
  lang: string;
  onOpen: (task: Task) => void;
}) {
  const isRtl = lang === "ar";
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 px-1 rounded-lg transition-colors hover:bg-muted/40 cursor-pointer ${
        task.state === "new" ? "bg-red-50/50" : task.state === "incomplete" ? "bg-amber-50/30" : ""
      }`}
      onClick={() => onOpen(task)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-muted-foreground">{task.code}</span>
          <StateBadge state={task.state} lang={lang} />
        </div>
        <p className="font-medium text-sm mt-0.5 truncate">{task.title}</p>
        {task.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{task.subtitle}</p>
        )}
        {task.meta && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{task.meta}</p>
        )}
      </div>
      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
        <ChevronRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
      </Button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TaskQueueProps {
  tasks: Task[];
  lang: string;
  title?: string;
  onOpen: (task: Task) => void;
  className?: string;
}

export function TaskQueue({ tasks, lang, title, onOpen, className = "" }: TaskQueueProps) {
  const [showHistory, setShowHistory] = useState(false);

  const newTasks        = tasks.filter((t) => t.state === "new");
  const incompleteTasks = tasks.filter((t) => t.state === "incomplete");
  const completedTasks  = tasks.filter((t) => t.state === "completed");
  const activeTasks     = [...newTasks, ...incompleteTasks];

  const totalBadge = newTasks.length + incompleteTasks.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {title ?? t("tasks", lang)}
            {totalBadge > 0 && (
              <Badge className="bg-red-500 text-white text-xs h-5 px-1.5 rounded-full">
                {totalBadge}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {newTasks.length} {t("new", lang)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {incompleteTasks.length} {t("incomplete", lang)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {activeTasks.length === 0 && !showHistory && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
            <p className="text-sm">{t("empty", lang)}</p>
          </div>
        )}

        {activeTasks.length > 0 && (
          <ScrollArea className="max-h-[420px]">
            <div className="space-y-1 divide-y divide-border/50">
              {activeTasks.map((task) => (
                <TaskRow key={task.id} task={task} lang={lang} onOpen={onOpen} />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* History toggle */}
        {completedTasks.length > 0 && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground gap-2 text-xs"
              onClick={() => setShowHistory((v) => !v)}
            >
              <History className="w-3.5 h-3.5" />
              {showHistory ? t("hideHistory", lang) : t("showHistory", lang)}
              <span className="text-muted-foreground/60">({completedTasks.length})</span>
            </Button>

            {showHistory && (
              <>
                <Separator className="my-2" />
                <ScrollArea className="max-h-[280px]">
                  <div className="space-y-1 divide-y divide-border/50 opacity-70">
                    {completedTasks.map((task) => (
                      <TaskRow key={task.id} task={task} lang={lang} onOpen={onOpen} />
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Helper: derive TaskState from distribution data ──────────────────────────

export function getDistributionTaskState(dist: {
  status: string;
  taskReadAt?: Date | string | null;
}): TaskState {
  if (dist.status === "completed" || dist.status === "cancelled") return "completed";
  if (dist.taskReadAt) return "incomplete";
  return "new";
}
