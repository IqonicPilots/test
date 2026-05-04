export type GoogleEventRole = 'patient' | 'doctor' | 'receptionist';

export interface GoogleEventTemplate {
  role: GoogleEventRole;
  title: string;
  description: string;
}

export interface GoogleMeetTemplate {
  title: string;
  description: string;
}

export interface GoogleAuthCredentials {
  clientId: string;
  clientSecret: string;
  appName?: string;
  redirectionUrl?: string;
  enable_configuration?: boolean;
  is_connected?: boolean;
}

export interface GoogleAuthUrlResponse {
  url: string;
}

export interface GoogleIntegrationsSettings {
  google?: GoogleAuthCredentials;
  google_event?: {
    isActive: boolean;
    templates: GoogleEventTemplate[];
  };
  google_meet?: {
    isActive: boolean;
    template: GoogleMeetTemplate;
  }
}
