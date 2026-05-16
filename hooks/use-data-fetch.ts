"use client";

import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataRecord = Record<string, any>;

interface UseDataFetchResult<T = DataRecord> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to fetch array data from an API endpoint.
 * Returns { data, loading, error, refresh }.
 */
export function useDataFetch<T = DataRecord>(apiEndpoint: string, entityLabel?: string): UseDataFetchResult<T> {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiEndpoint);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || `Failed to fetch ${entityLabel || "data"}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, entityLabel]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
