"use client";

import {
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  Line,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TemperatureChartProps {
  data: { time: number; temperature: number }[];
  unit: string;
}

export default function TemperatureChart({
  data,
  unit,
}: TemperatureChartProps) {
  if (data.length === 0) {
    return <div>No data logged yet.</div>;
  }

  const chartData = data.map((point) => ({
    x: point.time - data[0].time, // Convert to seconds since start
    y: point.temperature,
  }));

  return (
    <ChartContainer
      config={{
        temperature: {
          label: "Temperature",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-[400px]"
    >
      <ComposedChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="x"
          name="Time"
          unit="s"
          type="number"
          domain={["dataMin", "dataMax"]}
        />
        <YAxis
          dataKey="y"
          name="Temperature"
          unit={unit}
          domain={["auto", "auto"]}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Scatter
          name="Temperature"
          data={chartData}
          fill="hsl(var(--chart-1))"
        />
        <Line
          type="linear"
          dataKey="y"
          name="Temperature"
          data={chartData}
          fill="hsl(var(--chart-1))"
          stroke="hsl(var(--chart-1))"
        />
      </ComposedChart>
    </ChartContainer>
  );
}
