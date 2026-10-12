import { useState } from "react";
import { api } from "@/hooks/api_client";

interface UseCreateMaterialSectionResult {
  createSection: (
    projectId: string,
    payload: {
      number: string;
      subsection_name: string;
      part_number: string;
      part_name: string;
      section_code: string;
      volume: string;
    },
    bigSectionId: any,
  ) => Promise<any>;
  errorSection: string | null;
  loadingSection: boolean;
}

export function useCreateMaterialSection(): UseCreateMaterialSectionResult {
  const [loadingSection, setLoading] = useState(false);
  const [errorSection, setError] = useState<string | null>(null);

  const createSection = async (
    projectId: string,
    payload: {
      number: string;
      subsection_name: string;
      part_number: string;
      part_name: string;
      section_code: string;
      volume: string;
    },
    bigSectionId: string,
  ): Promise<any> => {
    if (!projectId) {
      setError("ID проекта не указан");
      return null;
    }

    if (!payload.subsection_name.trim()) {
      setError("Введите наименование подраздела");
      return null;
    }

    setLoading(true);
    setError(null);

    console.log(bigSectionId);

    try {
      const response = await api.post(
        `api/v1/projects/${projectId}/material-sections`,
        {
          name: payload.subsection_name.trim(),
          number: payload.number.trim(),
          subsection_name: payload.subsection_name.trim(),
          part_number: payload.part_number.trim(),
          part_name: payload.part_name.trim(),
          section_code: payload.section_code.trim(),
          volume: payload.volume.trim(),
          big_section_id: bigSectionId,
        },
      );

      return response;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ошибка создания раздела";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createSection, loadingSection, errorSection };
}
