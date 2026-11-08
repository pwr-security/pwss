// PWSS 1.0 reference implementation (Physical Weakness Scoring System).
// Pure functions, no dependencies. Works in Node and in the browser.

export const VERSION = "1.0";
export const PREFIX = `PWSS:${VERSION}`;

// Metric order is fixed. A valid vector contains every metric, in this order.
export const METRIC_ORDER = ["AR", "EF", "OP", "DR", "AS", "CF", "IN", "AV", "SF", "SC"];

export const METRICS = {
  AR: { name: "Authorization Required", values: ["N", "V", "S", "P"] },
  EF: { name: "Effort and Means", values: ["T", "L", "M", "H"] },
  OP: { name: "Opportunity", values: ["A", "C", "R"] },
  DR: { name: "Detection and Response", values: ["S", "L", "U"] },
  AS: { name: "Asset Criticality", values: ["L", "M", "H", "V"] },
  CF: { name: "Confidentiality Impact", values: ["N", "L", "S"] },
  IN: { name: "Integrity Impact", values: ["N", "L", "S"] },
  AV: { name: "Availability Impact", values: ["N", "L", "S"] },
  SF: { name: "Safety of Persons", values: ["N", "I", "D"] },
  SC: { name: "Scope", values: ["C", "A", "W"] },
};

// Step 1. Likelihood points (higher = easier to exploit and less likely to be stopped).
const LIKELIHOOD_POINTS = {
  AR: { N: 3, V: 2, S: 1, P: 0 },
  EF: { T: 3, L: 2, M: 1, H: 0 },
  OP: { A: 2, C: 1, R: 0 },
  DR: { U: 3, L: 2, S: 0 },
};

// Total points (0..11) to likelihood level (0 = Very Low .. 3 = High).
const LIKELIHOOD_LEVELS = ["Very Low", "Low", "Moderate", "High"];
function likelihoodLevel(points) {
  if (points <= 2) return 0;
  if (points <= 5) return 1;
  if (points <= 8) return 2;
  return 3;
}

// Step 2. Impact. Asset impact table: rows = harm 0..3, columns = AS L, M, H, V.
// Result: 0 None, 1 Low, 2 Moderate, 3 High, 4 Critical.
const ASSET_IMPACT = [
  /* harm 0 */ { L: 0, M: 0, H: 0, V: 0 },
  /* harm 1 */ { L: 1, M: 1, H: 2, V: 2 },
  /* harm 2 */ { L: 1, M: 2, H: 3, V: 4 },
  /* harm 3 */ { L: 2, M: 3, H: 3, V: 4 },
];
const HARM_POINTS = { N: 0, L: 1, S: 2 };
const SAFETY_IMPACT = { N: 0, I: 2, D: 4 };
const SCOPE_BONUS = { C: 0, A: 1, W: 2 };
export const IMPACT_LEVELS = ["None", "Low", "Moderate", "High", "Critical"];

// Step 3. Score table: rows = likelihood 0..3, columns = impact 1..4.
const SCORE_TABLE = [
  /* Very Low */ [0.5, 1.0, 1.5, 3.0],
  /* Low      */ [1.0, 2.0, 4.0, 6.5],
  /* Moderate */ [1.5, 3.5, 6.5, 8.5],
  /* High     */ [2.0, 4.5, 7.5, 10.0],
];

// Severity bands on the score.
export function severityOf(score) {
  if (score === 0) return "None";
  if (score < 3.0) return "Low";
  if (score < 6.0) return "Medium";
  if (score < 8.5) return "High";
  return "Critical";
}

export function parseVector(vector) {
  if (typeof vector !== "string") throw new Error("Vector must be a string");
  const parts = vector.trim().split("/");
  if (parts[0] !== PREFIX) throw new Error(`Vector must start with ${PREFIX}`);
  const items = parts.slice(1);
  if (items.length !== METRIC_ORDER.length) {
    throw new Error(`Vector must contain exactly ${METRIC_ORDER.length} metrics`);
  }
  const metrics = {};
  items.forEach((item, i) => {
    const [key, value, extra] = item.split(":");
    const expected = METRIC_ORDER[i];
    if (extra !== undefined || key !== expected) {
      throw new Error(`Metric ${i + 1} must be ${expected}`);
    }
    if (!METRICS[key].values.includes(value)) {
      throw new Error(`Invalid value "${value}" for ${key}`);
    }
    metrics[key] = value;
  });
  return metrics;
}

export function formatVector(metrics) {
  const items = METRIC_ORDER.map((key) => {
    const value = metrics[key];
    if (!METRICS[key].values.includes(value)) {
      throw new Error(`Missing or invalid value for ${key}`);
    }
    return `${key}:${value}`;
  });
  return `${PREFIX}/${items.join("/")}`;
}

export function score(input) {
  const metrics = typeof input === "string" ? parseVector(input) : input;
  const vector = formatVector(metrics);

  // Likelihood
  const points = Object.keys(LIKELIHOOD_POINTS).reduce(
    (sum, key) => sum + LIKELIHOOD_POINTS[key][metrics[key]],
    0
  );
  const lik = likelihoodLevel(points);

  // Impact
  const worst = Math.max(HARM_POINTS[metrics.CF], HARM_POINTS[metrics.IN], HARM_POINTS[metrics.AV]);
  const severeCount = [metrics.CF, metrics.IN, metrics.AV].filter((v) => v === "S").length;
  const harm = Math.min(3, worst + (severeCount >= 2 ? 1 : 0));
  const assetImpact = ASSET_IMPACT[harm][metrics.AS];
  const base = Math.max(assetImpact, SAFETY_IMPACT[metrics.SF]);
  // Scope raises impact but never into Critical; Critical comes only from AS:V or SF:D.
  const impact = base === 0 || base === 4 ? base : Math.min(3, base + SCOPE_BONUS[metrics.SC]);

  const value = impact === 0 ? 0.0 : SCORE_TABLE[lik][impact - 1];
  return {
    vector,
    likelihood: { points, level: LIKELIHOOD_LEVELS[lik] },
    impact: { harm, level: IMPACT_LEVELS[impact] },
    score: value,
    severity: severityOf(value),
  };
}
