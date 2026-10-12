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
  id: string;
  number: string;
  name: string;
  object_code: string;
  project_code: string;
  total_materials_cost: string;
  status: string;
  material_expenses: MaterialExpense[];
};

type ApiResponse = {
  projects: Project[];
};

export function useGetProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProjects = async () => {
    setLoading(true);

    try {
      const data: ApiResponse = await api.get("api/v1/projects");

      setProjects(data.projects);

      setError(null);

      return data.projects;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    getProjects, // 👈 ВАЖНО: теперь можно рефрешить
  };
}
