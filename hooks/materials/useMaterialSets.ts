import { useCallback, useState } from "react";

import { api } from "@/hooks/api_client";
import type { MeasurementUnit } from "@/hooks/materials/useMaterials";

export type MaterialSetItem = {
  id: string;
  set_id: string;
  material_id: string;
  name: string;
  value: string;
  unit: MeasurementUnit;
  measurements: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type MaterialSet = {
  id: string;
  name: string;
  set_items: MaterialSetItem[];
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export function useMaterialSets() {
  const [sets, setSets] = useState<MaterialSet[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [savingSet, setSavingSet] = useState(false);
  const [deletingSet, setDeletingSet] = useState(false);
  const [setsError, setSetsError] = useState<string | null>(null);
  const [setActionError, setSetActionError] = useState<string | null>(null);

  const getMaterialSets = useCallback(async () => {
    try {
      setLoadingSets(true);
      setSetsError(null);
      const response = await api.get("api/v1/material-sets");
      const list = Array.isArray(response?.material_sets)
        ? response.material_sets
        : [];
      setSets(list);
      return list as MaterialSet[];
    } catch (error: any) {
      const message = error?.message || "Не удалось загрузить комплекты";
      setSetsError(message);
      return [];
    } finally {
      setLoadingSets(false);
    }
  }, []);

  const getMaterialSet = useCallback(async (setId: string) => {
    const response = await api.get(`api/v1/material-sets/${setId}`);
    return (response?.material_set as MaterialSet | undefined) ?? null;
  }, []);

  const createMaterialSet = useCallback(async (name: string) => {
    const response = await api.post("api/v1/material-sets", { name });
    return (response?.material_set as MaterialSet | undefined) ?? null;
  }, []);

  const updateMaterialSet = useCallback(async (setId: string, name: string) => {
    const response = await api.patch(`api/v1/material-sets/${setId}`, { name });
    return (response?.material_set as MaterialSet | undefined) ?? null;
  }, []);

  const addMaterialSetItem = useCallback(
    async (
      setId: string,
      payload: { material_id: string; measurements: string; sort_order?: number },
    ) => {
      const response = await api.post(`api/v1/material-sets/${setId}/items`, payload);
      return {
        set: (response?.material_set as MaterialSet | undefined) ?? null,
        item: (response?.item as MaterialSetItem | undefined) ?? null,
      };
    },
    [],
  );

  const updateMaterialSetItem = useCallback(
    async (
      setId: string,
      itemId: string,
      payload: { material_id: string; measurements: string; sort_order: number },
    ) => {
      const response = await api.patch(
        `api/v1/material-sets/${setId}/items/${itemId}`,
        payload,
      );
      return {
        set: (response?.material_set as MaterialSet | undefined) ?? null,
        item: (response?.item as MaterialSetItem | undefined) ?? null,
      };
    },
    [],
  );

  const deleteMaterialSetItem = useCallback(async (setId: string, itemId: string) => {
    const response = await api.delete(`api/v1/material-sets/${setId}/items/${itemId}`);
    return {
      set: (response?.material_set as MaterialSet | undefined) ?? null,
      item: (response?.deleted_item as MaterialSetItem | undefined) ?? null,
    };
  }, []);

  const createSetWithItems = useCallback(
    async (
      name: string,
      items: Array<{ material_id: string; measurements: string; sort_order: number }>,
    ) => {
      try {
        setSavingSet(true);
        setSetActionError(null);

        const createdSet = await createMaterialSet(name.trim());
        if (!createdSet) {
          throw new Error("Не удалось создать комплект");
        }

        for (const item of items) {
          await addMaterialSetItem(createdSet.id, item);
        }

        const freshSet = await getMaterialSet(createdSet.id);
        if (freshSet) {
          setSets((prev) => [freshSet, ...prev.filter((entry) => entry.id !== freshSet.id)]);
        }
        return freshSet;
      } catch (error: any) {
        setSetActionError(error?.message || "Не удалось создать комплект");
        return null;
      } finally {
        setSavingSet(false);
      }
    },
    [addMaterialSetItem, createMaterialSet, getMaterialSet],
  );

  const updateSetWithItems = useCallback(
    async (
      existingSet: MaterialSet,
      name: string,
      items: Array<{ material_id: string; measurements: string; sort_order: number }>,
    ) => {
      try {
        setSavingSet(true);
        setSetActionError(null);

        await updateMaterialSet(existingSet.id, name.trim());

        const nextByMaterialId = new Map(items.map((item) => [item.material_id, item]));
        const currentByMaterialId = new Map(
          existingSet.set_items.map((item) => [item.material_id, item]),
        );

        for (const currentItem of existingSet.set_items) {
          if (!nextByMaterialId.has(currentItem.material_id)) {
            await deleteMaterialSetItem(existingSet.id, currentItem.id);
          }
        }

        for (const item of items) {
          const currentItem = currentByMaterialId.get(item.material_id);
          if (!currentItem) {
            await addMaterialSetItem(existingSet.id, item);
            continue;
          }

          if (
            currentItem.measurements !== item.measurements ||
            currentItem.sort_order !== item.sort_order
          ) {
            await updateMaterialSetItem(existingSet.id, currentItem.id, item);
          }
        }

        const freshSet = await getMaterialSet(existingSet.id);
        if (freshSet) {
          setSets((prev) =>
            prev.map((entry) => (entry.id === freshSet.id ? freshSet : entry)),
          );
        }
        return freshSet;
      } catch (error: any) {
        setSetActionError(error?.message || "Не удалось обновить комплект");
        return null;
      } finally {
        setSavingSet(false);
      }
    },
    [addMaterialSetItem, deleteMaterialSetItem, getMaterialSet, updateMaterialSet, updateMaterialSetItem],
  );

  const removeMaterialSet = useCallback(async (setId: string) => {
    try {
      setDeletingSet(true);
      setSetActionError(null);
      await api.delete(`api/v1/material-sets/${setId}`);
      setSets((prev) => prev.filter((entry) => entry.id !== setId));
      return true;
    } catch (error: any) {
      setSetActionError(error?.message || "Не удалось удалить комплект");
      return false;
    } finally {
      setDeletingSet(false);
    }
  }, []);

  return {
    sets,
    loadingSets,
    savingSet,
    deletingSet,
    setsError,
    setActionError,
    getMaterialSets,
    getMaterialSet,
    createSetWithItems,
    updateSetWithItems,
    removeMaterialSet,
  };
}
