export type OrbState = "idle" | "listening" | "speaking" | "thinking" | "identifying" | "success" | "error";

export interface User { id: string; name: string; faceEmbedding?: number[]; preferredVoice: string }

export interface CalendarSource { id: string; type: "google" | "ical"; name: string; urlOrId: string; readOnly: true }
export interface EmailAccount { id: string; alias: string; email: string; imapHost: string }

export interface BriefingConfig {
  id: string;
  location: string;
  timezone: string;
  weatherEnabled: boolean;
  agendaSources: CalendarSource[];
  emailAccounts: EmailAccount[];
  newsTopics: string[];
  newsSources: string[];
  updateIntervalMinutes: number;
  spokenModules: ("agenda" | "emails" | "news" | "weather" | "insights")[];
  maxNewsInBriefing: 1 | 2 | 3 | 5;
  autoDigest: boolean;
}

export interface WeatherData { location: string; temp: number; min: number; max: number; humidity: number; windSpeed: number; rainChance: number; condition: string }
export interface CalendarEvent { id: string; title: string; start: string; end?: string }
export interface EmailSummary { id: string; from: string; subject: string; priority: "high" | "medium" | "low" | "noise"; snippet: string; receivedAt: string }
export interface NewsItem { id: string; title: string; source: string; url: string; publishedAt: string; category: string }

export interface Briefing {
  id: string;
  date: string;
  generatedAt: string;
  spokenText: string;
  weather: WeatherData;
  agendaStatus: "free" | "busy";
  nextEvents: CalendarEvent[];
  priorityEmails: EmailSummary[];
  news: NewsItem[];
  insights?: string[];
}

export interface Integration { id: string; name: string; status: "connected" | "error" | "needs_attention" | "disconnected"; lastSync?: string; icon: string }
export interface RoutineAction { type: string; payload?: Record<string, unknown> }
export interface Routine { id: string; name: string; triggers: string[]; actions: RoutineAction[]; enabled: boolean }
