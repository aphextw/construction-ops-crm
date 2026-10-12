import { useMemo } from "react";

export const BUDGET_MONTHS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

type Expense = {
  line_total?: string;
  actual_line_total?: string | null;
  created_at?: string;
  paid_at?: string | null;
};

type Project = { material_expenses?: Expense[] };

function money(value?: string | null) {
  const amount = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(amount) ? amount : 0;
}

export function buildAnnualBudget(projects: Project[], year: number) {
  const months = BUDGET_MONTHS.map((month, index) => ({ month, monthIndex: index + 1, spend: 0, planned: 0 }));
  const monthInYear = (value?: string | null) => {
    const date = value ? new Date(value) : null;
    return date && date.getFullYear() === year ? date.getMonth() : null;
  };

  for (const project of projects) {
    for (const expense of project.material_expenses ?? []) {
      const planned = money(expense.line_total);
      const createdMonth = monthInYear(expense.created_at);
      if (createdMonth !== null) months[createdMonth].planned += planned;

      // Payment belongs to its own month, even if the expense was created last year.
      const paidMonth = monthInYear(expense.paid_at);
      if (paidMonth !== null) {
        months[paidMonth].spend += expense.actual_line_total == null ? planned : money(expense.actual_line_total);
      }
    }
  }
  return months;
}

export function useBudgetAnalytics(projects: Project[], year: number) {
  const data = useMemo(() => buildAnnualBudget(projects, year), [projects, year]);
  const totals = useMemo(() => data.reduce((sum, month) => ({
    spend: sum.spend + month.spend,
    planned: sum.planned + month.planned,
  }), { spend: 0, planned: 0 }), [data]);
  return { data, totals };
}
