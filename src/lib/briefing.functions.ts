import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  location: z.string().min(1).max(100),
  timezone: z.string().max(60),
  agendaUrls: z.array(z.string().url().max(500)).max(10),
  newsTopics: z.array(z.string().max(60)).max(10),
  maxNews: z.number().int().min(1).max(5),
});

export interface BriefingWeather { location: string; temp: number; min: number; max: number; humidity: number; windSpeed: number; rainChance: number; condition: string }
export interface BriefingEvent { title: string; start: string }
export interface BriefingNews { title: string; source: string; url: string; topic: string }
export interface BriefingResult {
  generatedAt: string;
  weather: BriefingWeather | null;
  weatherError?: string;
  events: BriefingEvent[];
  agendaError?: string;
  news: BriefingNews[];
}

const WMO: Record<number, string> = {
  0: "Céu limpo", 1: "Predominantemente limpo", 2: "Parcialmente nublado", 3: "Nublado", 45: "Neblina", 48: "Neblina",
  51: "Garoa fraca", 53: "Garoa", 55: "Garoa forte", 61: "Chuva fraca", 63: "Chuva", 65: "Chuva forte",
  80: "Pancadas de chuva", 81: "Pancadas de chuva", 82: "Temporal", 95: "Trovoadas", 96: "Trovoadas", 99: "Trovoadas",
};

async function getWeather(location: string, timezone: string): Promise<BriefingWeather> {
  const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=pt`).then((r) => r.json());
  const place = geo?.results?.[0];
  if (!place) throw new Error(`Localização "${location}" não encontrada`);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=1&timezone=${encodeURIComponent(timezone || "auto")}`;
  const w = await fetch(url).then((r) => r.json());
  return {
    location: `${place.name}${place.admin1 ? `, ${place.admin1}` : ""}`,
    temp: Math.round(w.current.temperature_2m),
    min: Math.round(w.daily.temperature_2m_min[0]),
    max: Math.round(w.daily.temperature_2m_max[0]),
    humidity: w.current.relative_humidity_2m,
    windSpeed: Math.round(w.current.wind_speed_10m),
    rainChance: w.daily.precipitation_probability_max[0] ?? 0,
    condition: WMO[w.current.weather_code as number] ?? "—",
  };
}

function parseIcsDate(v: string): Date | null {
  const m = v.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
  if (!m) return null;
  const [, y, mo, d, h = "00", mi = "00", s = "00", z] = m;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${z ? "Z" : ""}`;
  const dt = new Date(iso);
  return isNaN(dt.getTime()) ? null : dt;
}

async function getEvents(urls: string[]): Promise<BriefingEvent[]> {
  const now = Date.now();
  const horizon = now + 7 * 86400000;
  const all: { title: string; date: Date }[] = [];
  for (const raw of urls) {
    const url = raw.replace(/^webcal:/, "https:");
    const text = await fetch(url).then((r) => { if (!r.ok) throw new Error(`Agenda indisponível (${r.status})`); return r.text(); });
    const unfolded = text.replace(/\r?\n[ \t]/g, "");
    for (const block of unfolded.split("BEGIN:VEVENT").slice(1)) {
      const summary = block.match(/\nSUMMARY[^:]*:(.*)/)?.[1]?.trim() ?? "Evento";
      const start = block.match(/\nDTSTART[^:]*:(.*)/)?.[1]?.trim();
      const date = start ? parseIcsDate(start) : null;
      if (date && date.getTime() >= now - 3600000 && date.getTime() <= horizon) all.push({ title: summary.replace(/\\,/g, ","), date });
    }
  }
  return all.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 8).map((e) => ({ title: e.title, start: e.date.toISOString() }));
}

async function getNews(topics: string[], max: number): Promise<BriefingNews[]> {
  const out: BriefingNews[] = [];
  for (const topic of topics.slice(0, 5)) {
    try {
      const xml = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`).then((r) => r.text());
      const items = xml.split("<item>").slice(1, 1 + max);
      for (const it of items) {
        const title = it.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] ?? "";
        const link = it.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
        const source = it.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? "";
        if (title) out.push({ title: title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'"), url: link, source, topic });
      }
    } catch { /* ignore one topic failing */ }
  }
  return out.slice(0, max);
}

export const generateBriefing = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<BriefingResult> => {
    const [w, e, n] = await Promise.allSettled([
      getWeather(data.location, data.timezone),
      data.agendaUrls.length ? getEvents(data.agendaUrls) : Promise.resolve([]),
      getNews(data.newsTopics, data.maxNews),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      weather: w.status === "fulfilled" ? w.value : null,
      weatherError: w.status === "rejected" ? String((w.reason as Error)?.message ?? w.reason) : undefined,
      events: e.status === "fulfilled" ? e.value : [],
      agendaError: e.status === "rejected" ? String((e.reason as Error)?.message ?? e.reason) : undefined,
      news: n.status === "fulfilled" ? n.value : [],
    };
  });
