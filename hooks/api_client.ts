import * as SecureStore from "expo-secure-store";
import { monitoredFetch } from "@/utils/monitoring";


export const API_URL = import.meta.env.VITE_API_URL;

type ApiRequestOptions = RequestInit & {
  multipart?: boolean;
};

export async function refreshToken() {
  const refreshToken = await SecureStore.getItemAsync("refresh_token");

  if (!refreshToken) {
    throw new Error("Нет refresh токена");
  }

  const res = await monitoredFetch(`${API_URL}api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Не удалось обновить токен");
  }

  const data = await res.json();

  const newAccess = data?.access_token || data?.tokens?.access_token;

  const newRefresh = data?.refresh_token || data?.tokens?.refresh_token;

  if (!newAccess) {
    throw new Error("Нет access_token в ответе");
  }

  await SecureStore.setItemAsync("access_token", newAccess);

  if (newRefresh) {
    await SecureStore.setItemAsync("refresh_token", newRefresh);
  }

  return newAccess;
}

export const api = {
  async request(
    url: string,
    options: ApiRequestOptions = {},
    responseType: "json" | "blob" | "text" = "json",
    retry = true,
  ) {
    let token = await SecureStore.getItemAsync("access_token");

    const { multipart = false, ...fetchOptions } = options;

    const makeRequest = async (accessToken: string | null) => {
      return monitoredFetch(`${API_URL}${url}`, {
        ...fetchOptions,
        headers: {
          ...(multipart ? {} : { "Content-Type": "application/json" }),
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          accept: responseType === "blob" ? "*/*" : "application/json",
          ...(fetchOptions.headers || {}),
        },
      });
    };

    let res = await makeRequest(token);

    // console.log(res);

    if (res.status === 401 && retry) {
      const newToken = await refreshToken();
      res = await makeRequest(newToken);
    }

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Ошибка запроса");
    }

    // Вот здесь выбираем способ парсинга
    switch (responseType) {
      case "blob":
        return res.blob();
      case "text":
        return res.text();
      default:
        return res.json();
    }
  },

  get(url: string, responseType?: "json" | "blob" | "text") {
    return this.request(url, {}, responseType);
  },

  post(url: string, body: any) {
    return this.request(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  patch(url: string, body: any) {
    return this.request(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete(url: string) {
    return this.request(url, {
      method: "DELETE",
    });
  },

  // Специальный метод для скачивания файлов
  download(url: string) {
    return this.request(url, {}, "blob");
  },
};
