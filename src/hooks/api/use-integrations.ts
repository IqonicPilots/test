import { useQuery } from "@tanstack/react-query"
import { googleEventApi } from "@/services/google-event.service"

export function useIntegrations() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => googleEventApi.getIntegrations(),
    staleTime: 1000 * 10, // 10 seconds
  })

  const integrationsData = data?.data || data;

  // Helper flags for easy consumption - checking if the FEATURE is enabled by admin
  const isGoogleActive = !!integrationsData?.google?.enable_configuration;
  
  const isZoomActive = !!(
    integrationsData?.zoom_telemed?.zoom_oauth?.enabled || 
    integrationsData?.zoom_telemed?.zoom_s2s?.enabled
  );

  const isTelemedEnabled = isGoogleActive || isZoomActive;

  return {
    integrations: data,
    isLoading,
    error,
    isGoogleActive,
    isZoomActive,
    isTelemedEnabled,
    refetch
  }
}
