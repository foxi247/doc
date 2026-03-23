import { AIResponse } from "./types";

export const MOCK_FALLBACK: AIResponse = {
  urgency: "medium",
  recommendedSpecialist: "General Practitioner",
  followUpQuestions: [
    "How long have you been experiencing these symptoms?",
    "Have the symptoms changed in intensity or frequency?",
    "Are you currently taking any medications?",
    "Do you have any relevant family medical history?",
  ],
  summary:
    "Based on the information provided, a consultation with a healthcare professional is recommended. Your doctor can conduct a thorough assessment and determine the appropriate next steps.",
  possibleConcern:
    "General area of concern — specific evaluation needed by a licensed clinician",
  disclaimer:
    "This is a simulated response and not a diagnosis or treatment recommendation. Please consult a licensed healthcare professional for any medical concerns.",
};

export function getMockResponse(symptoms?: string): AIResponse {
  // Provide slightly more contextual fallbacks based on keyword matching
  const lower = (symptoms || "").toLowerCase();

  if (lower.includes("chest") || lower.includes("heart") || lower.includes("palpitation")) {
    return {
      urgency: "high",
      recommendedSpecialist: "Cardiologist",
      followUpQuestions: [
        "When did the chest symptoms start?",
        "Do you experience shortness of breath?",
        "Is there any pain radiating to your arm or jaw?",
        "Do you have a history of heart conditions?",
      ],
      summary:
        "The described symptoms involve the cardiac region. A prompt evaluation by a cardiologist is suggested. Your doctor will be able to assess these concerns thoroughly.",
      possibleConcern:
        "Possible cardiac area of concern — requires evaluation by a licensed clinician",
      disclaimer:
        "This is a simulated response and not a diagnosis or treatment recommendation. If you are experiencing severe chest pain, contact emergency services immediately.",
    };
  }

  if (lower.includes("head") || lower.includes("migraine") || lower.includes("dizzy") || lower.includes("neuro")) {
    return {
      urgency: "medium",
      recommendedSpecialist: "Neurologist",
      followUpQuestions: [
        "How long have the headaches been occurring?",
        "Are there any visual disturbances accompanying the headache?",
        "Have you noticed any changes in coordination or speech?",
        "Are the symptoms improving or worsening over time?",
      ],
      summary:
        "Neurological symptoms described may benefit from specialist evaluation. A neurologist can perform a comprehensive assessment to identify any underlying concerns.",
      possibleConcern:
        "Possible neurological area of concern — to be evaluated by a licensed clinician",
      disclaimer:
        "This is a simulated response and not a diagnosis or treatment recommendation. Please consult a licensed healthcare professional.",
    };
  }

  return MOCK_FALLBACK;
}
