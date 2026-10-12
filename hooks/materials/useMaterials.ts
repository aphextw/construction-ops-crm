import { useCallback, useState } from "react";

import { api } from "@/hooks/api_client";

export type MeasurementUnit = {
  id: string;
  code: string;
  display_name: string;
  dimension: string;
};

export type MaterialCatalogItem = {
  id: string;
  name: string;
  value: string;
  unit: MeasurementUnit;
  measurements: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export function useMaterials() {
  const [materials, setMaterials] = useState<MaterialCatalogItem[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState(false);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [materialActionError, setMaterialActionError] = useState<string | null>(
    null,
  );

  const getMaterials = useCallback(async () => {
    try {
      setLoadingMaterials(true);
      setMaterialsError(null);

      const response = await api.get("api/v1/materials");
      const list = Array.isArray(response?.materials) ? response.materials : [];

      setMaterials(list);
      return list as MaterialCatalogItem[];
    } catch (error: any) {
      const message =
        error?.message || "Не удалось загрузить справочник материалов";
      setMaterialsError(message);
      return [];
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  const getMeasurementUnits = useCallback(async () => {
    try {
      setLoadingUnits(true);
      setUnitsError(null);
      const response = await api.get("api/v1/measurement-units");
      const list = Array.isArray(response?.units) ? response.units : [];
      setUnits(list);
      return list as MeasurementUnit[];
    } catch (error: any) {
      const message =
        error?.message || "Не удалось загрузить справочник единиц измерения";
      console.log("MEASUREMENT UNITS ERROR:", error);
      setUnitsError(message);
      setUnits([]);
      return [];
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  const createMaterial = useCallback(
    async (payload: {
      name: string;
      value: string;
      unit_id: string;
      measurements: string;
    }) => {
      try {
        setSavingMaterial(true);
        setMaterialActionError(null);
        const response = await api.post("api/v1/materials", payload);
        const created = response?.material as MaterialCatalogItem | undefined;
        if (created) {
          setMaterials((prev) => [created, ...prev]);
        }
        return created ?? null;
      } catch (error: any) {
        console.log("CREATE MATERIAL ERROR:", error);
        setMaterialActionError(
          error?.message || "Не удалось создать материал",
        );
        return null;
      } finally {
        setSavingMaterial(false);
      }
    },
    [],
  );

  const updateMaterial = useCallback(
    async (
      materialId: string,
      payload: {
        name: string;
        value: string;
        unit_id: string;
        measurements: string;
      },
    ) => {
      try {
        setSavingMaterial(true);
        setMaterialActionError(null);
        const response = await api.patch(
          `api/v1/materials/${materialId}`,
          payload,
        );
        const updated = response?.material as MaterialCatalogItem | undefined;
        if (updated) {
          setMaterials((prev) =>
            prev.map((item) => (item.id === materialId ? updated : item)),
          );
        }
        return updated ?? null;
      } catch (error: any) {
        console.log("UPDATE MATERIAL ERROR:", error);
        setMaterialActionError(
          error?.message || "Не удалось обновить материал",
        );
        return null;
      } finally {
        setSavingMaterial(false);
      }
    },
    [],
  );

  const deleteMaterial = useCallback(async (materialId: string) => {
    try {
      setDeletingMaterial(true);
      setMaterialActionError(null);
      await api.delete(`api/v1/materials/${materialId}`);
      setMaterials((prev) => prev.filter((item) => item.id !== materialId));
      return true;
    } catch (error: any) {
      console.log("DELETE MATERIAL ERROR:", error);
      setMaterialActionError(
        error?.message || "Не удалось удалить материал",
      );
      return false;
    } finally {
      setDeletingMaterial(false);
    }
  }, []);

  return {
    materials,
    units,
    loadingMaterials,
    loadingUnits,
    savingMaterial,
    deletingMaterial,
    materialsError,
    unitsError,
    materialActionError,
    getMaterials,
    getMeasurementUnits,
    createMaterial,
    updateMaterial,
    deleteMaterial,
  };
}
