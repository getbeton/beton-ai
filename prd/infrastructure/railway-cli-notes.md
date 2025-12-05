# Railway CLI Quick Reference (Local Only)

> Keep this file private. It is ignored by git and intended purely for local troubleshooting.

## Authentication & Setup
- `railway login` – open browser to authenticate.
- `railway whoami` – confirm active account.
- `railway link --project beton-production --environment <env_name>` – associate repo with project/environment (`test` or `production`).
- `railway unlink` – detach repo when you finish.

## Environment Switching
- `railway environment test` – activate testing environment.
- `railway environment production` – activate production environment.
- `railway status` – show current project/environment/service linkage.

## Log Commands
- `railway logs --service frontend --lines 50` – pull the last 50 lines for the frontend service (current environment).
- `railway logs --service backend --lines 50` – same for backend service.
- `railway logs --service <name> --filter "@level:error" --lines 100` – fetch recent error logs.
- `railway logs --service <name> --since 2h` – stream logs from the past two hours.
- `railway logs --service <name> --lines 200 > ~/Desktop/<name>-railway.log` – save a snapshot locally.
- `railway logs --deployment` / `--build` – inspect deployment/build logs for the last rollout.

## Common Workflow
1. `railway login`
2. `railway link --project beton-production --environment test`
3. `railway logs --service backend --lines 100 --filter "@level:error"`
4. `railway environment production` (if checking prod)
5. Repeat log query for production
6. `railway unlink` when done

## Helpful References
- `railway logs --help`
- `railway environment --help`
- `railway status`
