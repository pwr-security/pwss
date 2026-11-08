# PWSS: Physical Weakness Scoring System

[![spec](https://img.shields.io/badge/spec-v1.0-blue)](SPECIFICATION.md)
[![code license: MIT](https://img.shields.io/badge/code-MIT-green)](LICENSE)
[![spec license: CC BY 4.0](https://img.shields.io/badge/spec-CC%20BY%204.0-lightgrey)](LICENSE)

PWSS rates the severity of a **finding**: an occurrence of a weakness from the [Physical Weakness Registry (PWR)](https://pwr-security.org) at a given place. It produces a compact vector, a score from 0.0 to 10.0 and a severity level.

- **Deterministic.** A given vector always produces the same score.
- **Ten mandatory metrics.** Exploitation, impact and propagation, with no optional or environmental adjustments.
- **Reproducible.** The specification, a reference implementation and test vectors are published together.
- **Independent of the registry.** The vector describes the finding only; it does not contain the weakness identifier.

An online calculator is available at <https://pwr-security.org/scoring>.

## Vector

```
PWSS:1.0/AR:N/EF:L/OP:A/DR:U/AS:V/CF:S/IN:N/AV:N/SF:N/SC:C
```

| Group | Metrics |
|---|---|
| Exploitation | AR Authorization Required, EF Effort and Means, OP Opportunity, DR Detection and Response |
| Impact | AS Asset Criticality, CF Confidentiality, IN Integrity, AV Availability, SF Safety of Persons |
| Propagation | SC Scope |

The full definition of each metric and value, and the calculation, are in [SPECIFICATION.md](SPECIFICATION.md).

## Usage

The reference implementation is a dependency-free ES module that works in Node.js (18 or later) and in the browser.

```js
import { score, parseVector } from "pwss";

const result = score("PWSS:1.0/AR:N/EF:L/OP:A/DR:U/AS:V/CF:S/IN:N/AV:N/SF:N/SC:C");
// {
//   vector: "PWSS:1.0/AR:N/EF:L/OP:A/DR:U/AS:V/CF:S/IN:N/AV:N/SF:N/SC:C",
//   likelihood: { points: 10, level: "High" },
//   impact: { harm: 2, level: "Critical" },
//   score: 10,
//   severity: "Critical"
// }

parseVector("PWSS:1.0/AR:N/…"); // throws on a missing, repeated, misordered or unknown metric
```

`score` also accepts an object of metrics, for example `{ AR: "N", EF: "L", … }`. TypeScript declarations are included.

| Export | Description |
|---|---|
| `score(vectorOrMetrics)` | Computes the likelihood, impact, score and severity |
| `parseVector(vector)` | Parses and validates a vector string into an object of metrics |
| `formatVector(metrics)` | Builds the canonical vector string |
| `severityOf(score)` | Maps a score to a severity level |
| `METRICS`, `METRIC_ORDER` | Metric definitions and the fixed metric order |

## Tests

```sh
npm test
```

The script checks the hand-computed test vectors in [`test/test-vectors.json`](test/test-vectors.json), the rejection of invalid vectors, and the properties stated in the specification over all 139,968 possible vectors.

## Status and limits

Version 1.0 has not been calibrated against real assessments. Asset criticality, effort and detection depend on the assessor's judgment. PWSS rates one finding; it does not combine findings or estimate the risk of a whole site. Any change to the calculation carries a new version number in the vector. See [CHANGELOG.md](CHANGELOG.md).

## License

| Content | License |
|---|---|
| Specification ([`SPECIFICATION.md`](SPECIFICATION.md)) | [CC BY 4.0](LICENSE) |
| Code (`src/`, `test/`) | [MIT](LICENSE) |

Both licenses are in the [`LICENSE`](LICENSE) file.

The specification and the code are licensed separately. Re-implementations of the algorithm are free to use any license, provided the specification is credited as required by CC BY 4.0.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
