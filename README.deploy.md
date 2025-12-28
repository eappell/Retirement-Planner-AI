# Deployment (UI + API) — quick reference

This document explains recommended steps to deploy the UI and API to a remote NAS (e.g., UGREEN DXP 4800 plus). The repo contains helper scripts in `scripts/` to automate common operations.

## Overview
- UI: build locally (`npm run build`) and rsync `./dist/` to the NAS path, then restart the `web` (nginx) service.
- API: build on the NAS using `docker compose` (recommended) or deploy a pre-built image.


## Scripts
### `scripts/deploy-ui.sh`
Usage:

  ./scripts/deploy-ui.sh --host NAS_HOST --user NAS_USER --path /path/to/project [--ssh-key /path/to/key] [--no-build] [--port 22] [--yes]

Example:

  ./scripts/deploy-ui.sh --host nas.local --user deploy --path /home/deploy/retire-portal

What it does:
- (by default) runs `npm ci` and `npm run build` locally to produce `./dist/`
- rsyncs `./dist/` to `${NAS_USER}@${NAS_HOST}:${NAS_PATH}/dist/` using `rsync -av --delete` (atomic-ish)
- sets `chmod -R a+rX` on the remote `dist` directory
- restarts the `web` container via `docker compose restart web`

Notes:
- Use `--no-build` if you built `dist/` earlier.
- Use `--dry-run` to preview actions without making changes.
- Ensure SSH access and proper permissions for the target directory.


### `scripts/deploy-api.sh`
Usage:

  ./scripts/deploy-api.sh --host NAS_HOST --user NAS_USER --path /path/to/project [--ssh-key /path/to/key] [--no-pull] [--image IMAGE] [--port 22] [--yes]

Examples:

  # Build & deploy on NAS
  ./scripts/deploy-api.sh --host nas.local --user deploy --path /home/deploy/retire-portal

  # Deploy a pre-built image
  ./scripts/deploy-api.sh --host nas.local --user deploy --path /home/deploy/retire-portal --image myrepo/retire-api:latest

What it does:
- By default runs `git pull` on the NAS project path, then `docker compose build api` and `docker compose up -d --no-deps --build api`
- If `--image` is supplied, pulls image on NAS and recreates the `api` service


## Permissions & common fixes
- If you get `403` after copying `dist/` to the NAS, check for `index.html` and read permissions:
  - chmod -R a+rX /path/to/dist

- If nginx cannot read the bind-mounted files inside the container, ensure host permissions allow container to read files (or chown to appropriate UID/GID inside the container if required).

- For x86 NAS machines (like your device), building images on the NAS is straightforward. For ARM NAS you would use `docker buildx` or build on the NAS directly.


## Safety & notes
- Scripts are intentionally interactive by default. Use `--yes` for automation.
- Use `rsync` to avoid serving partially-updated file trees during a deploy.

---
If you want, I can:
- Mark both scripts executable and commit them (I can do this here), or
- Add CI steps to build/publish images automatically.

Which would you prefer next?