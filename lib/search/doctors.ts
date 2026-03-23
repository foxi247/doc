import type { SearchQuery, DoctorResult, SearchProvider } from "./providers";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_DOCTORS: DoctorResult[] = [
  {
    id: "d1",
    name: "Dr. Иван Петров",
    specialty: "Cardiologist",
    hospital: "Медицинский центр «Медси»",
    city: "Москва",
    country: "Россия",
    phone: "+7 495 780-40-41",
    languages: ["Russian", "English"],
    note: "Specializes in arrhythmia and hypertension",
  },
  {
    id: "d2",
    name: "Dr. Анна Смирнова",
    specialty: "Neurologist",
    hospital: "Городская клиническая больница №1",
    city: "Москва",
    country: "Россия",
    phone: "+7 495 123-45-68",
    languages: ["Russian"],
    note: "Headache and migraine specialist",
  },
  {
    id: "d3",
    name: "Dr. Klaus Weber",
    specialty: "Cardiologist",
    hospital: "Charité – Universitätsmedizin",
    city: "Berlin",
    country: "Germany",
    website: "https://charite.de/doctors/weber",
    languages: ["German", "English"],
    note: "Cardiac imaging and prevention",
  },
  {
    id: "d4",
    name: "Dr. Sarah Müller",
    specialty: "Gastroenterologist",
    hospital: "Vivantes Klinikum",
    city: "Berlin",
    country: "Germany",
    languages: ["German", "English", "Russian"],
    note: "Digestive disorders and endoscopy",
  },
  {
    id: "d5",
    name: "Dr. James Chen",
    specialty: "General Practitioner",
    hospital: "City Medical Center",
    city: "New York",
    country: "USA",
    phone: "+1 212 746 5455",
    website: "https://weillcornell.org/jchen",
    languages: ["English", "Mandarin"],
    note: "Comprehensive internal medicine",
  },
];

// ─── Mock provider ────────────────────────────────────────────────────────────
export const doctorProvider: SearchProvider = {
  name: "MockDoctorProvider",

  async searchHospitals() {
    return [];
  },

  async searchDoctors(query: SearchQuery): Promise<DoctorResult[]> {
    let results = [...MOCK_DOCTORS];

    if (query.city) {
      const city = query.city.toLowerCase();
      results = results.filter(
        (d) =>
          d.city.toLowerCase().includes(city) ||
          d.country.toLowerCase().includes(city)
      );
    }

    if (query.country) {
      const country = query.country.toLowerCase();
      results = results.filter((d) =>
        d.country.toLowerCase().includes(country)
      );
    }

    if (query.specialty) {
      const spec = query.specialty.toLowerCase();
      results = results.filter(
        (d) =>
          d.specialty.toLowerCase().includes(spec) ||
          spec.includes(d.specialty.toLowerCase().split(" ")[0])
      );
    }

    if (query.language) {
      const lang = query.language.toLowerCase();
      const preferred = results.filter((d) =>
        d.languages?.some((l) => l.toLowerCase().includes(lang))
      );
      if (preferred.length > 0) results = preferred;
    }

    return results.slice(0, 3);
  },
};
