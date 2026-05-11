import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  histogramBins,
  scatterData,
  topCategoryCounts,
  type Dataset,
} from "@/lib/dataset";

const COLORS = [
  "oklch(0.85 0.06 235)",
  "oklch(0.70 0.10 240)",
  "oklch(0.55 0.12 245)",
  "oklch(0.92 0.04 230)",
  "oklch(0.45 0.10 250)",
  "oklch(0.78 0.07 235)",
  "oklch(0.60 0.11 245)",
  "oklch(0.88 0.05 232)",
];

const tooltipStyle = {
  background: "oklch(0.22 0.06 255)",
  border: "1px solid oklch(0.30 0.10 295 / 0.4)",
  borderRadius: 8,
  color: "white",
};

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5 shadow-card">
      <div className="mb-3">
        <h4 className="font-display text-lg">{title}</h4>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

export function Charts({ dataset }: { dataset: Dataset }) {
  const numericCols = dataset.numericColumns;
  const catCols = dataset.categoricalColumns;

  const barCol = catCols[0] ?? dataset.columns[0];
  const barData = topCategoryCounts(dataset, barCol, 8);

  const pieCol = catCols[1] ?? catCols[0] ?? dataset.columns[0];
  const pieData = topCategoryCounts(dataset, pieCol, 6);

  const histCol = numericCols[0];
  const histData = histCol ? histogramBins(dataset, histCol, 10) : [];

  const sx = numericCols[0];
  const sy = numericCols[1] ?? numericCols[0];
  const scatter = sx && sy ? scatterData(dataset, sx, sy) : [];

  return (
    <div id="charts-area" className="grid md:grid-cols-2 gap-5">
      <ChartCard title={`Top ${barCol}`} subtitle="Most frequent values">
        <ResponsiveContainer>
          <BarChart data={barData}>
            <CartesianGrid stroke="oklch(0.55 0.08 240 / 0.3)" />
            <XAxis dataKey="name" stroke="oklch(0.78 0.03 235)" fontSize={11} />
            <YAxis stroke="oklch(0.78 0.03 235)" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="oklch(0.65 0.25 300)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={`Distribution: ${pieCol}`} subtitle="Share by category">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              innerRadius={45}
              paddingAngle={2}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: "oklch(0.85 0.02 280)" }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={histCol ? `Histogram: ${histCol}` : "Histogram"}
        subtitle="Numeric distribution"
      >
        {histCol ? (
          <ResponsiveContainer>
            <LineChart data={histData}>
              <CartesianGrid stroke="oklch(0.55 0.08 240 / 0.3)" />
              <XAxis dataKey="name" stroke="oklch(0.78 0.03 235)" fontSize={11} />
              <YAxis stroke="oklch(0.78 0.03 235)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="oklch(0.85 0.06 235)"
                strokeWidth={2.5}
                dot={{ fill: "oklch(0.85 0.06 235)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty>No numeric column found.</Empty>
        )}
      </ChartCard>

      <ChartCard
        title={sx && sy ? `${sx} vs ${sy}` : "Scatter"}
        subtitle="Relationship between two numeric variables"
      >
        {scatter.length > 0 ? (
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid stroke="oklch(0.55 0.08 240 / 0.3)" />
              <XAxis dataKey="x" name={sx} stroke="oklch(0.78 0.03 235)" fontSize={11} />
              <YAxis dataKey="y" name={sy} stroke="oklch(0.78 0.03 235)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={scatter} fill="oklch(0.70 0.10 240)" />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <Empty>Need at least two numeric columns.</Empty>
        )}
      </ChartCard>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full grid place-items-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
