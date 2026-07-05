export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="error-banner">
      <span>⚠ {message}</span>
      {onRetry && (
        <button className="btn-link" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  )
}
