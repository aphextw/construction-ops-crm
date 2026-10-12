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

export function useUpdateSection() {
  const [loadingUpdateSection, setLoadingUpdateSection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSection = async (
    projectId: any,
    sectionId: string | string[],
    data: any,
  ): Promise<UpdateExpenseResponse | null> => {
    try {
      setLoadingUpdateSection(true);
      setError(null);

      const response: UpdateExpenseResponse = await api.patch(
        `api/v1/projects/${projectId}/material-sections/${sectionId}`,
        { name: data },
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

  return { updateSection, loadingUpdateSection, error };
}
