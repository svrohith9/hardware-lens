# Contributing

Thanks for contributing to HardwareLens.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Before opening a PR

- Run `pnpm lint`
- Run `pnpm build`
- Update docs if setup, API, or behavior changed
- Do not commit secrets (`.env.local`, service account keys)

## Pull request checklist

- [ ] Summary includes problem + solution
- [ ] Validation steps included
- [ ] UI/API screenshots or examples if relevant
