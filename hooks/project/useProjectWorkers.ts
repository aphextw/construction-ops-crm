import { useState } from "react";

import { api } from "@/hooks/api_client";

export type WorkerCatalogItem = {
  id: string;
  full_name: string;
  phone?: string | null;
  position?: string | null;
  created_at?: string;
};

export type ProjectWorkerItem = {
  id: string;
  worker_id: string;
  full_name: string;
  phone?: string | null;
  position?: string | null;
  created_at: string;
};

type AddProjectWorkerPayload = {
  worker_id?: string;
  full_name?: string;
  phone?: string;
  position?: string;
};

export function useProjectWorkers() {
  const [loadingProjectWorkers, setLoadingProjectWorkers] = useState(false);
  const [savingProjectWorker, setSavingProjectWorker] = useState(false);
  const [loadingWorkersCatalog, setLoadingWorkersCatalog] = useState(false);
  const [projectWorkersError, setProjectWorkersError] = useState<string | null>(
    null,
  );

  type UpdateWorkerPayload = {
    full_name?: string;
    phone?: string;
    position?: string;
  };

  const updateWorker = async (
    workerId: string,
    payload: UpdateWorkerPayload,
  ) => {
    try {
      setSavingProjectWorker(true);
      setProjectWorkersError(null);

      const response = await api.patch(`api/v1/workers/${workerId}`, payload);

      return response?.worker ?? null;
    } catch (error: any) {
      setProjectWorkersError(error?.message || "Не удалось обновить работника");
      return null;
    } finally {
      setSavingProjectWorker(false);
    }
  };

  const deleteWorker = async (workerId: string) => {
    try {
      setSavingProjectWorker(true);
      setProjectWorkersError(null);

      const response = await api.delete(`api/v1/workers/${workerId}`);
      return response?.deleted_worker ?? null;
    } catch (error: any) {
      setProjectWorkersError(error?.message || "Не удалось удалить работника");
      return null;
    } finally {
      setSavingProjectWorker(false);
    }
  };

  const listProjectWorkers = async (projectId: string) => {
    try {
      setLoadingProjectWorkers(true);
      setProjectWorkersError(null);

      const response = await api.get(`api/v1/projects/${projectId}/workers`);
      return response?.workers ?? [];
    } catch (error: any) {
      setProjectWorkersError(
        error?.message || "Не удалось загрузить работников проекта",
      );
      return [];
    } finally {
      setLoadingProjectWorkers(false);
    }
  };

  const searchWorkersCatalog = async (query?: string) => {
    try {
      setLoadingWorkersCatalog(true);
      setProjectWorkersError(null);

      const suffix = query?.trim()
        ? `?query=${encodeURIComponent(query.trim())}`
        : "";
      const response = await api.get(`api/v1/workers${suffix}`);
      return response?.workers ?? [];
    } catch (error: any) {
      setProjectWorkersError(
        error?.message || "Не удалось загрузить список работников",
      );
      return [];
    } finally {
      setLoadingWorkersCatalog(false);
    }
  };

  const addProjectWorker = async (
    projectId: string,
    payload: AddProjectWorkerPayload,
  ) => {
    try {
      setSavingProjectWorker(true);
      setProjectWorkersError(null);

      const response = await api.post(
        `api/v1/projects/${projectId}/workers`,
        payload,
      );
      return response?.worker ?? null;
    } catch (error: any) {
      setProjectWorkersError(
        error?.message || "Не удалось добавить работника в проект",
      );
      return null;
    } finally {
      setSavingProjectWorker(false);
    }
  };

  const deleteProjectWorker = async (projectId: string, workerId: string) => {
    try {
      setSavingProjectWorker(true);
      setProjectWorkersError(null);

      const response = await api.delete(
        `api/v1/projects/${projectId}/workers/${workerId}`,
      );
      return response?.project ?? null;
    } catch (error: any) {
      setProjectWorkersError(
        error?.message || "Не удалось убрать работника из проекта",
      );
      return null;
    } finally {
      setSavingProjectWorker(false);
    }
  };

  return {
    loadingProjectWorkers,
    savingProjectWorker,
    loadingWorkersCatalog,
    projectWorkersError,
    deleteWorker,
    updateWorker,
    listProjectWorkers,
    searchWorkersCatalog,
    addProjectWorker,
    deleteProjectWorker,
  };
}
