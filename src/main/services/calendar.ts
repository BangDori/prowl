import type { CalendarEvent, CalendarSettings, LocalEvent } from "@shared/types";
import { DEFAULT_CALENDAR_SETTINGS, LOCAL_FEED_ID } from "@shared/types";
import { net } from "electron";
import Store from "electron-store";

interface CalendarStoreSchema {
  calendarSettings: CalendarSettings;
  localEvents: LocalEvent[];
}

const store = new Store<CalendarStoreSchema>({
  defaults: {
    calendarSettings: DEFAULT_CALENDAR_SETTINGS,
    localEvents: [],
  },
});

export function getCalendarSettings(): CalendarSettings {
  const raw = store.get("calendarSettings") ?? DEFAULT_CALENDAR_SETTINGS;
  // 이전 스키마(icsUrl 형태)에서 마이그레이션 방어
  if (!Array.isArray(raw.feeds)) {
    return DEFAULT_CALENDAR_SETTINGS;
  }
  return raw;
}

export function setCalendarSettings(settings: CalendarSettings): void {
  store.set("calendarSettings", settings);
}

// ── 로컬 이벤트 CRUD ──

export function getLocalEvents(): LocalEvent[] {
  return store.get("localEvents") ?? [];
}

export function addLocalEvent(event: LocalEvent): void {
  const events = getLocalEvents();
  events.push(event);
  store.set("localEvents", events);
}

export function updateLocalEvent(event: LocalEvent): void {
  const events = getLocalEvents().map((e) => (e.id === event.id ? event : e));
  store.set("localEvents", events);
}

export function deleteLocalEvent(eventId: string): void {
  const events = getLocalEvents().filter((e) => e.id !== eventId);
  store.set("localEvents", events);
}

/**
 * 로컬 이벤트를 CalendarEvent 형태로 변환
 */
function localToCalendarEvents(locals: LocalEvent[]): CalendarEvent[] {
  return locals.map((e) => ({
    uid: e.id,
    summary: e.summary,
    description: e.description,
    location: e.location,
    dtstart: new Date(e.dtstart),
    dtend: new Date(e.dtend),
    allDay: e.allDay,
    feedId: LOCAL_FEED_ID,
  }));
}

/**
 * 모든 피드 + 로컬 이벤트를 가져와 병합
 */
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const { feeds } = getCalendarSettings();

  // ICS 피드 이벤트
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const icsText = await fetchIcsText(feed.url);
      return parseIcs(icsText, feed.id);
    }),
  );

  const allEvents: CalendarEvent[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allEvents.push(...result.value);
    }
  }

  // UID+시작시간 기반 중복 제거 (반복 일정은 같은 UID를 공유하므로 시작시간도 함께 비교)
  const seen = new Set<string>();
  const unique = allEvents.filter((e) => {
    const key = `${e.uid}_${e.dtstart.getTime()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 로컬 이벤트 병합
  unique.push(...localToCalendarEvents(getLocalEvents()));

  unique.sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());
  return unique;
}

const ICS_FETCH_TIMEOUT_MS = 10000;
const ICS_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * ICS 텍스트를 HTTP로 가져오기
 */
function fetchIcsText(url: string): Promise<string> {
  // URL 유효성 검증 (http/https만 허용)
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return Promise.reject(new Error(`지원하지 않는 프로토콜: ${parsed.protocol}`));
  }

  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let body = "";
    let size = 0;

    const timer = setTimeout(() => {
      request.abort();
      reject(new Error("ICS 요청 타임아웃"));
    }, ICS_FETCH_TIMEOUT_MS);

    request.on("response", (response) => {
      if (response.statusCode !== 200) {
        clearTimeout(timer);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size > ICS_MAX_SIZE_BYTES) {
          clearTimeout(timer);
          request.abort();
          reject(new Error("ICS 파일이 너무 큽니다"));
          return;
        }
        body += chunk.toString();
      });
      response.on("end", () => {
        clearTimeout(timer);
        resolve(body);
      });
    });

    request.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    request.end();
  });
}

/**
 * ICS 텍스트를 CalendarEvent 배열로 파싱
 */
function parseIcs(icsText: string, feedId: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = unfoldLines(icsText);

  let inEvent = false;
  let current: Partial<CalendarEvent> = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      current = { feedId };
      continue;
    }

    if (line === "END:VEVENT") {
      inEvent = false;
      if (current.uid && current.summary && current.dtstart && current.dtend) {
        events.push(current as CalendarEvent);
      }
      continue;
    }

    if (!inEvent) continue;

    const { key, params, value } = parseLine(line);

    switch (key) {
      case "UID":
        current.uid = value;
        break;
      case "SUMMARY":
        current.summary = unescapeIcsText(value);
        break;
      case "DESCRIPTION":
        current.description = unescapeIcsText(value);
        break;
      case "LOCATION":
        current.location = unescapeIcsText(value);
        break;
      case "DTSTART": {
        const isDate = params.includes("VALUE=DATE");
        current.dtstart = parseIcsDate(value);
        current.allDay = isDate || value.length === 8;
        break;
      }
      case "DTEND": {
        current.dtend = parseIcsDate(value);
        break;
      }
    }
  }

  events.sort((a, b) => a.dtstart.getTime() - b.dtstart.getTime());
  return events;
}

/**
 * ICS의 접힌 줄 펼치기 (RFC 5545: 줄 시작의 공백/탭은 이전 줄의 연속)
 */
function unfoldLines(text: string): string[] {
  return text
    .replace(/\r\n[ \t]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");
}

/**
 * ICS 줄을 key, params, value로 파싱
 */
function parseLine(line: string): { key: string; params: string; value: string } {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return { key: line, params: "", value: "" };

  const beforeColon = line.substring(0, colonIdx);
  const value = line.substring(colonIdx + 1);

  const semiIdx = beforeColon.indexOf(";");
  if (semiIdx === -1) {
    return { key: beforeColon, params: "", value };
  }

  return {
    key: beforeColon.substring(0, semiIdx),
    params: beforeColon.substring(semiIdx + 1),
    value,
  };
}

/**
 * ICS 날짜 문자열을 Date로 변환
 * 형식: 20240101 (all-day) 또는 20240101T120000Z (datetime)
 */
function parseIcsDate(value: string): Date {
  // YYYYMMDD
  if (value.length === 8) {
    const y = Number.parseInt(value.substring(0, 4), 10);
    const m = Number.parseInt(value.substring(4, 6), 10) - 1;
    const d = Number.parseInt(value.substring(6, 8), 10);
    return new Date(y, m, d);
  }

  // YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const y = Number.parseInt(value.substring(0, 4), 10);
  const m = Number.parseInt(value.substring(4, 6), 10) - 1;
  const d = Number.parseInt(value.substring(6, 8), 10);
  const h = Number.parseInt(value.substring(9, 11), 10);
  const min = Number.parseInt(value.substring(11, 13), 10);
  const s = Number.parseInt(value.substring(13, 15), 10);

  if (value.endsWith("Z")) {
    return new Date(Date.UTC(y, m, d, h, min, s));
  }

  return new Date(y, m, d, h, min, s);
}

/**
 * ICS 텍스트 이스케이프 해제
 */
function unescapeIcsText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}
