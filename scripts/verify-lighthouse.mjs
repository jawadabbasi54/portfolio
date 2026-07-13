import { readFileSync } from "node:fs";

const reportPath = process.argv[2];
if (!reportPath) throw new Error("Pass a Lighthouse JSON report path");
const report = JSON.parse(readFileSync(reportPath, "utf8"));
const minimums = { performance: 0.8, accessibility: 0.95, "best-practices": 0.9, seo: 0.95 };

for (const [category, minimum] of Object.entries(minimums)) {
  const score = report.categories[category]?.score;
  if (typeof score !== "number") throw new Error(`Missing Lighthouse category: ${category}`);
  console.log(`${category}: ${Math.round(score * 100)} (minimum ${Math.round(minimum * 100)})`);
  if (score < minimum) throw new Error(`${category} score ${score} is below ${minimum}`);
}
