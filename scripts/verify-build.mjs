import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
const expectedRoutes = [
  "index.html",
  "404.html",
  "case-studies/aws-enterprise-iot-platform/index.html",
  "case-studies/terraform-multi-environment-infrastructure/index.html",
  "case-studies/secure-cicd-automation/index.html",
  "case-studies/observability-incident-response/index.html",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const route of expectedRoutes) assert(existsSync(join(dist, route)), `Missing generated route: ${route}`);
assert(statSync(join(dist, "Jawad_Abbasi_Resume.pdf")).size > 50_000, "Résumé PDF is missing or unexpectedly small");
assert(statSync(join(dist, "assets/textures/earth_land_mask_2048.webp")).size > 50_000, "Geographic land mask is missing or unexpectedly small");
assert(!readFileSync(join(dist, "script.js"), "utf8").includes("aws_region_embedded"), "Legacy embedded-region artifact texture is still referenced");

const home = readFileSync(join(dist, "index.html"), "utf8");
for (const required of [
  "Jawad Abbasi | Senior DevOps Engineer",
  "/Jawad_Abbasi_Resume.pdf",
  "/case-studies/aws-enterprise-iot-platform",
  '"@type":"ProfilePage"',
  'rel="canonical" href="https://jawadabbasi.com"',
]) assert(home.includes(required), `Homepage is missing: ${required}`);

for (const route of expectedRoutes.filter((route) => route.startsWith("case-studies/"))) {
  const html = readFileSync(join(dist, route), "utf8");
  assert(html.includes('"@type":"TechArticle"'), `${route} is missing TechArticle JSON-LD`);
  assert(html.includes('property="og:type" content="article"'), `${route} is missing article Open Graph metadata`);
  assert(html.includes('href="/Jawad_Abbasi_Resume.pdf"'), `${route} is missing the résumé CTA`);
}

const notFound = readFileSync(join(dist, "404.html"), "utf8");
assert(notFound.includes('content="noindex, nofollow"'), "404 page must remain noindex");

const sitemap = readFileSync(join(dist, "sitemap-0.xml"), "utf8");
assert(!sitemap.includes("/404"), "404 page must not appear in the sitemap");
for (const route of expectedRoutes.filter((route) => route.startsWith("case-studies/"))) {
  const url = `https://jawadabbasi.com/${route.replace(/index\.html$/, "")}`;
  assert(sitemap.includes(url), `Sitemap is missing: ${url}`);
}

const robots = readFileSync(join(dist, "robots.txt"), "utf8");
assert(robots.includes("https://jawadabbasi.com/sitemap-index.xml"), "robots.txt is missing the production sitemap");

console.log(`Verified ${expectedRoutes.length} routes, metadata, résumé, globe assets, sitemap, robots policy, and 404 indexing.`);
