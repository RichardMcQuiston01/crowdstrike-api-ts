# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository currently contains only a `README.md` — there is no source code, `package.json`, build configuration, or tests yet. There are no build/lint/test commands to document until the project is scaffolded. Update this file once tooling (package manager scripts, test runner, linter) is in place.

## Project purpose

A TypeScript helper package meant to be integrated into other TypeScript applications (e.g., an Electron desktop app or a backend API service) for interacting with the CrowdStrike API — making API calls and retrieving/analyzing data from a CrowdStrike instance.

Relevant external references:
- [CrowdStrike API Documentation](https://developer.crowdstrike.com/api-reference/overview/)
- [CrowdStrike API TypeScript SDK](https://developer.crowdstrike.com/sdks/typescript/)

## Guidelines from README

- **Use `bun`, not `npm`**, for package management and running scripts once tooling exists.
- Code must follow the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) unless otherwise noted.
- Markdown files must follow the [Google Markdown Style Guide](https://google.github.io/styleguide/docguide/style.html).
- Tests should be created for each action/API endpoint added.
- Run tests and lint before committing.
- Do not include the word "CLAUDE" in outputted code or documentation.
