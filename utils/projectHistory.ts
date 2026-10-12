import type { ProjectHistoryItem } from "@/hooks/project/useProjectHistory";

const HIDDEN_PROJECT_HISTORY_FIELDS = new Set([
  "id",
  "project_id",
  "section_id",
  "big_section_id",
  "material_id",
  "worker_id",
  "user_id",
  "sort_order",
  "access_source",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at",
]);

const PROJECT_HISTORY_FIELD_LABELS: Record<string, string> = {
  name: "Название",
  number: "Подраздел",
  object_code: "Шифр объекта",
  project_code: "Код проекта",
  comment: "Комментарий",
  status: "Статус",
  start_date: "Дата начала",
  end_date: "Дата завершения",
  planned_start_date: "Плановая дата начала",
  planned_end_date: "Плановая дата завершения",
  full_name: "ФИО",
  phone: "Телефон",
  position: "Должность",
  can_view: "Просмотр",
  can_edit: "Редактирование",
  subsection_name: "Наименование подраздела",
  part_number: "Часть",
  part_name: "Наименование части",
  section_code: "Шифр раздела",
  volume: "Том",
};

const PROJECT_HISTORY_STATUS_LABELS: Record<string, string> = {
  project_analysis: "Анализ проекта",
  preparing_material_list: "Формирование списка материалов",
  preparing_work_schedule: "Формирование графика работ",
  preparing_contract: "Подготовка договора",
  purchase_request: "Запрос на закупку",
  supply: "Закупка",
  delivery_confirmation: "Подтверждение поставки",
  completed: "Завершён",
};

export const getProjectHistoryActionLabel = (action: string) => {
  switch (action) {
    case "project_created":
      return "Проект создан";
    case "project_updated":
      return "Данные проекта обновлены";
    case "project_status_updated":
      return "Статус проекта изменён";
    case "project_deadlines_updated":
      return "Обновлены сроки проекта";
    case "project_comment_created":
      return "Добавлен комментарий";
    case "big_section_created":
    case "project.big_section_created":
      return "Добавлен раздел";
    case "big_section_updated":
    case "project.big_section_updated":
      return "Раздел обновлён";
    case "big_section_deleted":
    case "project.big_section_deleted":
      return "Раздел удалён";
    case "material_section_created":
    case "project.material_section_created":
    case "project_material_section_created":
      return "Добавлен подраздел";
    case "material_section_updated":
    case "project.material_section_updated":
    case "project_material_section_updated":
      return "Подраздел обновлён";
    case "material_section_deleted":
    case "project.material_section_deleted":
    case "project_material_section_deleted":
      return "Подраздел удалён";
    case "project.user_access_created":
    case "project_user_access_created":
      return "Выдан доступ пользователю";
    case "project.user_access_updated":
    case "project_user_access_updated":
      return "Права пользователя изменены";
    case "project.user_access_deleted":
    case "project_user_access_deleted":
      return "Доступ пользователя удалён";
    case "project_worker_created":
    case "project.worker_created":
      return "Добавлен работник";
    case "project_worker_deleted":
    case "project.worker_deleted":
      return "Удалён работник";
    default:
      return action
        .replace(/^project\./, "")
        .replace(/^project_/, "")
        .replace(/^material_section_/, "подраздел ")
        .replace(/^worker_/, "работник ")
        .replace(/^user_access_/, "доступ ")
        .replace(/_/g, " ")
        .replace(/^./, (char) => char.toUpperCase());
  }
};

const normalizeHistoryValue = (value: any) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return value;
};

const formatStatusValue = (value: string) =>
  PROJECT_HISTORY_STATUS_LABELS[value] || value;

export const formatProjectHistoryValue = (key: string, value: any) => {
  const normalizedValue = normalizeHistoryValue(value);

  if (normalizedValue === null) {
    return null;
  }

  if (key === "status" && typeof normalizedValue === "string") {
    return formatStatusValue(normalizedValue);
  }

  if (typeof normalizedValue === "boolean") {
    return normalizedValue ? "Да" : "Нет";
  }

  if (Array.isArray(normalizedValue)) {
    const joined = normalizedValue
      .map((item) => (typeof item === "string" ? item.trim() : String(item)))
      .filter(Boolean)
      .join(", ");

    return joined || null;
  }

  if (typeof normalizedValue === "object") {
    if (normalizedValue.full_name) {
      return normalizedValue.full_name;
    }

    if (normalizedValue.name) {
      return normalizedValue.name;
    }

    if (normalizedValue.display_name) {
      return normalizedValue.display_name;
    }

    return null;
  }

  return String(normalizedValue);
};

export const getProjectHistorySummaryLines = (item: ProjectHistoryItem) => {
  const before = item.before || {};
  const after = item.after || {};

  return Object.keys({ ...before, ...after })
    .filter((key) => {
      if (HIDDEN_PROJECT_HISTORY_FIELDS.has(key)) {
        return false;
      }

      return JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]);
    })
    .map((key) => {
      const label = PROJECT_HISTORY_FIELD_LABELS[key] || key;
      const beforeRaw = normalizeHistoryValue(before?.[key]);
      const afterRaw = normalizeHistoryValue(after?.[key]);
      const beforeValue = formatProjectHistoryValue(key, before?.[key]);
      const afterValue = formatProjectHistoryValue(key, after?.[key]);

      if (beforeRaw === null && afterRaw !== null && afterValue) {
        return `Добавлено: ${label} — ${afterValue}`;
      }

      if (beforeRaw !== null && afterRaw === null && beforeValue) {
        return `Удалено: ${label} — ${beforeValue}`;
      }

      if (afterValue) {
        return `Изменено: ${label} — ${afterValue}`;
      }

      return null;
    })
    .filter(Boolean) as string[];
};
