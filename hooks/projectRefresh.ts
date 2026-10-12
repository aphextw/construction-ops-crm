import { useEffect, useState } from "react";
import { api } from "@/hooks/api_client";

type MaterialPhoto = {
  id: string;
  url: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
};

type MaterialExpense = {
  id: string;
  material_type: string;
  quantity: string;
  unit_price: string;
  line_total: string;
  photos: MaterialPhoto[];
  created_at: string;
  updated_at: string;
};

type Project = {
  material_sections: any;
  id: string;
  number: string;
  name: string;
  object_code: string;
  project_code: string;
  total_materials_cost: string;
  material_expenses: MaterialExpense[];
};

type ApiResponse = {
  project: Project;
};

export function useGetProject() {
  const [projectDataRefresh, setProjectData] = useState<Project>();
  const [refreshing, setRefreshing] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const getProject = async (project_id: any) => {
    try {
      setRefreshing(true);
      const data: ApiResponse = await api.get(`api/v1/projects/${project_id}`);
      setProjectData(data.project);

      setError(null);

      return data.project;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setRefreshing(false);
    }
  };

  return { getProject, projectDataRefresh, refreshing, error };
}
