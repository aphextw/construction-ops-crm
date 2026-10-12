import { useState } from "react";

import { api } from "@/hooks/api_client";

export function useProjectParticipantRating() {
  const [ratingParticipantId, setRatingParticipantId] = useState<string | null>(
    null,
  );

  const rateParticipant = async (
    projectId: string,
    participantId: string,
    value: -1 | 0 | 1,
  ) => {
    try {
      setRatingParticipantId(participantId);

      const response = await api.post(
        `api/v1/projects/${projectId}/participants/${participantId}/rating`,
        {
          method: "POST",
          body: JSON.stringify(value),
        },
      );

      console.log(response);

      return response ?? null;
    } catch (error) {
      return null;
    } finally {
      setRatingParticipantId(null);
    }
  };

  return {
    ratingParticipantId,
    rateParticipant,
  };
}
