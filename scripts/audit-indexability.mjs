#!/usr/bin/env node

import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const siteOrigin = "https://www.haileyrepair.com";
const runLiveChecks = process.argv.includes("--live");
const projectRoot = resolve(import.meta.dirname, "..");

const priorityRoutes = [
  "/inside-the-repair",
  "/iphone-repair",
  "/computer-support",
  "/mail-in/iphone",
  "/privacy",
  "/repair-or-replace-phone",
  "/tips/backup-before-repair",
  "/tips/cold-weather-phone-battery",
  "/tips/data-safe-during-repair",
  "/tips/fake-support-scam-popups",
  "/tips/phone-charges-slowly",
  "/tips/iphone-liquid-detected-port-dry",
  "/tips/swollen-phone-battery-screen-lifting",
  "/tips/iphone-stuck-on-apple-logo",
  "/tips/face-id-not-working-after-drop",
  "/tips/iphone-battery-health-80-percent",
  "/tips/iphone-ghost-touch-cracked-screen",
  "/tips/iphone-charging-cable-loose-angle",
  "/tips/iphone-restarts-every-three-minutes",
  "/tips/iphone-camera-shaking-clicking-not-focusing",
  "/tips/iphone-green-white-line-screen",
  "/tips/iphone-speaker-muffled-after-water",
  "/tips/iphone-unknown-part-important-message",
];

const failures = [];
const passes = [];

function pass(message) {
  passes.push(message);
}

function fail(message) {
  failures.push(message);
}

function extract(html, pattern) {
  return html.match(pattern)?.[1]?.trim() ?? "";
}

function attribute(tag, name) {
  return extract(tag, new RegExp(`${name}=["']([^"']+)["']`, "i"));
}

function routeToFile(route) {
  return route === "/" ? "index.html" : `${route.slice(1)}.html`;
}

