import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

export default function AssetPnLChart({ data }) {
  if (data.length === 0)
    return (
      <p className="empty-state">
        Добавь активы с ценой покупки, чтобы увидеть доходность.
      </p>
    );
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f0dde9"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fontFamily: "Courier New, monospace" }}
          unit="%"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 12, fontFamily: "Courier New, monospace" }}
        />
        <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
        <Bar dataKey="pnlPct" radius={[0, 3, 3, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pnlPct >= 0 ? "#447A5F" : "#832D51"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
