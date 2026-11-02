"use strict";

const express = require("express");
const router = express.Router();

const REQUEST_TIMEOUT_MS = 7000;
const SEARCH_BURST_LIMIT = 20;
const SEARCH_WINDOW_MS = 60_000;
const YOUTUBE_DAILY_SAFETY_LIMIT = 80;

let searchWindowStart = Date.now();
let searchWindowCount = 0;
let youtubeDayKey = pacificDayKey();
let youtubeSearchCount = 0;

function jsonNoStore(res, body, status = 200) {
  return res
    .status(status)
    .set("Cache-Control", "no-store")
    .set("X-Content-Type-Options", "nosniff")
    .type("application/json")
    .send(JSON.stringify(body));
}

function pacificDayKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function allowSearchBurst(req, res, next) {
  const now = Date.now();
  if (now - searchWindowStart >= SEARCH_WINDOW_MS) {
    searchWindowStart = now;
    searchWindowCount = 0;
  }
  if (searchWindowCount >= SEARCH_BURST_LIMIT) {
    const retryAfter = Math.max(1, Math.ceil((SEARCH_WINDOW_MS - (now - searchWindowStart)) / 1000));
    res.set("Retry-After", String(retryAfter));
    return jsonNoStore(res, {
      error: { code: "rate_limited", message: "Too many music searches. Please try again shortly." },
    }, 429);
  }
  searchWindowCount += 1;
  return next();
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`upstream_http_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function httpsUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function pacificYoutubeBudgetAvailable() {
  const today = pacificDayKey();
  if (today !== youtubeDayKey) {
    youtubeDayKey = today;
    youtubeSearchCount = 0;
  }
  if (youtubeSearchCount >= YOUTUBE_DAILY_SAFETY_LIMIT) return false;
  youtubeSearchCount += 1;
  return true;
}

function jamendoApiUseAllowed() {
  if (process.env.JAMENDO_API_TERMS_ACCEPTED !== "true") return false;
  const useCase = process.env.ZYNOXIFY_USE_CASE;
  if (useCase === "noncommercial") return true;
  return useCase === "commercial_licensed" &&
    process.env.JAMENDO_COMMERCIAL_API_APPROVED === "true";
}

function approvedJamendoTrackIds() {
  return new Set((process.env.JAMENDO_APPROVED_TRACK_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^\d+$/.test(id)));
}

async function searchJamendo(query) {
  const enabled = process.env.JAMENDO_ENABLED === "true";
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!enabled) {
    return {
      provider: "jamendo", status: "disabled", items: [],
      message: "Jamendo is disabled until its API-use terms and intended track licences are confirmed.",
    };
  }
  if (!jamendoApiUseAllowed()) {
    return {
      provider: "jamendo", status: "disabled", items: [],
      message: "Jamendo requires accepted API terms and an explicitly permitted use case.",
    };
  }
  if (!clientId) {
    return { provider: "jamendo", status: "not_configured", items: [], message: "JAMENDO_CLIENT_ID is not configured." };
  }

  const url = new URL("https://api.jamendo.com/v3.0/tracks/");
  url.search = new URLSearchParams({
    client_id: clientId,
    format: "json",
    limit: "12",
    search: query,
    type: "single albumtrack",
    include: "licenses",
    audioformat: "mp32",
    imagesize: "300",
  }).toString();

  const payload = await fetchJson(url);
  if (!payload || !Array.isArray(payload.results)) throw new Error("invalid_jamendo_response");

  const streamDeliveryEnabled =
    process.env.JAMENDO_STREAMS_ENABLED === "true" && jamendoApiUseAllowed();
  const approvedTrackIds = approvedJamendoTrackIds();
  const items = payload.results.flatMap((track) => {
    const id = track && track.id != null ? String(track.id) : "";
    const title = typeof track?.name === "string" ? track.name : "";
    const artist = typeof track?.artist_name === "string" ? track.artist_name : "";
    if (!id || !title || !artist) return [];

    const candidateStream = httpsUrl(track.audio);
    const trackLicenseReviewed = approvedTrackIds.has(id);
    const streamUrl =
      streamDeliveryEnabled && trackLicenseReviewed ? candidateStream : null;
    const externalUrl = httpsUrl(track.shorturl) || `https://www.jamendo.com/track/${encodeURIComponent(id)}`;

    return [{
      provider: "jamendo",
      providerTrackId: id,
      title,
      artist,
      artworkUrl: httpsUrl(track.image),
      durationSeconds: Number.isFinite(Number(track.duration)) ? Number(track.duration) : null,
      externalUrl,
      playbackType: streamUrl ? "direct-stream" : "external-link",
      streamUrl,
      embedUrl: null,
      licenseUrl: httpsUrl(track.license_ccurl),
      downloadAllowed: typeof track.audiodownload_allowed === "boolean" ? track.audiodownload_allowed : null,
      providerAttribution: "Jamendo",
      trackLicenseReviewed,
      commercialRightsVerified: false,
    }];
  });
  return { provider: "jamendo", status: "ok", items };
}

