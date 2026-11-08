# Physical Weakness Scoring System (PWSS) v1.0

PWSS rates the severity of a **finding**: an occurrence of a weakness from the Physical Weakness Registry (PWR) at a given place. It produces a vector, a score from 0.0 to 10.0 and a severity level.

A given vector always produces the same score. The reference implementation is `pwss.mjs`; test vectors are in `test-vectors.json`.

## 1. Metrics

All ten metrics are mandatory. There are no optional or environmental adjustments.

### Exploitation

| Code | Metric | Values |
|---|---|---|
| AR | Authorization Required | **N** None · **V** Visitor or Contractor · **S** Staff · **P** Privileged |
| EF | Effort and Means | **T** Trivial · **L** Low · **M** Moderate · **H** High |
| OP | Opportunity | **A** Anytime · **C** Conditional · **R** Rare |
| DR | Detection and Response | **S** Stopped in time · **L** Late · **U** Undetected |

- **AR**: the lowest level of authorization needed to attempt the exploitation, regardless of who actually does it.
- **EF**: the hardest of the skills, preparation time and equipment needed. Trivial: minutes, no skill, no tool. Low: basic skill, common tools. Moderate: training, preparation or specific tools. High: specialists and long preparation.
- **OP**: Anytime means no particular circumstance is needed. Conditional means a circumstance such as a time window or an absence of staff. Rare means an exceptional circumstance.
- **DR**: Stopped in time means detection and a response that reaches the place before the exploitation succeeds, and that has been tested. Late means it is detected after it succeeded. Undetected means it is not detected.

### Impact

| Code | Metric | Values |
|---|---|---|
| AS | Asset Criticality | **L** Low · **M** Moderate · **H** High · **V** Vital |
| CF | Confidentiality Impact | **N** None · **L** Limited · **S** Severe |
| IN | Integrity Impact | **N** None · **L** Limited · **S** Severe |
| AV | Availability Impact | **N** None · **L** Limited · **S** Severe |
| SF | Safety of Persons | **N** None · **I** Injury possible · **D** Danger to life |

- **AS** is the importance of what the area protects. Choose the highest level reached by any criterion:

| Level | Classification | Tolerated outage | Replacement and consequences |
|---|---|---|---|
| Low | Public | More than a week | Easily replaced, no legal duty |
| Moderate | Internal | A few days | Replaced at a notable cost |
| High | Confidential (professional secrecy, large-scale personal data) | A few hours | Major legal, financial or contractual impact |
| Vital | Highest classification of the organization | No outage tolerated | Irreversible loss or end of the organization's activity |

- **CF, IN, AV** are the extent of the harm done to the asset. Integrity covers alteration, forgery and impersonation, including of records and traces.
- **SF** is the harm to persons, independent of the asset. It does not depend on AS.

### Propagation

| Code | Metric | Values |
|---|---|---|
| SC | Scope | **C** Contained · **A** Adjacent areas · **W** Whole site |

SC states how far the exploitation extends beyond the protected asset. Replication of the same weakness at several sites is not scope; report it separately.

## 2. Vector

```
PWSS:1.0/AR:N/EF:L/OP:A/DR:U/AS:V/CF:S/IN:N/AV:N/SF:N/SC:C
```

The prefix is `PWSS:` followed by the version. The ten metrics follow in the order AR, EF, OP, DR, AS, CF, IN, AV, SF, SC. A vector with a missing, repeated, misordered or unknown metric is invalid.

## 3. Calculation

### Step 1. Likelihood

Add the points of AR, EF, OP and DR.

| Metric | Points |
|---|---|
| AR | N 3 · V 2 · S 1 · P 0 |
| EF | T 3 · L 2 · M 1 · H 0 |
| OP | A 2 · C 1 · R 0 |
| DR | U 3 · L 2 · S 0 |

| Total (0 to 11) | Likelihood |
|---|---|
| 0–2 | Very Low |
| 3–5 | Low |
| 6–8 | Moderate |
| 9–11 | High |

### Step 2. Impact

**Harm.** Give each of CF, IN, AV the points N 0, L 1, S 2. Take the highest. Add 1 if at least two of them are Severe. Harm is between 0 and 3.

**Asset impact.** Read the table with the harm and AS.

| Harm | L | M | H | V |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 |
| 1 | 1 | 1 | 2 | 2 |
| 2 | 1 | 2 | 3 | 4 |
| 3 | 2 | 3 | 3 | 4 |

**Safety impact.** SF N gives 0, I gives 2, D gives 4.

**Base impact** is the higher of the asset impact and the safety impact.

**Scope.** If the base impact is 1, 2 or 3, add 1 for SC A or 2 for SC W, without exceeding 3. A base impact of 0 or 4 is not changed.

Impact levels: 0 None, 1 Low, 2 Moderate, 3 High, 4 Critical.

Critical impact therefore comes only from a Vital asset with severe harm, or from danger to life. Scope can lift an impact to High but never to Critical.

### Step 3. Score

If the impact is 0, the score is 0.0. Otherwise read the table with the likelihood and the impact.

| Likelihood | Low | Moderate | High | Critical |
|---|---|---|---|---|
| Very Low | 0.5 | 1.0 | 1.5 | 3.0 |
| Low | 1.0 | 2.0 | 4.0 | 6.5 |
| Moderate | 1.5 | 3.5 | 6.5 | 8.5 |
| High | 2.0 | 4.5 | 7.5 | 10.0 |

The score has few possible values on purpose. It sorts findings; it does not claim a precision the inputs do not have.

### Step 4. Severity

| Score | Severity |
|---|---|
| 0.0 | None |
| 0.1–2.9 | Low |
| 3.0–5.9 | Medium |
| 6.0–8.4 | High |
| 8.5–10.0 | Critical |

## 4. Properties

These hold for every valid vector and are checked by the test script.

- Severity is None if and only if CF, IN, AV and SF are all None.
- Critical severity requires AS Vital or SF Danger to life, and a Moderate or High likelihood.
- A Contained finding on a Low asset does not exceed Medium, unless SF is Danger to life.
- A weakness stopped in time (DR S) can never reach High likelihood.

## 5. Use

Report the PWR identifier with the vector, for example `PWR-7 PWSS:1.0/AR:N/EF:L/OP:A/DR:U/AS:V/CF:S/IN:N/AV:N/SF:N/SC:C`. The vector is the record; the score and severity can be recomputed from it.

## 6. Limits

- AS, EF and DR depend on the judgment of the assessor. The anchors above reduce the differences between assessors but do not remove them.
- Version 1.0 has not been calibrated against real assessments. The weights and thresholds may change in a later version, which will carry a new version number in the vector.
- PWSS rates one finding. It does not combine findings or estimate the risk of a whole site.

## 7. Changes

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-08 | First version |

## 8. License

This specification is licensed under the Creative Commons Attribution 4.0 International license (CC BY 4.0). See `LICENSE`. You may share and adapt it, including commercially, provided you give appropriate credit, link to the license and indicate if changes were made.

Suggested attribution: "Physical Weakness Scoring System (PWSS) v1.0, Physical Weakness Registry, licensed under CC BY 4.0."
