import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function TrendChart({ data }) {
  if (data.every((d) => d.income === 0 && d.expense === 0)) {
    return <p className="empty-state">Пока недостаточно данных за последние месяцы.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0dde9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: 'Courier New, monospace' }} />
        <YAxis tick={{ fontSize: 11, fontFamily: 'Courier New, monospace' }} width={70} />
        <Tooltip formatter={(v) => `${Number(v).toLocaleString('ru-RU')} ₽`} />
        <Legend />
        <Bar dataKey="income" name="Доход" fill="#447A5F" radius={[2, 2, 0, 0]} />
        <Bar dataKey="expense" name="Расход" fill="#832D51" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