async function searchYouTube(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { provider: "youtube", status: "not_configured", items: [], message: "YOUTUBE_API_KEY is not configured." };
  }
  if (!pacificYoutubeBudgetAvailable()) {
    return {
      provider: "youtube", status: "error", items: [],
      message: "The local daily YouTube search safety limit has been reached.",
    };
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.search = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q: query,
    type: "video",
    videoCategoryId: "10",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    maxResults: "12",
    regionCode: "IN",
    relevanceLanguage: "en",
  }).toString();

  const payload = await fetchJson(url);
  if (!payload || !Array.isArray(payload.items)) throw new Error("invalid_youtube_response");

  const items = payload.items.flatMap((video) => {
    const id = typeof video?.id?.videoId === "string" ? video.id.videoId : "";
    const title = typeof video?.snippet?.title === "string" ? video.snippet.title : "";
    const artist = typeof video?.snippet?.channelTitle === "string" ? video.snippet.channelTitle : "";
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !title || !artist) return [];

    const thumbnails = video.snippet?.thumbnails || {};
    const artworkUrl = httpsUrl(thumbnails.high?.url) || httpsUrl(thumbnails.medium?.url) || httpsUrl(thumbnails.default?.url);
    return [{
      provider: "youtube",
      providerTrackId: id,
      title,
      artist,
      artworkUrl,
      durationSeconds: null,
      externalUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
      playbackType: "youtube-embed",
      streamUrl: null,
      embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(id)}`,
      licenseUrl: null,
      downloadAllowed: false,
      providerAttribution: "YouTube",
      commercialRightsVerified: false,
    }];
  });
  return { provider: "youtube", status: "ok", items };
}

router.get("/health", (req, res) => jsonNoStore(res, {
  status: "ok",
  providers: {
    jamendo: {
      configured: Boolean(process.env.JAMENDO_CLIENT_ID),
      enabled: process.env.JAMENDO_ENABLED === "true",
      streamDeliveryEnabled: process.env.JAMENDO_STREAMS_ENABLED === "true",
    },
    youtube: { configured: Boolean(process.env.YOUTUBE_API_KEY), role: "search results for official embedded playback" },
  },
  features: { database: false, accounts: false, playlists: false, player: false },
}));

router.get("/search", allowSearchBurst, async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim().replace(/\s+/g, " ") : "";
  const requestedProvider = typeof req.query.provider === "string" ? req.query.provider : "all";
  const providerAliases = {
    all: "all", independent: "jamendo", jamendo: "jamendo",
    mainstream: "youtube", youtube: "youtube",
  };
  const provider = providerAliases[requestedProvider];

  if (!provider) {
    return jsonNoStore(res, {
      error: { code: "invalid_provider", message: "provider must be all, independent, or mainstream." },
    }, 400);
  }
  if (query.length < 2 || query.length > 100) {
    return jsonNoStore(res, {
      error: { code: "invalid_query", message: "q must contain between 2 and 100 characters." },
    }, 400);
  }

  const tasks = [];
  if (provider === "all" || provider === "jamendo") {
    tasks.push(searchJamendo(query).catch(() => ({ provider: "jamendo", status: "error", items: [], message: "Jamendo search failed." })));
  }
  if (provider === "all" || provider === "youtube") {
    tasks.push(searchYouTube(query).catch(() => ({ provider: "youtube", status: "error", items: [], message: "YouTube search failed." })));
  }

  const results = await Promise.all(tasks);
  const items = results.flatMap((result) => result.items);
  const anyWorking = results.some((result) => result.status === "ok");
  const allUnavailable = results.every((result) => ["disabled", "not_configured"].includes(result.status));
  const status = anyWorking ? 200 : allUnavailable ? 503 : 502;

  return jsonNoStore(res, {
    query,
    items,
    providers: results.map(({ provider: name, status: providerStatus, items: providerItems, message }) => ({
      provider: name, status: providerStatus, count: providerItems.length,
      ...(message ? { message } : {}),
    })),
    notice: "Provider links, playback and artwork remain subject to provider terms and track-specific licences. Commercial rights are not verified by this endpoint.",
  }, status);
});

module.exports = router;
