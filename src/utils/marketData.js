// Публичные API без ключей: MOEX ISS (акции/ETF на Мосбирже) и CoinGecko (крипта).
// Оба поддерживают CORS-запросы прямо из браузера.

const CRYPTO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  SOL: 'solana',
  TON: 'the-open-network',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
}

export async function fetchMarketPrice(ticker, type) {
  const t = (ticker || '').trim().toUpperCase()
  if (!t) throw new Error('Укажи тикер актива')

  if (type === 'Криптовалюта') {
    const id = CRYPTO_IDS[t]
    if (!id) throw new Error(`Тикер ${t} не найден в списке поддерживаемых (BTC, ETH, USDT, SOL, TON, BNB, XRP, ADA, DOGE)`)
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=rub`)
    if (!res.ok) throw new Error('CoinGecko недоступен, попробуй позже')
    const data = await res.json()
    const price = data[id]?.rub
    if (!price) throw new Error('Курс не найден')
    return price
  }

  // Акции и ETF/Фонды — через MOEX ISS (Московская биржа)
  const res = await fetch(
    `https://iss.moex.com/iss/engines/stock/markets/shares/securities/${t}.json?iss.meta=off&marketdata.columns=BOARDID,LAST,PREVPRICE`
  )
  if (!res.ok) throw new Error('MOEX недоступен, попробуй позже')
  const data = await res.json()
  const rows = data?.marketdata?.data
  if (!rows || rows.length === 0) throw new Error(`Тикер ${t} не найден на MOEX`)

  const cols = data.marketdata.columns
  const boardIdx = cols.indexOf('BOARDID')
  const lastIdx = cols.indexOf('LAST')
  const prevIdx = cols.indexOf('PREVPRICE')

  // Предпочитаем основную площадку TQBR, если её нет — берём первую строку
  const row = rows.find((r) => r[boardIdx] === 'TQBR') || rows[0]
  const last = row[lastIdx]
  const prev = row[prevIdx]

  if (last) return last
  // Торги сейчас не идут (выходной/нерабочее время) — берём цену закрытия предыдущей сессии
  if (prev) return prev
  throw new Error(`Котировка для ${t} недоступна — рынок закрыт, и цена закрытия не найдена`)
}

export const LIVE_PRICE_TYPES = ['Акции', 'ETF/Фонды', 'Криптовалюта']

// Упрощённая учебная модель риск-веса по типу актива (1 — низкий риск, 5 — высокий)
export const RISK_WEIGHTS = {
  'Облигации': 1,
  'Другое': 2,
  'ETF/Фонды': 3,
  'Акции': 4,
  'Криптовалюта': 5,
}

export function riskLabel(score) {
  if (score <= 1.8) return 'Консервативный'
  if (score <= 3.2) return 'Умеренный'
  return 'Агрессивный'
}
