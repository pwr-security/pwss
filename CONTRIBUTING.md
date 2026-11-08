# Contributing

Thank you for your interest in PWSS.

## Reporting a problem

Open an issue describing the vector, the result you obtained, and the result you expected, with the relevant section of the specification.

## Changing the calculation

The specification is the source of truth; `src/pwss.mjs` is its reference implementation. Any change that can alter the score or the severity of a valid vector is a change of the specification and must:

1. update `SPECIFICATION.md`, including its change table;
2. use a new version number, which is carried in the vector prefix (`PWSS:<version>`);
3. update `src/pwss.mjs` and add test vectors in `test/test-vectors.json`, with expected values computed by hand from the specification;
4. add an entry to `CHANGELOG.md`.

Clarifications that do not change any result do not need a new version.

## Pull requests

Work on a branch and open a pull request against `main`. Run the tests before submitting:

```sh
npm test
```

The test script checks the test vectors, the rejection of invalid vectors, and the properties of the specification over all 139,968 possible vectors.

## Licensing of contributions

By contributing, you agree that your contribution to the specification is licensed under CC BY 4.0 and your contribution to the code under the MIT License, as described in the README.
