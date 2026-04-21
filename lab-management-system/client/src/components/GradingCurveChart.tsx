import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart
} from "recharts";

interface SievePoint {
  sieve: string;
  passing: number;
  lowerLimit?: number;
  upperLimit?: number;
  jmfLower?: number;
  jmfUpper?: number;
}

interface GradingCurveChartProps {
  data: SievePoint[];
  title?: string;
  height?: number;
}

export function GradingCurveChart({ data, title, height = 300 }: GradingCurveChartProps) {
  const hasLimits = data.some(d => d.lowerLimit !== undefined || d.upperLimit !== undefined);
  const hasJMF = data.some(d => d.jmfLower !== undefined || d.jmfUpper !== undefined);

  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-center mb-2 text-slate-700">{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="sieve"
            tick={{ fontSize: 11, fill: "#64748b" }}
            label={{ value: "Sieve Size (mm)", position: "insideBottom", offset: -2, fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#64748b" }}
            label={{ value: "% Passing", angle: -90, position: "insideLeft", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value: number, name: string) => [`${value?.toFixed(1)}%`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />

          {/* Specification band */}
          {hasLimits && (
            <>
              <Area
                type="monotone"
                dataKey="upperLimit"
                stroke="#94a3b8"
                fill="#f1f5f9"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                name="Upper Limit"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="lowerLimit"
                stroke="#94a3b8"
                fill="#ffffff"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                name="Lower Limit"
                dot={false}
              />
            </>
          )}

          {/* JMF band */}
          {hasJMF && (
            <>
              <Line
                type="monotone"
                dataKey="jmfUpper"
                stroke="#f59e0b"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                name="JMF Upper"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="jmfLower"
                stroke="#f59e0b"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                name="JMF Lower"
                dot={false}
              />
            </>
          )}

          {/* Actual grading */}
          <Line
            type="monotone"
            dataKey="passing"
            stroke="#2563eb"
            strokeWidth={2.5}
            name="% Passing"
            dot={{ fill: "#2563eb", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Proctor Curve ────────────────────────────────────────────────────────────
interface ProctorPoint {
  moisture: number;
  dryDensity: number;
}

interface ProctorCurveChartProps {
  data: ProctorPoint[];
  mdd?: number;
  omc?: number;
  height?: number;
}

export function ProctorCurveChart({ data, mdd, omc, height = 300 }: ProctorCurveChartProps) {
  return (
    <div className="w-full">
      <h4 className="text-sm font-semibold text-center mb-2 text-slate-700">
        Dry Density vs Moisture Content
      </h4>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="moisture"
            type="number"
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#64748b" }}
            label={{ value: "Moisture Content (%)", position: "insideBottom", offset: -2, fontSize: 11 }}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#64748b" }}
            label={{ value: "Dry Density (Mg/m³)", angle: -90, position: "insideLeft", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value: number, name: string) => {
              if (name === "Dry Density") return [`${value?.toFixed(3)} Mg/m³`, name];
              return [`${value?.toFixed(1)}%`, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />

          {/* MDD reference line */}
          {mdd && (
            <ReferenceLine
              y={mdd}
              stroke="#10b981"
              strokeDasharray="4 4"
              label={{ value: `MDD: ${mdd.toFixed(3)}`, fill: "#10b981", fontSize: 11 }}
            />
          )}
          {omc && (
            <ReferenceLine
              x={omc}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: `OMC: ${omc.toFixed(1)}%`, fill: "#f59e0b", fontSize: 11 }}
            />
          )}

          <Line
            type="monotone"
            dataKey="dryDensity"
            stroke="#7c3aed"
            strokeWidth={2.5}
            name="Dry Density"
            dot={{ fill: "#7c3aed", r: 5 }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
