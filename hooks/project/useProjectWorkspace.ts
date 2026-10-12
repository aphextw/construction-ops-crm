import { useState } from "react";

export type ProjectWorkspaceTab = "overview" | "sections" | "team";

export const PROJECT_STAGES: Record<string, { label: string; next?: string; action?: string }> = {
  project_analysis: { label: "Анализ проекта", next: "preparing_material_list", action: "Начать формирование материалов" },
  preparing_material_list: { label: "Формирование списка", next: "preparing_work_schedule", action: "Перейти к графику работ" },
  preparing_work_schedule: { label: "Формирование графика", next: "preparing_contract", action: "Перейти к подготовке договора" },
  preparing_contract: { label: "Подготовка договора", next: "purchase_request", action: "Подготовить заявку на закупку" },
  purchase_request: { label: "Заявка на закупку", next: "supply", action: "Передать в снабжение" },
  supply: { label: "В снабжении", next: "delivery_confirmation", action: "Подтвердить поставку" },
  delivery_confirmation: { label: "Поставка подтверждена" },
};

export function useProjectWorkspace(project: { status?: string; participants?: { id: string }[] }) {
  const [tab, setTab] = useState<ProjectWorkspaceTab>("overview");
  const [editingDeadlines, setEditingDeadlines] = useState(false);
  const stage = PROJECT_STAGES[project.status ?? ""];
  const participants = Array.from(new Map((project.participants ?? []).map((person) => [person.id, person])).values());
  return { tab, setTab, stage, participants, editingDeadlines, setEditingDeadlines };
}
