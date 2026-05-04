import { api } from "@/lib/api/axios";

export interface ZoomOAuthConfig {
  enabled: boolean;
  client_id: string;
  client_secret: string;
}

export interface ZoomS2SConfig {
  enabled: boolean;
}

export interface ZoomTelemedConfig {
  zoom_oauth: ZoomOAuthConfig;
  zoom_s2s: ZoomS2SConfig;
  is_zoom_enabled?: boolean;
  doctor_zoom_connected?: boolean;
  doctor_s2s_configured?: boolean;
  doctor_s2s?: {
    account_id: string;
    client_id: string;
    has_secret: boolean;
    client_secret?: string;
  };
}

export interface DoctorZoomS2SPayload {
  account_id: string;
  client_id: string;
  client_secret?: string;
}

export const zoomTelemedApi = {
  /** Save admin Zoom telemed configuration (OAuth / S2S toggle + credentials) */
  saveConfig: async (payload: { zoom_oauth?: Partial<ZoomOAuthConfig>; zoom_s2s?: Partial<ZoomS2SConfig> }): Promise<any> => {
    const response = await api.post("/settings/zoom-telemed/config", payload);
    return response.data;
  },

  /** Get Zoom OAuth URL for doctor connection */
  getOAuthUrl: async (): Promise<{ url: string; redirect_uri: string }> => {
    const response = await api.get("/settings/zoom-oauth/url");
    return response.data?.data;
  },

  /** Save doctor's Zoom OAuth token (after callback) */
  saveOAuthToken: async (token: any): Promise<any> => {
    const response = await api.post("/settings/zoom-oauth/token", { token });
    return response.data;
  },

  /** Save doctor's S2S credentials */
  saveDoctorS2S: async (payload: DoctorZoomS2SPayload): Promise<any> => {
    const response = await api.post("/settings/zoom-telemed/doctor-s2s", payload);
    return response.data;
  },

  /** Test doctor's S2S configuration */
  testDoctorS2S: async (): Promise<any> => {
    const response = await api.post("/settings/zoom-telemed/doctor-s2s/test");
    return response.data;
  },

  /** Disconnect doctor's Zoom account */
  disconnect: async (): Promise<any> => {
    const response = await api.post("/settings/zoom-telemed/disconnect");
    return response.data;
  },

  /** Toggle doctor's Zoom integration status */
  toggle: async (enabled: boolean): Promise<any> => {
    const response = await api.post("/settings/zoom-telemed/toggle", { enabled });
    return response.data;
  },
};
