// Search provider abstraction layer.
// Replace MockProvider with a real data source (Google Places, custom DB, etc.)

export interface HospitalResult {
  id: string;
  name: string;
  type: "public" | "private" | "clinic";
  specialties: string[];
  city: string;
  country: string;
  address?: string;
  phone?: string;
  website?: string;
  mapUrl?: string;
  rating?: number;
}

export interface DoctorResult {
  id: string;
  name: string;
  specialty: string;
  hospital?: string;
  city: string;
  country: string;
  phone?: string;
  website?: string;
  photoUrl?: string;
  languages?: string[];
  note?: string;
}

export interface SearchQuery {
  specialty?: string;
  city?: string;
  country?: string;
  preferPrivate?: boolean;
  language?: string;
}

export interface SearchProvider {
  name: string;
  searchHospitals(query: SearchQuery): Promise<HospitalResult[]>;
  searchDoctors(query: SearchQuery): Promise<DoctorResult[]>;
}
