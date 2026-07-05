import { useRef, useState } from 'react'
import { buildAnswer } from '../utils/chatLogic'

const SUGGESTIONS = [
  'Баланс за месяц',
  'Сравни с прошлым месяцем',
  'Есть превышения лимита?',
  'Сколько в копилках?',
]

export default function ChatAssistant({
  transactions,
  monthTx,
  categories,
  goals = [],
  deposits = [],
  investments = [],
  selectedMonth,
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Привет! Спроси меня про баланс, расходы, лимиты, копилки или инвестиции.',
    },
  ])
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  const ctx = {
    transactions,
    monthTx,
    categories,
    goals,
    deposits,
    investments,
    selectedMonth,
  }

  function ask(question) {
    const answer = buildAnswer(question, ctx)
    setMessages((m) => [...m, { from: 'user', text: question }, { from: 'bot', text: answer }])
    setTimeout(() => listRef.current?.scrollTo(0, listRef.current.scrollHeight), 0)
  }

  function handleSend(e) {
    e.preventDefault()
    if (!input.trim()) return
    ask(input.trim())
    setInput('')
  }

  return (
    <div className={`chat-widget ${open ? 'open' : ''}`}>
      {open ? (
        <div className="chat-panel">
          <div className="chat-header">
            <span>Финансовый ассистент</span>
            <button className="btn-link" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <div className="chat-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble chat-${m.from}`}>
                {m.text}
              </div>
            ))}
            {messages.length <= 1 && (
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chat-chip" onClick={() => ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              placeholder="Например: сколько на еду?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              →
            </button>
          </form>
        </div>
      ) : (
        <button className="chat-fab" onClick={() => setOpen(true)}>
          💬
        </button>
      )}
    </div>
  )
}
