import { api } from "@/lib/api/axios";
import { 
  GoogleEventTemplate, 
  GoogleMeetTemplate,
  GoogleAuthCredentials, 
  GoogleAuthUrlResponse,
  GoogleIntegrationsSettings 
} from "@/types/google-event.types";

export const googleEventApi = {
  getIntegrations: async (): Promise<any> => {
    const response = await api.get("/settings/integrations");
    return response.data;
  },

  getAuthUrl: async (credentials: GoogleAuthCredentials): Promise<GoogleAuthUrlResponse> => {
    const response = await api.post("/auth/google-url", credentials);
    return response.data?.data;
  },

  saveTemplates: async (templates: GoogleEventTemplate[]): Promise<any> => {
    const response = await api.post("/settings/google-event-template", { templates });
    return response.data;
  },

  saveMeetTemplate: async (template: GoogleMeetTemplate): Promise<any> => {
    const response = await api.post("/settings/google-meet-template", { template });
    return response.data;
  },

  saveGoogleConfig: async (config: GoogleAuthCredentials): Promise<any> => {
    // Shared credentials go to general integrations setting
    const response = await api.post("/settings", { name: 'integrations', data: { google: config } });
    return response.data;
  },

  disconnect: async (): Promise<any> => {
    const response = await api.post("/settings/google/disconnect");
    return response.data;
  }
};
