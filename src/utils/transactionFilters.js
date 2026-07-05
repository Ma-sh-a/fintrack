export function sortByDateDesc(transactions) {
  return [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1))
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
