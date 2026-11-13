<#
.SYNOPSIS
Stages public landing page files and deploys them directly to Cloudflare Pages (siftroster.pages.dev).
Excludes .git, tests, scripts, and internal repo tooling.
#>
$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot
$dist = Join-Path $env:TEMP "siftroster-pages-dist"

if (-not (Test-Path (Join-Path $repoRoot "index.html"))) {
  throw "Expected index.html in $repoRoot"
}

if (Test-Path $dist) {
  Remove-Item $dist -Recurse -Force
}
New-Item -ItemType Directory -Path $dist | Out-Null

try {
  Copy-Item `
    (Join-Path $repoRoot "index.html"), `
    (Join-Path $repoRoot "robots.txt"), `
    (Join-Path $repoRoot "sitemap.xml"), `
    (Join-Path $repoRoot "_headers") `
    -Destination $dist
  Copy-Item (Join-Path $repoRoot "assets") -Destination (Join-Path $dist "assets") -Recurse

  $npxCmd = "C:\Program Files\nodejs\npx.cmd"
  if (-not (Test-Path $npxCmd)) {
    $npxCmd = "npx"
  }

  Push-Location $env:TEMP
  try {
    & $npxCmd wrangler pages deploy $dist --project-name siftroster --branch main --commit-dirty=true
    if ($LASTEXITCODE -ne 0) {
      throw "wrangler pages deploy exited with code $LASTEXITCODE"
    }
  } finally {
    Pop-Location
  }
} finally {
  if (Test-Path $dist) {
    Remove-Item $dist -Recurse -Force
  }
}
