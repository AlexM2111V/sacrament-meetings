import type { Hymn, MeetingType, SacramentMeeting, SpeakerItem, WardBusinessItem } from "./types";

// Runtime checks for meeting data from outside TypeScript's control (database rows, API responses).

type UnknownRecord = Record<string, unknown>;
const MEETING_TYPES: readonly MeetingType[] = ["testimony", "regular", "stake", "general"];

const isRecord = (v: unknown): v is UnknownRecord => typeof v === "object" && v !== null;
const isString = (v: unknown): v is string => typeof v === "string";

const isHymn = (v: unknown): v is Hymn =>
  isRecord(v) && typeof v.number === "number" && isString(v.title);

const isSpeakerItem = (v: unknown): v is SpeakerItem =>
  isRecord(v) &&
  isString(v.name) &&
  isString(v.topic) &&
  (v.type === "speaker" || v.type === "musical-number");

const isWardBusinessItem = (v: unknown): v is WardBusinessItem =>
  isRecord(v) && isString(v.description);

export function isSacramentMeeting(v: unknown): v is SacramentMeeting {
  return (
    isRecord(v) &&
    Number.isInteger(v.id) &&
    isString(v.date) &&
    MEETING_TYPES.includes(v.meetingType as MeetingType) &&
    isString(v.presiding) &&
    isString(v.conducting) &&
    (v.announcements === undefined ||
      (Array.isArray(v.announcements) && v.announcements.every(isString))) &&
    isHymn(v.openingHymn) &&
    isString(v.openingPrayer) &&
    Array.isArray(v.wardBusiness) &&
    v.wardBusiness.every(isWardBusinessItem) &&
    typeof v.stakeBusiness === "boolean" &&
    (v.stakeBusinessItems === undefined ||
      (Array.isArray(v.stakeBusinessItems) && v.stakeBusinessItems.every(isWardBusinessItem))) &&
    isHymn(v.sacramentHymn) &&
    Array.isArray(v.speakers) &&
    v.speakers.every(isSpeakerItem) &&
    isHymn(v.closingHymn) &&
    isString(v.closingPrayer)
  );
}
