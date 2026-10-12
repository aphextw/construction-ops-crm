import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/hooks/api_client";
import { AppUser } from "@/hooks/useUsers";
import { buildCreateUserPayload, canCreateUserAccount, CreateUserForm, getCreateUserError } from "@/utils/userCreation";

type CreatedAccount = { user: AppUser; password: string | null };

export function useCreateUser() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedAccount | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem("user").then((saved) => {
      const user = saved ? JSON.parse(saved) : null;
      if (active) setAllowed(canCreateUserAccount(user?.role?.code));
    }).catch(() => {
      if (active) setAllowed(false);
    }).finally(() => {
      if (active) setCheckingAccess(false);
    });
    return () => { active = false; };
  }, []);

  const createUser = useCallback(async (form: CreateUserForm) => {
    if (submitting.current || created) return;
    if (!allowed) {
      setError("Нет прав на создание аккаунтов");
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError(null);
    try {
      const payload = buildCreateUserPayload(form);
      const response = await api.post("api/v1/auth/register", payload);
      // Registration also returns the new user's tokens. Never apply them to the creator's session.
      setCreated({ user: response.user, password: response.generated_password || null });
    } catch (failure) {
      setError(getCreateUserError(failure));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }, [allowed, created]);

  return { checkingAccess, allowed, saving, error, created, createUser };
}
