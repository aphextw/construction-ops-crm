import { USER_CREATION_ROLES, ROLE_OPTIONS } from "@/constants/authOptions";

export type CreateUserForm = { full_name: string; email: string; role: string; phone: string };

export function canCreateUserAccount(role?: string) {
  return USER_CREATION_ROLES.includes(role ?? "");
}

export function buildCreateUserPayload(form: CreateUserForm) {
  const fullName = form.full_name.trim();
  const email = form.email.trim().toLowerCase();
  if (fullName.length < 2) throw new Error("Введите имя и фамилию");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Введите корректную почту");
  if (!ROLE_OPTIONS.some((option) => option.code === form.role)) throw new Error("Выберите роль");
  return {
    full_name: fullName,
    email,
    role: form.role,
    company_code: "tsk_stu",
    phones: form.phone.trim() ? [form.phone.trim()] : [],
  };
}

export function getCreateUserError(error: unknown) {
  let message = error instanceof Error ? error.message : "Не удалось создать аккаунт";
  try {
    message = JSON.parse(message)?.error || message;
  } catch {
    // Validation and network errors are plain text.
  }
  const messages: Record<string, string> = {
    "email already used": "Аккаунт с этой почтой уже существует",
    "director already exists": "Директор уже назначен",
    "deputy director already exists": "Заместитель директора уже назначен",
    "developer role is disabled": "Создание аккаунта разработчика отключено на сервере",
    "invalid role": "Эта роль недоступна",
    "invalid company role": "Эта роль недоступна в СТУ",
    "invalid request body": "Проверьте введённые данные",
    "invalid profile": "Проверьте имя и телефон",
    "insufficient permissions": "Нет прав на создание аккаунтов",
    "forbidden": "Нет прав на создание аккаунтов",
    "Network request failed": "Нет связи с сервером. Проверьте список пользователей перед повторной попыткой",
  };
  return messages[message] ?? message;
}
