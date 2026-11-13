<#
.SYNOPSIS
Creates a standalone public GitHub repository for the SiftRoster SEO landing page
and enables GitHub Pages via GitHub Actions.
Only run inside C:\Users\16358\Downloads\vibe vibe\siftroster-landing.
#>
param(
  [string]$RepoName = "siftroster-landing",
  [ValidateSet("public", "private")]
  [string]$Visibility = "public"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Safety guard: ensure this only runs inside the standalone landing page folder
if (-not (Test-Path ".\index.html") -or (Test-Path ".\data") -or (Test-Path ".\scripts")) {
  throw "SAFETY ABORT: Unexpected directory layout. Refusing to publish."
}

Write-Host "Checking GitHub CLI auth..."
gh auth status

$owner = (gh api user --jq .login).Trim()
$fullRepo = "$owner/$RepoName"

Write-Host "Creating repository $fullRepo ($Visibility) and pushing main..."
gh repo create $fullRepo --$Visibility --source=. --remote=origin --push

Write-Host "Enabling GitHub Pages (GitHub Actions workflow build_type)..."
gh api -X POST "repos/$fullRepo/pages" -f build_type=workflow 2>$null
if ($LASTEXITCODE -ne 0) {
  gh api -X PUT "repos/$fullRepo/pages" -f build_type=workflow
}

Write-Host ""
Write-Host "Done! Repository: https://github.com/$fullRepo"
Write-Host "GitHub Pages URL (after Actions finishes ~30s): https://$owner.github.io/$RepoName/"
