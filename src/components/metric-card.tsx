"use client";

import { motion } from "framer-motion";
import {
  Award,
  Clock,
  Film,
  Hourglass,
  ListChecks,
  ListTodo,
  Timer,
  UserCheck,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Icon registry — maps string key → Lucide component
// Server Components pass the string key; the icon is resolved client-side.
// ---------------------------------------------------------------------------

const iconRegistry = {
  users: Users,
  userCheck: UserCheck,
  award: Award,
  film: Film,
  hourglass: Hourglass,
  listTodo: ListTodo,
  listChecks: ListChecks,
  timer: Timer,
  clock: Clock,
} as const;

export type MetricCardIconKey = keyof typeof iconRegistry;

// ---------------------------------------------------------------------------
// MetricCard component
// ---------------------------------------------------------------------------

type MetricCardProps = {
  title: string;
  value: string | number;
  detail: string;
  /** String key for the icon — resolved internally. Safe to pass from Server Components. */
  icon: MetricCardIconKey;
  trend?: string;
};

export function MetricCard({ title, value, detail, icon, trend }: MetricCardProps) {
  const Icon = iconRegistry[icon];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <Card className="relative overflow-hidden">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-primary/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {title}
            </p>
            <div className="mt-3 text-3xl font-bold">{value}</div>
            <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </div>
        </div>
        {trend ? (
          <div className="mt-4 text-xs font-semibold text-teal-600 dark:text-teal-300">
            {trend}
          </div>
        ) : null}
      </Card>
    </motion.div>
  );
}
