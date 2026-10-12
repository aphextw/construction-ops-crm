import { useCallback, useState } from "react";
import { useGetProject } from "@/hooks/projectRefresh";
import { useDataUserStore } from "@/store/useStore";

type Props = {
  projectId: string;
  sectionId?: string;
};

export const useProjectExpensesRefresh = ({ projectId, sectionId }: Props) => {
  const [refreshing, setRefreshing] = useState(false);

  const { getProject } = useGetProject();

  const setProjectToOpen = useDataUserStore((state) => state.setProjectToOpen);

  const setSectionToOpen = useDataUserStore((state) => state.setSectionToOpen);

  const setExpensesToOpen = useDataUserStore(
    (state) => state.setExpensesToOpen,
  );

  const getVisibleExpenses = (materialExpenses: any[] = []) => {
    if (!sectionId) {
      return materialExpenses;
    }

    return materialExpenses.filter(
      (expense: any) => expense.section_id === sectionId,
    );
  };

  const refreshProjectExpenses = useCallback(async () => {
    setRefreshing(true);

    try {
      const updatedProject = await getProject(projectId);

      if (!updatedProject) {
        return null;
      }

      const filteredExpenses = getVisibleExpenses(
        updatedProject.material_expenses,
      );

      const refreshedSection = (updatedProject.material_sections || []).find(
        (section: any) => section.id === sectionId,
      );

      setProjectToOpen(updatedProject);

      if (refreshedSection) {
        setSectionToOpen(refreshedSection);
      }

      setExpensesToOpen(filteredExpenses);

      return updatedProject;
    } finally {
      setRefreshing(false);
    }
  }, [projectId, sectionId]);

  return {
    refreshing,
    refreshProjectExpenses,
  };
};
