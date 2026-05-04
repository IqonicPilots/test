export interface EncounterAppointmentService {
  _id: string;
  name?: string;
  serviceImage?: string;
}

export interface EncounterAppointment {
  _id: string;
  service?: EncounterAppointmentService | string;
  status?: { id?: string; label?: string };
}

export interface Encounter {
  _id: string;
  appointment?: EncounterAppointment | string | null;
  clinic?: {
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    _id: string;
    name: string;
    email?: string;
    mobile?: string;
    cliniclogo?: string;
    logo?: string;
  };
  doctor?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    email?: string;
    profilePicture?: string;
    avatar?: string;
    meta?: {
      profilePicture?: string;
      avatar?: string;
    };
    id?: string;
  };
  patient?: {
    _id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    profilePicture?: string;
    avatar?: string;
    id?: string;
  };
  encounterDate: string;
  problems?: any[];
  observations?: any[];
  encounter_status?: string;
  status?: string;
  isActive?: boolean;
  notes?: any[];
  prescriptions?: any[];
  reports?: any[];
  templateId?: string;
  bill_status?: 'NO_BILL_CREATED' | 'BILL_CREATED';
  bill?: any;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface EncounterReportPayload {
  name: string;
  date: string;
  file: string | File;
}

export interface EncounterListResponse {
  statusCode: number;
  data: Encounter[];
  message: string;
  success: boolean;
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  stats?: {
    total: number;
    active: number;
    closed: number;
    patients: number;
  };
}
