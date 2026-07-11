"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const colors = ["#2563eb", "#14b8a6", "#f97316", "#ef4444", "#8b5cf6"];

export function MonthlyProgressChart({ data }: { data: Array<{ month: string; completed: number; assigned: number }> }) {
  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle>Monthly Progress</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height="82%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="completed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Area type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={3} fill="url(#completed)" />
          <Area type="monotone" dataKey="assigned" stroke="#14b8a6" strokeWidth={2} fill="transparent" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function LateVsCompletedChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle>Late vs Completed</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height="82%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function DistributionChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <Card className="h-80">
      <CardHeader>
        <CardTitle>Training Distribution</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height="82%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={4}>
            {data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
