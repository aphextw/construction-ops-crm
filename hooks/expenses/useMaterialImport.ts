import { useState } from "react";

import { api } from "@/hooks/api_client";

export type MaterialImportFile = {
  uri: string;
  name: string;
  type: string;
};

export type ProjectMaterialImport = {
  id: string;
  project_id: string;
  source_file_type: "pdf" | "xlsx" | "docx";
  status: "uploaded" | "parsed" | "confirmed" | "failed";
  parse_error?: string | null;
  url: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_by?: string | null;
  created_at: string;
};

export type ProjectMaterialImportItem = {
  id: string;
  row_index: number;
  type: string;
  material_type: string;
  quantity: string;
  unit_price?: string | null;
  raw_row: string;
  created_at: string;
};

type MaterialImportDetailResponse = {
  material_import: ProjectMaterialImport;
  items: ProjectMaterialImportItem[];
};

export function useMaterialImport() {
  const [uploadingImport, setUploadingImport] = useState(false);
  const [loadingImportDraft, setLoadingImportDraft] = useState(false);
  const [parsingImport, setParsingImport] = useState(false);
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [materialImportError, setMaterialImportError] = useState<string | null>(
    null,
  );

  const uploadImport = async (projectId: string, file: MaterialImportFile) => {
    try {
      setUploadingImport(true);
      setMaterialImportError(null);

      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      const response = await api.request(
        `api/v1/projects/${projectId}/material-imports`,
        {
          method: "POST",
          body: formData,
          multipart: true,
          headers: {
            accept: "application/json",
          },
        },
      );

      return response?.material_import as ProjectMaterialImport | null;
    } catch (error: any) {
      setMaterialImportError(error?.message || "Не удалось загрузить файл");
      return null;
    } finally {
      setUploadingImport(false);
    }
  };

  const getImportDraft = async (
    projectId: string,
    importId: string,
  ): Promise<MaterialImportDetailResponse | null> => {
    try {
      setLoadingImportDraft(true);
      setMaterialImportError(null);

      const response = await api.get(
        `api/v1/projects/${projectId}/material-imports/${importId}`,
      );

      return response ?? null;
    } catch (error: any) {
      setMaterialImportError(
        error?.message || "Не удалось получить черновик импорта",
      );
      return null;
    } finally {
      setLoadingImportDraft(false);
    }
  };

  const parseImport = async (
    projectId: string,
    importId: string,
  ): Promise<MaterialImportDetailResponse | null> => {
    try {
      setParsingImport(true);
      setMaterialImportError(null);

      const response = await api.request(
        `api/v1/projects/${projectId}/material-imports/${importId}/parse`,
        {
          method: "POST",
        },
      );

      return response ?? null;
    } catch (error: any) {
      setMaterialImportError(error?.message || "Не удалось распарсить файл");
      return null;
    } finally {
      setParsingImport(false);
    }
  };

  const addImportToExpenses = async (
    projectId: string,
    importId: string,
    sectionId?: string | null,
  ) => {
    try {
      setConfirmingImport(true);
      setMaterialImportError(null);

      const response = await api.request(
        `api/v1/projects/${projectId}/material-imports/${importId}/add-to-expenses`,
        {
          method: "POST",
          body: JSON.stringify(sectionId ? { section_id: sectionId } : {}),
        },
      );

      return response ?? null;
    } catch (error: any) {
      setMaterialImportError(
        error?.message || "Не удалось добавить расходы из черновика",
      );
      return null;
    } finally {
      setConfirmingImport(false);
    }
  };

  return {
    uploadingImport,
    loadingImportDraft,
    parsingImport,
    confirmingImport,
    materialImportError,
    uploadImport,
    getImportDraft,
    parseImport,
    addImportToExpenses,
  };
}
