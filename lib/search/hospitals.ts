import type { SearchQuery, HospitalResult, SearchProvider } from "./providers";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_HOSPITALS: HospitalResult[] = [
  {
    id: "h1",
    name: "Городская клиническая больница №1",
    type: "public",
    specialties: ["cardiology", "neurology", "general"],
    city: "Москва",
    country: "Россия",
    address: "ул. Ленина, 10",
    phone: "+7 495 123-45-67",
    website: "https://gcb1.ru",
    mapUrl: "https://maps.google.com/?q=Городская+клиническая+больница+Москва",
  },
  {
    id: "h2",
    name: "Медицинский центр «Медси»",
    type: "private",
    specialties: ["cardiology", "gastroenterology", "pulmonology", "general"],
    city: "Москва",
    country: "Россия",
    address: "Пресненская набережная, 2",
    phone: "+7 495 780-40-40",
    website: "https://medsi.ru",
    mapUrl: "https://maps.google.com/?q=Medsi+Москва",
    rating: 4.6,
  },
  {
    id: "h3",
    name: "Charité – Universitätsmedizin",
    type: "public",
    specialties: ["cardiology", "neurology", "gastroenterology", "general"],
    city: "Berlin",
    country: "Germany",
    address: "Charitéplatz 1, 10117 Berlin",
    phone: "+49 30 450 50",
    website: "https://charite.de",
    mapUrl: "https://maps.google.com/?q=Charite+Berlin",
    rating: 4.8,
  },
  {
    id: "h4",
    name: "Vivantes Klinikum",
    type: "public",
    specialties: ["general", "cardiology", "pulmonology"],
    city: "Berlin",
    country: "Germany",
    address: "Fanningerstraße 32, 10365 Berlin",
    phone: "+49 30 130 20",
    website: "https://vivantes.de",
    mapUrl: "https://maps.google.com/?q=Vivantes+Berlin",
    rating: 4.3,
  },
  {
    id: "h5",
    name: "City Medical Center",
    type: "private",
    specialties: ["general", "cardiology", "dermatology"],
    city: "New York",
    country: "USA",
    address: "500 E 77th St, New York, NY",
    phone: "+1 212 746 5454",
    website: "https://weillcornell.org",
    mapUrl: "https://maps.google.com/?q=City+Medical+Center+New+York",
    rating: 4.5,
  },
  {
    id: "h6",
    name: "Республиканская клиническая больница",
    type: "public",
    specialties: ["general", "neurology", "cardiology"],
    city: "Ташкент",
    country: "Узбекистан",
    address: "ул. Фурката, 3",
    phone: "+998 71 244-18-00",
    mapUrl: "https://maps.google.com/?q=Республиканская+клиническая+больница+Ташкент",
  },
];

// ─── Mock provider ────────────────────────────────────────────────────────────
export const hospitalProvider: SearchProvider = {
  name: "MockHospitalProvider",

  async searchHospitals(query: SearchQuery): Promise<HospitalResult[]> {
    let results = [...MOCK_HOSPITALS];

    if (query.city) {
      const city = query.city.toLowerCase();
      results = results.filter(
        (h) =>
          h.city.toLowerCase().includes(city) ||
          h.country.toLowerCase().includes(city)
      );
    }

    if (query.country) {
      const country = query.country.toLowerCase();
      results = results.filter((h) =>
        h.country.toLowerCase().includes(country)
      );
    }

    if (query.specialty) {
      const spec = query.specialty.toLowerCase();
      const specMap: Record<string, string[]> = {
        cardiology: ["cardiology"],
        neurology: ["neurology"],
        gastroenterology: ["gastroenterology"],
        pulmonology: ["pulmonology"],
        dermatology: ["dermatology"],
        general: ["general"],
        therapist: ["general"],
      };
      const aliases = Object.entries(specMap).find(([k]) =>
        spec.includes(k)
      )?.[1] ?? [spec];
      results = results.filter((h) =>
        h.specialties.some((s) => aliases.some((a) => s.includes(a)))
      );
    }

    if (query.preferPrivate !== undefined) {
      const preferred = results.filter((h) =>
        query.preferPrivate ? h.type === "private" : h.type === "public"
      );
      if (preferred.length > 0) results = preferred;
    }

    return results.slice(0, 3);
  },

  async searchDoctors() {
    return [];
  },
};
