// components/project_stuff/BigSectionsList.tsx

import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useDataUserStore } from "@/store/useStore";
import { Colors } from "@/constants/theme";
import { WorkspaceIcon, useWorkspaceTheme } from "@/components/ui/workspace";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface InnerSection {
  id: string;
  name: string;
  expenses_count?: number;
  total_materials_cost?: number;
  expenses?: any[];
}

interface BigSection {
  id: string;
  name: string;
  number: string;
  sort_order?: number;
  inner_sections: any;
}

interface Props {
  bigSections: BigSection[];
  projectId: string;
  projectStatus: string;
  role: string;
  // formatCost: (value: number) => string;
  formatCost: any;
  capitalize: (text: string) => string;
  setExpensesToOpen?: (expenses: any[]) => void;
  setSectionToOpen?: (section: any) => void;
  onAdd?: (bigSection: BigSection) => void;
}

export const BigSectionsList = ({
  bigSections,
  projectId,
  projectStatus,
  role,
  formatCost,
  capitalize,
  onAdd,
}: Props) => {
  const colorScheme = useColorScheme();
  const theme = useWorkspaceTheme();
  const setSectionToOpen = useDataUserStore((state) => state.setSectionToOpen);
  const setExpensesToOpen = useDataUserStore(
    (state) => state.setExpensesToOpen,
  );
  const expensesToOpen = useDataUserStore((state) => state.expensesToOpen);

  const [openedSections, setOpenedSections] = useState<string[]>([]);

  const toggleSection = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setOpenedSections((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const isOpened = (id: string) => openedSections.includes(id);

  return (
    <View style={styles.container}>
      {bigSections?.map((bigSection) => (
        <View
          key={bigSection.id}
          style={[
            styles.bigSectionCard,
            {
              backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => toggleSection(bigSection.id)}
            style={styles.bigSectionHeader}
          >
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.bigSectionNumber}>
                Раздел {bigSection.number}
              </ThemedText>

              <ThemedText style={styles.bigSectionTitle}>
                {capitalize(bigSection.name)}
              </ThemedText>
            </View>

            <WorkspaceIcon
              name={isOpened(bigSection.id) ? "chevron-up" : "chevron-down"}
              size={22}
              color={theme.secondary}
            />
          </TouchableOpacity>

          {isOpened(bigSection.id) && (
            <View style={styles.innerSectionsContainer}>
              <TouchableOpacity
                style={styles.addSectionButton}
                onPress={() => onAdd?.(bigSection)}
              >
                <WorkspaceIcon name="add" size={20} color={theme.primary} />
                <ThemedText style={[styles.addSectionText, { color: theme.primary }]}>Добавить подраздел</ThemedText>
              </TouchableOpacity>
              {bigSection.inner_sections?.map((section: any) => (
                <TouchableOpacity
                  key={section.id}
                  activeOpacity={0.8}
                  style={styles.sectionCard}
                  onPress={() => {
                    // @ts-ignore
                    setSectionToOpen(section);

                    setExpensesToOpen(section.expenses);

                    router.push({
                      pathname: "/inner_pages/expensesPage",
                      params: {
                        part_number: section.part_number,
                        volume: section.volume,
                        subsection_name: section.subsection_name,
                        name: section.name,
                        number: section.number,
                        part_name: section.part_name,
                        section_cod: section.section_cod,
                        sectionName: section.name,
                        projectId: projectId,
                        projectStatus: projectStatus,
                        sectionId: section.id,
                      },
                    });
                  }}
                >
                  <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionName}>
                      {capitalize(section.name)}
                    </ThemedText>

                    <WorkspaceIcon name="chevron-forward" size={14} color={theme.secondary} />
                  </View>

                  <View style={styles.sectionStats}>
                    <View style={styles.sectionStat}>
                      <ThemedText style={[styles.sectionStatLabel, { color: theme.secondary }]}>
                        Расходов: {section.expenses_count || 0}
                      </ThemedText>
                    </View>

                    {!["pto", "estimator_plus"].includes(role) && (
                      <>
                        <View style={styles.sectionStat}>
                          <ThemedText
                            style={[
                              styles.sectionStatValue,
                              styles.sectionCost,
                            ]}
                          >
                            {formatCost(section.total_materials_cost || 0)}
                          </ThemedText>
                        </View>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },

  addSectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },

  addSectionText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.blue,
  },

  bigSectionCard: {
    borderRadius: 12,
    overflow: "hidden",
  },

  bigSectionHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  bigSectionNumber: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 4,
  },

  bigSectionTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "600",
  },

  innerSectionsContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 0,
  },

  sectionCard: {
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(142,142,147,0.25)",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  sectionName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },

  sectionStats: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionStat: {
    flex: 1,
  },

  sectionStatLabel: {
    fontSize: 12,
  },

  sectionStatValue: {
    fontSize: 15,
    fontWeight: "700",
  },

  sectionCost: {
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },

  sectionDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#d1d1d6",
    marginHorizontal: 14,
    opacity: 0.4,
  },
});
