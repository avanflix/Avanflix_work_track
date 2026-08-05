"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#8b8ff5", "#a78bfa", "#34d399", "#f59e0b", "#ef4444"];

export function TasksByStatusChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: "hsl(230 30% 14%)", border: "1px solid hsl(230 20% 24%)", borderRadius: 12 }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
