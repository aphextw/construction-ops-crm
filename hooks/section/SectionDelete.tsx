import { useState } from "react";
import { api } from "@/hooks/api_client";

type UpdateExpensePayload = {
  section_id?: string;
  material_type?: string;
  quantity?: string;
};

type UpdateExpenseResponse = {
  id: string;
};

export function useDeleteSection() {
  const [loadingUpdateSection, setLoadingUpdateSection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSection = async (
    projectId: any,
    sectionId: string | string[],
  ) => {
    try {
      setLoadingUpdateSection(true);
      setError(null);

      console.log(projectId);
      console.log(sectionId);

      const response: UpdateExpenseResponse = await api.delete(
        `api/v1/projects/${projectId}/material-sections/${sectionId}`,
      );

      console.log(response);

      return response;
    } catch (e: any) {
      const errorMessage = e?.message || "Ошибка обновления раздела";

      setError(errorMessage);
      return null;
    } finally {
      setLoadingUpdateSection(false);
    }
  };

  return { deleteSection, loadingUpdateSection, error };
}
