function normalize(word) {
  return word.toLowerCase().replace(/(ами|ями|ого|его|ой|ей|ый|ий|ая|яя|ое|ее|ых|их|у|ю|а|я|ы|и|е|о)$/, '')
}

export function prevMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const GREETINGS = ['привет', 'здравствуй', 'хай', 'ку', 'добрый день', 'добрый вечер']

export function buildAnswer(question, ctx) {
  const { transactions, monthTx, categories, goals, deposits, investments, selectedMonth } = ctx
  const q = question.toLowerCase().trim()

  if (GREETINGS.some((g) => q.includes(g))) {
    return 'Привет! Спроси про баланс, траты по категории, сравнение с прошлым месяцем, лимиты или копилки.'
  }

  const totalIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  if (q.includes('сравн') || q.includes('прошл')) {
    const prev = prevMonth(selectedMonth)
    const prevTx = transactions.filter((t) => t.date?.startsWith(prev))
    const prevExpense = prevTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    if (prevExpense === 0) return 'За предыдущий месяц данных нет — не с чем сравнить.'
    const diff = totalExpense - prevExpense
    const pct = Math.round((diff / prevExpense) * 100)
    const dir = diff > 0 ? 'больше' : 'меньше'
    return `В этом месяце расходы ${Math.abs(pct)}% ${dir}, чем в предыдущем (${totalExpense.toLocaleString('ru-RU')} ₽ против ${prevExpense.toLocaleString('ru-RU')} ₽).`
  }

  if (q.includes('копилк') || q.includes('накоплен')) {
    const savingGoals = goals.filter((g) => (g.kind || 'saving') === 'saving')
    if (savingGoals.length === 0) return 'Пока нет ни одной копилки — создай на странице «Копилки».'
    const total = deposits.reduce((s, d) => s + Number(d.amount), 0)
    const goalMatch = savingGoals.find((g) => {
      const stem = normalize(g.name)
      return stem.length >= 2 && q.includes(stem)
    })
    if (goalMatch) {
      const saved = deposits
        .filter((d) => d.goalId === goalMatch.id)
        .reduce((s, d) => s + Number(d.amount), 0)
      const left = goalMatch.targetAmount - saved
      if (left <= 0) return `Цель «${goalMatch.name}» уже достигнута! 🎉`
      return `До цели «${goalMatch.name}» осталось накопить ${left.toLocaleString('ru-RU')} ₽ (сейчас ${saved.toLocaleString('ru-RU')} из ${goalMatch.targetAmount.toLocaleString('ru-RU')} ₽).`
    }
    return `Всего в копилках: ${total.toLocaleString('ru-RU')} ₽ по ${savingGoals.length} цел${savingGoals.length === 1 ? 'и' : 'ям'}.`
  }

  if (q.includes('инвестиц') || q.includes('портфел')) {
    if (investments.length === 0) return 'Портфель пуст — добавь активы на странице «Инвестиции».'
    const total = investments.reduce((s, a) => s + Number(a.quantity || 0) * Number(a.currentPrice || 0), 0)
    const cost = investments.reduce((s, a) => s + Number(a.quantity || 0) * Number(a.purchasePrice || 0), 0)
    const pnlPct = cost > 0 ? (((total - cost) / cost) * 100).toFixed(1) : 0
    return `Стоимость инвестиционного портфеля: ${total.toLocaleString('ru-RU')} ₽, активов: ${investments.length}. Доходность: ${pnlPct >= 0 ? '+' : ''}${pnlPct}%.`
  }

  if (q.includes('баланс') || q.includes('итог')) {
    const balance = totalIncome - totalExpense
    return `Баланс за этот месяц: ${balance.toLocaleString('ru-RU')} ₽ (доход ${totalIncome.toLocaleString('ru-RU')} ₽, расход ${totalExpense.toLocaleString('ru-RU')} ₽).`
  }

  if (q.includes('доход')) {
    return `Доход за этот месяц: ${totalIncome.toLocaleString('ru-RU')} ₽.`
  }

  const matchedCategory = categories.find((c) => {
    const stem = normalize(c.name)
    return stem.length >= 2 && q.includes(stem)
  })
  if (matchedCategory) {
    const sum = monthTx
      .filter((t) => t.type === 'expense' && t.categoryId === matchedCategory.id)
      .reduce((s, t) => s + Number(t.amount), 0)
    if (matchedCategory.monthlyLimit > 0) {
      const left = matchedCategory.monthlyLimit - sum
      if (left < 0)
        return `На «${matchedCategory.name}» потрачено ${sum.toLocaleString('ru-RU')} ₽ — лимит ${matchedCategory.monthlyLimit.toLocaleString('ru-RU')} ₽ превышен на ${Math.abs(left).toLocaleString('ru-RU')} ₽.`
      return `На «${matchedCategory.name}» в этом месяце потрачено ${sum.toLocaleString('ru-RU')} ₽ из лимита ${matchedCategory.monthlyLimit.toLocaleString('ru-RU')} ₽. Осталось ${left.toLocaleString('ru-RU')} ₽.`
    }
    return `На «${matchedCategory.name}» в этом месяце потрачено ${sum.toLocaleString('ru-RU')} ₽.`
  }

  if (q.includes('потрат') || q.includes('расход')) {
    return `Всего расходов за этот месяц: ${totalExpense.toLocaleString('ru-RU')} ₽. Спроси про конкретную категорию, например «сколько на еду».`
  }

  if (q.includes('совет') || q.includes('лимит') || q.includes('бюджет')) {
    const overLimit = categories.find((c) => {
      if (!c.monthlyLimit) return false
      const sum = monthTx
        .filter((t) => t.type === 'expense' && t.categoryId === c.id)
        .reduce((s, t) => s + Number(t.amount), 0)
      return sum > c.monthlyLimit
    })
    if (overLimit)
      return `Категория «${overLimit.name}» уже превысила лимит на этот месяц — стоит притормозить траты. Подробности — на дашборде.`
    return 'Пока всё в рамках лимитов. Задай лимиты категориям на странице «Категории», если ещё не сделал этого.'
  }

  return 'Могу подсказать баланс, расходы по категории, сравнение с прошлым месяцем, копилки или инвестиции — просто спроси, или нажми одну из подсказок ниже.'
}
