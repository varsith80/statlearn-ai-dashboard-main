import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { competencyRadar } from "@/data/mock";

export function CompetencyChart({ height = 320 }: { height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={competencyRadar} outerRadius="72%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="area"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              fontSize: 12,
              color: "var(--color-card-foreground)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Radar
            name="Your score"
            dataKey="score"
            stroke="var(--color-chart-1)"
            fill="var(--color-chart-1)"
            fillOpacity={0.32}
          />
          <Radar
            name="Role benchmark"
            dataKey="benchmark"
            stroke="var(--color-chart-3)"
            fill="var(--color-chart-3)"
            fillOpacity={0.1}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
