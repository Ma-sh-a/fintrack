export default function RiskMeter({ score, label }) {
  const pct = ((Math.min(5, Math.max(1, score)) - 1) / 4) * 100;
  return (
    <div className="risk-meter">
      <div className="risk-track">
        <div className="risk-marker" style={{ left: `${pct}%` }} />
      </div>
      <div className="risk-labels">
        <span>Консервативный</span>
        <span>Умеренный</span>
        <span>Агрессивный</span>
      </div>
      <p className="risk-result">
        Текущий профиль портфеля: <strong>{label}</strong>
      </p>
      <p className="muted">
        Упрощённая оценка на основе состава портфеля по типам активов; ВНИМАНИЕ:
        не является индивидуальной инвестиционной рекомендацией!!!!
      </p>
    </div>
  );
}
