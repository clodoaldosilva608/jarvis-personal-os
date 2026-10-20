/**
 * Briefing data types — matches the "Bom dia" flow spec.
 */

export interface BriefingWeather {
  location: string;
  temp: number;
  min: number;
  max: number;
  humidity: number;
  rainChance: number;
  windSpeed: number;
  condition: string;
  icon?: "sun" | "cloud-sun" | "cloud" | "rain" | "storm";
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  end?: string;
}

export interface BriefingAgenda {
  status: "free" | "busy";
  events: CalendarEvent[];
}

export interface BriefingEmail {
  id: string;
  from: string;
  subject: string;
  summary: string;
  priority: "high" | "medium";
  due?: string; // ISO date
}

export interface BriefingEmails {
  total: number;
  priorityCount: number;
  items: BriefingEmail[];
}

export interface BriefingNews {
  id: string;
  category: string; // "Tecnologia", "IA", "Política", ...
  title: string;
  source: string;
  summary: string;
  quote?: string;
}

export interface BriefingData {
  date: string; // ISO
  weather: BriefingWeather;
  agenda: BriefingAgenda;
  emails: BriefingEmails;
  news: BriefingNews[];
  healthObservations?: number;
  /** Narration split into segments — each segment triggers the next card. */
  narration: BriefingNarrationSegment[];
}

export interface BriefingNarrationSegment {
  /** Which card to reveal when this segment starts being spoken. */
  revealCard?: "panorama" | "weather" | "agenda" | "emails" | "news" | "health" | "closing";
  /** The text to speak for this segment. */
  text: string;
  /** Optional delay (ms) before revealing the card (after this segment starts). */
  revealDelayMs?: number;
}
