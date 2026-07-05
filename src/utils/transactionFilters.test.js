import { describe, it, expect } from 'vitest'
import { sortByDateDesc, filterTransactions, filterCategoriesByType } from './transactionFilters'

const sample = [
  { id: '1', type: 'expense', categoryId: 'food', date: '2026-06-01' },
  { id: '2', type: 'income', categoryId: 'salary', date: '2026-06-15' },
  { id: '3', type: 'expense', categoryId: 'transport', date: '2026-06-10' },
]

describe('sortByDateDesc', () => {
  it('сортирует по убыванию даты', () => {
    const result = sortByDateDesc(sample)
    expect(result.map((t) => t.id)).toEqual(['2', '3', '1'])
  })

  it('не мутирует исходный массив', () => {
    const copy = [...sample]
    sortByDateDesc(sample)
    expect(sample).toEqual(copy)
  })
})

describe('filterTransactions', () => {
  it('без фильтров возвращает всё', () => {
    expect(filterTransactions(sample)).toHaveLength(3)
  })

  it('фильтрует по типу', () => {
    const result = filterTransactions(sample, { type: 'expense' })
    expect(result).toHaveLength(2)
    expect(result.every((t) => t.type === 'expense')).toBe(true)
  })

  it('фильтрует по категории', () => {
    const result = filterTransactions(sample, { categoryId: 'food' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('комбинирует тип и категорию', () => {
    const result = filterTransactions(sample, {
      type: 'income',
      categoryId: 'salary',
    })
    expect(result).toHaveLength(1)
  })
})

describe('filterCategoriesByType', () => {
  const categories = [
    { id: 'a', name: 'Еда', type: 'expense' },
    { id: 'b', name: 'Зарплата', type: 'income' },
    { id: 'c', name: 'Старая без типа' },
  ]

  it('all возвращает все категории', () => {
    expect(filterCategoriesByType(categories, 'all')).toHaveLength(3)
  })

  it('income возвращает только доходные', () => {
    const result = filterCategoriesByType(categories, 'income')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('b')
  })

  it('expense включает категории без явного типа (обратная совместимость)', () => {
    const result = filterCategoriesByType(categories, 'expense')
    expect(result.map((c) => c.id)).toEqual(['a', 'c'])
  })
})
