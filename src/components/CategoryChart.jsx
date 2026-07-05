import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function CategoryChart({ data }) {
  if (data.length === 0) {
    return <p className="empty-state">Пока нет расходов для графика — добавь операции.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${v.toLocaleString('ru-RU')} ₽`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
