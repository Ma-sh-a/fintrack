export function sortByDateDesc(transactions) {
  return [...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

export function filterTransactions(transactions, { type = 'all', categoryId = 'all' } = {}) {
  return transactions.filter((t) => {
    if (type !== 'all' && t.type !== type) return false
    if (categoryId !== 'all' && t.categoryId !== categoryId) return false
    return true
  })
}

export function filterCategoriesByType(categories, type) {
  if (type === 'all') return categories
  return categories.filter((c) => (c.type || 'expense') === type)
}


export function spentByCategory(transactions, categoryId, monthPrefix) {
  return transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.categoryId === categoryId &&
        (!monthPrefix || t.date?.startsWith(monthPrefix))
    )
    .reduce((s, t) => s + Number(t.amount), 0)
}