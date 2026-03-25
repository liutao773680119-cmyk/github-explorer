# Contributing to GitHub Explorer

Thanks for contributing.

This project is small, but it is intended to be reliable and easy to maintain. Please optimize for clarity, reproducibility, and low-maintenance workflows.

## Good First Contributions

- improve analysis quality or prompt validation
- add tests for pure utility logic
- improve UI readability for daily triage
- improve repository health heuristics
- fix data-quality bugs in the ingestion pipeline
- improve docs for operators and contributors

## Development Setup

```bash
npm ci
npm run dev
```

Optional local environment variables:

```bash
GITHUB_TOKEN=your_github_token
GEMINI_API_KEY=your_gemini_api_key
```

## Before Opening a Pull Request

Run these locally:

```bash
npm run lint
npm run test
npm run build
```

## Pull Request Guidelines

- Keep the change narrowly scoped.
- Explain the user-facing or maintainer-facing benefit.
- Add or update tests when you touch deterministic logic.
- Update docs when changing workflows, scripts, or repository conventions.
- Do not commit secrets, generated credentials, or unrelated local files.

## Data and Automation Notes

- `data/` is part of the product surface, not just a cache.
- Scheduled workflows may update tracked JSON files as part of normal operation.
- If you change data shape, update the corresponding types and document the migration path.

## Communication

- Use issues for bugs, feature requests, and workflow proposals.
- Prefer reproducible examples over vague reports.
- If a change increases maintainer burden, explain why the tradeoff is worth it.
