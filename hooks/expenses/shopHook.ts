import { useEffect, useState } from "react";
import { api } from "@/hooks/api_client";

type Shop = {
  id: string;
  name: string;
};

export type ShopDirectoryItem = Shop;

export function useShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getShops = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("api/v1/shops");
      setShops(response.shops || []);
      return response.shops || [];
    } catch (e) {
      console.log("shops error", e);
      setError("Не удалось загрузить магазины");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getShops();
  }, []);

  return { shops, loading, error, refreshShops: getShops };
}
