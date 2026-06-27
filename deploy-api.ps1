# =============================================================================
# Redeploy the SkillLink API to Azure Container Apps after backend changes.
# Builds apps/api/Dockerfile -> pushes to ACR -> rolls the Container App (Azure
# does a health-gated, zero-downtime swap). Run from the repo root: ./deploy-api.ps1
# Prereqs: Docker Desktop running, `az login` done.
# To redeploy the API after any backend change, just run:
# cd D:\Services
# ./deploy-api.ps1
# =============================================================================
$ErrorActionPreference = "Stop"

# --- config (matches what we deployed) ---
$ACR  = "cae7363edd89acr"
$RG   = "skilllink-rg"
$APP  = "skilllink-api"
$TAG  = (Get-Date -Format "yyyyMMdd-HHmmss")          # unique tag per deploy
$IMAGE = "$ACR.azurecr.io/${APP}:$TAG"
$LATEST = "$ACR.azurecr.io/${APP}:latest"

Write-Host "==> Logging in to ACR ($ACR)..." -ForegroundColor Cyan
az acr login --name $ACR | Out-Null

Write-Host "==> Building image $IMAGE ..." -ForegroundColor Cyan
docker build -f apps/api/Dockerfile -t $IMAGE -t $LATEST .
if ($LASTEXITCODE -ne 0) { Write-Error "Docker build failed."; exit 1 }

Write-Host "==> Pushing to ACR..." -ForegroundColor Cyan
docker push $IMAGE
docker push $LATEST

Write-Host "==> Rolling the Container App to the new image (zero-downtime)..." -ForegroundColor Cyan
az containerapp update --name $APP --resource-group $RG --image $IMAGE | Out-Null

$fqdn = az containerapp show --name $APP --resource-group $RG --query "properties.configuration.ingress.fqdn" -o tsv
Write-Host "`n  Deployed $TAG" -ForegroundColor Green
Write-Host "   Live:   https://$fqdn/api/v1/health" -ForegroundColor Green
Write-Host "`n   Tip: Azure waits for the health check before switching traffic. Old`n   revision keeps serving until the new one is healthy (blue-green)." -ForegroundColor DarkGray

