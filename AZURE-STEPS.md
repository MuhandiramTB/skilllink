# Deploy SkillLink LK — Azure Container Apps (API) + Vercel (Web) + Neon (DB)

Uses your **free Azure credits** (~$200/30 days). Azure CLI 2.76 is already installed.
You run the commands; I troubleshoot. The API container app + its GitHub Actions deploy
workflow are created by one `az containerapp up` command.

> Heads-up: Azure needs a card to open the account, but **credits cover the cost → $0 spend**.
> Scale-to-zero keeps it cheap. Database stays on **Neon** (already set up).

---

## Step 0 — One-time: sign in + install the extension
```powershell
az login                        # opens a browser; sign in to your Azure account
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
```

## Step 1 — Set variables (PowerShell, from D:\Services)
```powershell
$RG       = "skilllink-rg"
$LOCATION = "southeastasia"          # closest region to Sri Lanka
$ENV      = "skilllink-env"
$API      = "skilllink-api"
$REPO     = "https://github.com/MuhandiramTB/skilllink"
```

## Step 2 — Deploy the API (one command does it all)
This creates the resource group, environment, a container registry, builds
`apps/api/Dockerfile`, deploys, and adds a GitHub Actions deploy workflow.
```powershell
az containerapp up `
  --name $API `
  --resource-group $RG `
  --location $LOCATION `
  --environment $ENV `
  --repo $REPO `
  --branch main `
  --context-path . `
  --ingress external `
  --target-port 4000
```
- It opens a GitHub device-login — paste the code shown in the terminal.
- First build takes several minutes (Docker build + push to ACR + deploy).
- At the end it prints the app URL, e.g. `https://skilllink-api.<hash>.southeastasia.azurecontainerapps.io`.

> Dockerfile note: build context is the repo root (`--context-path .`). Azure auto-detects
> `apps/api/Dockerfile`? If it can't find it, re-run adding `--dockerfile apps/api/Dockerfile`.

## Step 3 — Set the API's environment variables (secrets)
Replace the placeholders with your Neon string + the two secrets you generated.
```powershell
az containerapp update --name $API --resource-group $RG `
  --set-env-vars `
    NODE_ENV=production `
    API_PORT=4000 `
    AUTH_VERIFIER=mock `
    "DATABASE_URL=postgresql://USER:PASS@ep-xxx.REGION.aws.neon.tech/neondb?sslmode=require" `
    "JWT_ACCESS_SECRET=<your-hex-1>" `
    "PAYMENT_MOCK_SECRET=<your-hex-2>" `
    "CORS_ORIGIN=https://CHANGE-AFTER-VERCEL.vercel.app"
```
The app restarts. Test the health endpoint:
```powershell
curl https://<your-api-url>/api/v1/health     # → {"status":"healthy",...}
```

## Step 4 — Load the schema into Neon (one-time, if not already)
Neon SQL Editor → paste all of `submission/render-db-setup.sql` → Run.
(Verify: `SELECT count(*) FROM categories;` → 19.)

## Step 5 — Deploy the Web to Vercel (free, no card)
1. **https://vercel.com** → Sign up with GitHub → **Add New → Project** → import `skilllink`.
2. **Root Directory: `apps/web`** (important — monorepo).
3. Env var: `NEXT_PUBLIC_API_URL` = `https://<your-api-url>/api/v1`.
4. Deploy → get `https://skilllink-<you>.vercel.app`.

## Step 6 — Connect (CORS)
```powershell
az containerapp update --name $API --resource-group $RG `
  --set-env-vars "CORS_ORIGIN=https://skilllink-<you>.vercel.app"
```

## Step 7 — Test 🎉
- Web: `https://skilllink-<you>.vercel.app` → sign in `+94770000000` + any 6 digits.
- API: `https://<your-api-url>/api/v1/health`.

## Step 8 — Monitoring screenshot
Azure portal → your Container App → **Monitoring → Metrics** (CPU/memory/requests) or
**Log stream** (structured JSON logs) → screenshot as `monitoring.png`.

---

## Cost control (stay within free credits)
- Container Apps **scale to zero** when idle → minimal consumption.
- Check spend: Azure portal → **Cost Management + Billing**.
- When done demoing, delete everything: `az group delete --name skilllink-rg`

## Gotchas
- `AADSTS50158…` on `up` → run `az login --scope https://graph.microsoft.com//.default` then retry.
- Build can't find Dockerfile → add `--dockerfile apps/api/Dockerfile`.
- API "degraded"/500 → Neon `DATABASE_URL` wrong or schema not loaded (Steps 3–4).
- Browser CORS error → `CORS_ORIGIN` ≠ exact Vercel URL (Step 6).
