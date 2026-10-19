import Dexie, { type Table } from "dexie";

/**
 * Local database (IndexedDB via Dexie) — privacy-first persistence.
 *
 * Stores all user data ON THE DEVICE — nothing leaves the browser:
 *   - conversations (chat history with Gemini)
 *   - briefings (generated morning briefings history)
 *   - routines, devices, integrations are already in localStorage (Zustand persist)
 *
 * For larger data (chat history with thousands of messages, briefing snapshots),
 * IndexedDB is the right choice — much higher quota than localStorage, async I/O.
 */

export interface Conversation {
  id?: number;
  createdAt: number;
  role: "user" | "model";
  text: string;
  /** Optional: stored as blob URL or base64 thumbnail for briefing prints */
  thumbnail?: string;
}

export interface BriefingRecord {
  id?: number;
  generatedAt: number;
  location: string;
  spokenText: string;
  weather?: { temp: number; condition: string; rainChance: number };
  newsCount: number;
}

export interface UserLocation {
  id?: number;
  capturedAt: number;
  lat: number;
  lng: number;
  /** Reverse-geocoded name, if available. */
  name?: string;
}

class JarvisDB extends Dexie {
  conversations!: Table<Conversation, number>;
  briefings!: Table<BriefingRecord, number>;
  locations!: Table<UserLocation, number>;

  constructor() {
    super("jarvis-os");
    this.version(1).stores({
      conversations: "++id, createdAt, role",
      briefings: "++id, generatedAt, location",
      locations: "++id, capturedAt",
    });
  }
}

export const db = new JarvisDB();

// === Conversations API ===

export async function saveMessage(msg: Omit<Conversation, "id">): Promise<void> {
  try {
    await db.conversations.add(msg);
    // Keep only last 500 messages to avoid unbounded growth.
    const count = await db.conversations.count();
    if (count > 500) {
      const oldest = await db.conversations.orderBy("createdAt").limit(count - 500).toArray();
      await Promise.all(oldest.map((m) => db.conversations.delete(m.id!)));
    }
  } catch (e) { console.error("DB saveMessage failed:", e); }
}

export async function loadMessages(): Promise<Conversation[]> {
  try {
    return await db.conversations.orderBy("createdAt").toArray();
  } catch {
    return [];
  }
}

export async function clearMessages(): Promise<void> {
  try { await db.conversations.clear(); } catch { /* noop */ }
}

// === Briefings API ===

export async function saveBriefing(b: Omit<BriefingRecord, "id">): Promise<void> {
  try { await db.briefings.add(b); } catch { /* noop */ }
}

export async function loadBriefings(): Promise<BriefingRecord[]> {
  try { return await db.briefings.orderBy("generatedAt").reverse().toArray(); } catch { return []; }
}

// === Locations API ===

export async function saveLocation(loc: Omit<UserLocation, "id">): Promise<void> {
  try { await db.locations.add(loc); } catch { /* noop */ }
}

export async function getLastLocation(): Promise<UserLocation | null> {
  try {
    const all = await db.locations.orderBy("capturedAt").reverse().toArray();
    return all[0] ?? null;
  } catch { return null; }
}
