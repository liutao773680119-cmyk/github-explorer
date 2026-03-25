# Security Policy

## Supported Scope

This repository includes:

- the Next.js application
- GitHub Actions workflows
- ingestion and analysis scripts
- tracked JSON data used by the application

## Please Report Privately

Please do not open a public issue for:

- secret exposure
- token leakage
- command execution risks
- unsafe workflow permissions
- supply-chain concerns with the automation pipeline
- vulnerabilities that could affect users or maintainers

Instead, contact the maintainer directly through GitHub or email and include:

- a short summary
- affected file paths or workflow names
- reproduction steps
- impact assessment
- any suggested fix if available

## Response Goals

- acknowledge receipt quickly
- verify the report
- fix or mitigate confirmed issues
- publish a public note after remediation when appropriate

## Operational Safety Notes

- Never commit API keys or tokens.
- Use GitHub Actions secrets for automation credentials.
- Prefer least-privilege tokens.
- Review workflow permission changes carefully.