async function exists(file) {
  try {
    await access(file, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function auditHtml(html, route, label) {
  const expectedCanonical = `${siteOrigin}${route}`;
  const title = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const descriptionTag = html.match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0] ?? "";
  const description = attribute(descriptionTag, "content");
  const canonicalTag = html.match(/<link[^>]+rel=["']canonical["'][^>]*>|<link[^>]+href=["'][^"']+["'][^>]+rel=["']canonical["'][^>]*>/i)?.[0] ?? "";
  const canonical = attribute(canonicalTag, "href");
  const h1Count = [...html.matchAll(/<h1(?:\s|>)/gi)].length;
  const schemaBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1].trim());
  const blocksIndexing = /<meta[^>]+(?:name=["'](?:robots|googlebot)["'][^>]+content=["'][^"']*noindex|content=["'][^"']*noindex[^>]+name=["'](?:robots|googlebot)["'])/i.test(html);

  title ? pass(`${label}: title`) : fail(`${label}: missing title`);
  description ? pass(`${label}: meta description`) : fail(`${label}: missing meta description`);
  h1Count === 1 ? pass(`${label}: one H1`) : fail(`${label}: expected one H1, found ${h1Count}`);
  canonical === expectedCanonical
    ? pass(`${label}: self-canonical`)
    : fail(`${label}: canonical is "${canonical || "missing"}", expected "${expectedCanonical}"`);
  blocksIndexing
    ? fail(`${label}: contains a noindex directive`)
    : pass(`${label}: no noindex directive`);
  if (!schemaBlocks.length) {
    fail(`${label}: missing JSON-LD structured data`);
  } else {
    for (const [index, block] of schemaBlocks.entries()) {
      try {
        JSON.parse(block);
        pass(`${label}: JSON-LD block ${index + 1} is valid JSON`);
      } catch (error) {
        fail(`${label}: JSON-LD block ${index + 1} is invalid JSON (${error.message})`);
      }
    }
  }
}

const sitemapText = await readFile(resolve(projectRoot, "sitemap.xml"), "utf8");
const sitemapRoutes = [...sitemapText.matchAll(/<loc>(https:\/\/www\.haileyrepair\.com(?:\/[^<]*)?)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname.replace(/\/$/, "") || "/");
const uniqueSitemapRoutes = new Set(sitemapRoutes);

sitemapRoutes.length === uniqueSitemapRoutes.size
  ? pass("sitemap: no duplicate URLs")
  : fail("sitemap: duplicate URLs found");

for (const route of priorityRoutes) {
  uniqueSitemapRoutes.has(route)
    ? pass(`sitemap: contains ${route}`)
    : fail(`sitemap: missing ${route}`);

  const relativeFile = routeToFile(route);
  const absoluteFile = resolve(projectRoot, relativeFile);
  if (!(await exists(absoluteFile))) {
    fail(`${route}: missing local file ${relativeFile}`);
    continue;
  }

  const html = await readFile(absoluteFile, "utf8");
  auditHtml(html, route, `${route} local`);
}

for (const route of uniqueSitemapRoutes) {
  const relativeFile = routeToFile(route);
  (await exists(resolve(projectRoot, relativeFile)))
    ? pass(`sitemap target exists: ${relativeFile}`)
    : fail(`sitemap target missing: ${relativeFile}`);
}

const vercelIgnore = await readFile(resolve(projectRoot, ".vercelignore"), "utf8");
/^\*\.md$/m.test(vercelIgnore)
  ? pass("deployment: Markdown sources excluded")
  : fail("deployment: .vercelignore must exclude *.md");

if (runLiveChecks) {
  const googlebotHeaders = {
    "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  };

  const robotsResponse = await fetch(`${siteOrigin}/robots.txt`, { headers: googlebotHeaders });
  const robotsText = await robotsResponse.text();
  robotsResponse.ok ? pass("live robots.txt: 200") : fail(`live robots.txt: ${robotsResponse.status}`);
  /Sitemap:\s*https:\/\/www\.haileyrepair\.com\/sitemap\.xml/i.test(robotsText)
    ? pass("live robots.txt: sitemap declared")
    : fail("live robots.txt: sitemap declaration missing");
  /User-agent:\s*\*[\s\S]*?Allow:\s*\//i.test(robotsText)
    ? pass("live robots.txt: default crawler allowed")
    : fail("live robots.txt: default crawler allow rule missing");

  const liveSitemapResponse = await fetch(`${siteOrigin}/sitemap.xml`, { headers: googlebotHeaders });
  const liveSitemapText = await liveSitemapResponse.text();
  liveSitemapResponse.ok ? pass("live sitemap: 200") : fail(`live sitemap: ${liveSitemapResponse.status}`);
  liveSitemapResponse.headers.get("content-type")?.includes("xml")
    ? pass("live sitemap: XML content type")
    : fail(`live sitemap: unexpected content type ${liveSitemapResponse.headers.get("content-type")}`);

  for (const route of priorityRoutes) {
    const url = `${siteOrigin}${route}`;
    const response = await fetch(url, { headers: googlebotHeaders, redirect: "manual" });
    const html = await response.text();
    response.status === 200 ? pass(`${route} live: 200`) : fail(`${route} live: ${response.status}`);
    response.headers.get("content-type")?.includes("text/html")
      ? pass(`${route} live: HTML content type`)
      : fail(`${route} live: unexpected content type ${response.headers.get("content-type")}`);
    /noindex/i.test(response.headers.get("x-robots-tag") ?? "")
      ? fail(`${route} live: X-Robots-Tag contains noindex`)
      : pass(`${route} live: no blocking X-Robots-Tag`);
    liveSitemapText.includes(`<loc>${url}</loc>`)
      ? pass(`${route} live: in deployed sitemap`)
      : fail(`${route} live: missing from deployed sitemap`);
    auditHtml(html, route, `${route} live`);
  }
}

console.log(`Indexability audit: ${passes.length} checks passed, ${failures.length} failed.`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exitCode = 1;
} else {
  console.log("All audited routes are structurally indexable.");
}
