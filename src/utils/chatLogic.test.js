import { describe, it, expect } from "vitest";
import { buildAnswer, prevMonth } from "./chatLogic";

const baseCtx = {
  transactions: [],
  monthTx: [],
  categories: [],
  goals: [],
  deposits: [],
  investments: [],
  selectedMonth: "2026-06",
};

describe("prevMonth", () => {
  it("переходит на предыдущий месяц", () => {
    expect(prevMonth("2026-06")).toBe("2026-05");
  });

  it("корректно переходит через границу года", () => {
    expect(prevMonth("2026-01")).toBe("2025-12");
  });
});

describe("buildAnswer", () => {
  it("отвечает на приветствие", () => {
    const answer = buildAnswer("Привет!", baseCtx);
    expect(answer).toMatch(/Привет/);
  });

  it("считает баланс за месяц", () => {
    const ctx = {
      ...baseCtx,
      monthTx: [
        { type: "income", amount: 1000 },
        { type: "expense", amount: 400 },
      ],
    };
    const answer = buildAnswer("какой у меня баланс?", ctx);
    expect(answer).toMatch(/600/);
  });

  it("находит категорию по названию и учитывает лимит", () => {
    const ctx = {
      ...baseCtx,
      categories: [{ id: "food", name: "Еда", monthlyLimit: 1000 }],
      monthTx: [{ type: "expense", amount: 300, categoryId: "food" }],
    };
    const answer = buildAnswer("сколько на еду?", ctx);
    expect(answer).toMatch(/300/);
    expect(answer).toMatch(/700/); // остаток
  });

  it("сообщает о превышении лимита категории", () => {
    const ctx = {
      ...baseCtx,
      categories: [{ id: "food", name: "Еда", monthlyLimit: 1000 }],
      monthTx: [{ type: "expense", amount: 1200, categoryId: "food" }],
    };
    const answer = buildAnswer("сколько на еду?", ctx);
    expect(answer).toMatch(/превышен/);
  });

  it("сообщает об отсутствии копилок", () => {
    const answer = buildAnswer("сколько в копилках?", baseCtx);
    expect(answer).toMatch(/нет ни одной копилки/);
  });

  it("считает сумму по конкретной копилке", () => {
    const ctx = {
      ...baseCtx,
      goals: [{ id: "g1", name: "Отпуск", kind: "saving", targetAmount: 5000 }],
      deposits: [{ goalId: "g1", amount: 2000 }],
    };
    const answer = buildAnswer("сколько накоплено на отпуск?", ctx);
    expect(answer).toMatch(/3.000|3000/);
  });

  it("даёт запасной ответ на непонятный вопрос", () => {
    const answer = buildAnswer("абракадабра", baseCtx);
    expect(answer).toMatch(/Могу подсказать/);
  });
});
