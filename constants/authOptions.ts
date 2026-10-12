export type AuthOption = {
  code: string;
  label: string;
  description?: string;
};

export const USER_CREATION_ROLES = ["estimator_plus", "developer"];

export const COMPANY_OPTIONS: AuthOption[] = [
  {
    code: "tsk_stu",
    label: "ТСК СТУ",
    description: "Основная компания",
  },
  {
    code: "inzhkom_b",
    label: "ИНЖКОМ-Б",
    description: "Дочерняя компания",
  },
];

export const ROLE_OPTIONS: AuthOption[] = [
  { code: "director", label: "Директор" },
  { code: "deputy_director", label: "Заместитель директора" },
  { code: "developer", label: "Разработчик" },
  { code: "site_manager", label: "Начальник участка" },
  { code: "material_buyer", label: "Снабженец" },
  { code: "estimator", label: "Сметчик" },
  { code: "estimator_plus", label: "Начальник ПТО" },
  { code: "pto", label: "ПТО" },
  { code: "brigadier", label: "Бригадир" },
  { code: "lawyer", label: "Юрист" },
  { code: "accountant", label: "Бухгалтер" },
];
