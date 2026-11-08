import { readFileSync } from "node:fs";
import { score, parseVector, formatVector, severityOf, METRICS, METRIC_ORDER } from "../src/pwss.mjs";

const data = JSON.parse(readFileSync(new URL("./test-vectors.json", import.meta.url)));
let failed = 0;
const check = (ok, msg) => { if (!ok) { failed++; console.log("FAIL:", msg); } };

for (const c of data.cases) {
  const r = score(c.vector);
  check(r.score === c.score && r.severity === c.severity, `${c.name}: got ${r.score} ${r.severity}, expected ${c.score} ${c.severity}`);
  check(formatVector(parseVector(c.vector)) === c.vector, `${c.name}: vector round trip`);
}
for (const v of data.invalid) {
  let threw = false;
  try { score(v); } catch { threw = true; }
  check(threw, `invalid vector accepted: "${v}"`);
}

// Exhaustive invariants over all 4*4*3*3*4*3*3*3*3*3 = 139968 vectors.
const keys = METRIC_ORDER;
const total = keys.reduce((n, k) => n * METRICS[k].values.length, 1);
let count = 0, critical = 0, none = 0;
const dist = {};
for (let i = 0; i < total; i++) {
  let n = i; const m = {};
  for (const k of keys) { const vs = METRICS[k].values; m[k] = vs[n % vs.length]; n = Math.floor(n / vs.length); }
  const r = score(m);
  count++;
  dist[r.severity] = (dist[r.severity] || 0) + 1;
  check(severityOf(r.score) === r.severity, `band mismatch ${r.vector}`);
  if (r.severity === "Critical") {
    critical++;
    check(m.AS === "V" || m.SF === "D", `Critical without AS:V or SF:D: ${r.vector}`);
    check(r.likelihood.level === "Moderate" || r.likelihood.level === "High", `Critical with low likelihood: ${r.vector}`);
  }
  if (m.DR === "S") check(r.likelihood.level !== "High", `DR:S reached High likelihood: ${r.vector}`);
  const noImpact = m.CF === "N" && m.IN === "N" && m.AV === "N" && m.SF === "N";
  check((r.severity === "None") === noImpact, `None iff no impact: ${r.vector}`);
  if (m.AS === "L" && m.SC === "C" && m.SF !== "D") check(r.score <= 4.5, `Low asset contained above Medium: ${r.vector}`);
}
console.log(`${count} vectors checked`, dist);
console.log(failed === 0 ? "ALL TESTS PASSED" : `${failed} FAILURES`);
process.exit(failed ? 1 : 0);
