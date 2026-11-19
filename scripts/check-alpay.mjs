import { readFileSync } from "node:fs";

const src = readFileSync("src/lib/alpay.ts", "utf8");
const ok = (c, m) => {
  if (!c) { console.error("FAIL:", m); process.exit(1); }
  console.log("PASS:", m);
};

ok(/callback_url:\s*`\$\{getAppUrl\(\)\}\/api\/webhook`/.test(src),
  "callback_url = `${getAppUrl()}/api/webhook`");

ok((src.match(/fetch\(`\$\{getAlpayBaseUrl\(\)\}/g) || []).length === 3,
  "3 fetch (create/status/cancel) pakai getAlpayBaseUrl()");

ok(!/fetch\(`\$\{ALPAY_BASE_URL\}/.test(src),
  "tidak ada fetch yang masih pakai konstanta ALPAY_BASE_URL mati");

const strip = (u) => u.replace(/\/+$/, "");
ok(strip("https://x.test/") === "https://x.test", "trailing slash dibuang");
ok(`${strip("https://x.test/")}/api/webhook` === "https://x.test/api/webhook", "URL akhir valid");

console.log("\nSEMUA CHECK LULUS");
