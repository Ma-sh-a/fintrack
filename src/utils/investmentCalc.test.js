import { describe, it, expect } from 'vitest'
import { enrichAsset, portfolioTotals, calcRiskScore, groupSum } from './investmentCalc'

describe('enrichAsset', () => {
  it('считает стоимость, вложенное и доходность в плюсе', () => {
    const asset = { quantity: 10, purchasePrice: 100, currentPrice: 150 }
    const result = enrichAsset(asset)
    expect(result.value).toBe(1500)
    expect(result.cost).toBe(1000)
    expect(result.pnl).toBe(500)
    expect(result.pnlPct).toBe(50)
  })

  it('считает отрицательную доходность', () => {
    const asset = { quantity: 5, purchasePrice: 200, currentPrice: 150 }
    const result = enrichAsset(asset)
    expect(result.pnl).toBe(-250)
    expect(result.pnlPct).toBe(-25)
  })

  it('не падает на нулевой цене покупки', () => {
    const asset = { quantity: 5, purchasePrice: 0, currentPrice: 150 }
    const result = enrichAsset(asset)
    expect(result.pnlPct).toBe(0)
  })
})

describe('portfolioTotals', () => {
  it('суммирует несколько активов', () => {
    const enriched = [
      enrichAsset({ quantity: 10, purchasePrice: 100, currentPrice: 150 }),
      enrichAsset({ quantity: 2, purchasePrice: 1000, currentPrice: 900 }),
    ]
    const totals = portfolioTotals(enriched)
    expect(totals.totalValue).toBe(1500 + 1800)
    expect(totals.totalCost).toBe(1000 + 2000)
    expect(totals.totalPnl).toBe(300)
  })

  it('возвращает нули для пустого портфеля', () => {
    const totals = portfolioTotals([])
    expect(totals.totalValue).toBe(0)
    expect(totals.totalPnlPct).toBe(0)
  })
})

describe('calcRiskScore', () => {
  it('возвращает null для пустого портфеля', () => {
    expect(calcRiskScore([])).toBeNull()
  })

  it('портфель только из облигаций — низкий риск', () => {
    const enriched = [
      enrichAsset({
        type: 'Облигации',
        quantity: 10,
        purchasePrice: 100,
        currentPrice: 100,
      }),
    ]
    expect(calcRiskScore(enriched)).toBe(1)
  })

  it('портфель только из криптовалюты — высокий риск', () => {
    const enriched = [
      enrichAsset({
        type: 'Криптовалюта',
        quantity: 1,
        purchasePrice: 1000,
        currentPrice: 1000,
      }),
    ]
    expect(calcRiskScore(enriched)).toBe(5)
  })
})

describe('groupSum', () => {
  it('группирует и суммирует по ключу', () => {
    const items = [
      { broker: 'A', value: 100 },
      { broker: 'B', value: 50 },
      { broker: 'A', value: 30 },
    ]
    const result = groupSum(
      items,
      (i) => i.broker,
      (i) => i.value
    )
    const a = result.find((r) => r.name === 'A')
    expect(a.value).toBe(130)
  })
})
