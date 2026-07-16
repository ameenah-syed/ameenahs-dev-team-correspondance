[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$required = @('index.html','styles.css','app.js','correspondence.js','README.md','AGENTS.md','.nojekyll')
$missing = @($required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $root $_) -PathType Leaf) })
if ($missing.Count) { throw "Missing required files: $($missing -join ', ')" }
$index = Get-Content -LiteralPath (Join-Path $root 'index.html') -Raw
$app = Get-Content -LiteralPath (Join-Path $root 'app.js') -Raw
$data = Get-Content -LiteralPath (Join-Path $root 'correspondence.js') -Raw
$agents = Get-Content -LiteralPath (Join-Path $root 'AGENTS.md') -Raw
foreach ($asset in @('styles.css','correspondence.js','app.js')) {
  if ($index -notmatch [regex]::Escape($asset)) { throw "index.html does not reference $asset" }
}
foreach ($contract in @('Request Summary','Scope Limits','Conflict Status','Execution Decision','Evidence','Verification','Next Actions','Publication Boundary')) {
  if ($agents -notmatch [regex]::Escape($contract)) { throw "AGENTS.md is missing completeness field: $contract" }
}
$ids = @([regex]::Matches($data,'id:\s*"(\d{3})"') | ForEach-Object { $_.Groups[1].Value })
if (-not $ids.Count) { throw 'No correspondence records found' }
if (($ids | Select-Object -Unique).Count -ne $ids.Count) { throw 'Duplicate correspondence IDs found' }
$expected = @(1..$ids.Count | ForEach-Object { $_.ToString('000') })
$actual = @($ids | Sort-Object)
if (Compare-Object $expected $actual) { throw "Correspondence IDs are not contiguous from 001 through $($ids.Count.ToString('000'))" }
$artifactContracts = @(
  @{ Name='status'; Pattern='<dt>Status</dt>' },
  @{ Name='record type'; Pattern='<dt>Record Type</dt>' },
  @{ Name='request summary'; Pattern='Request Summary' },
  @{ Name='response or update'; Pattern='Specialist Response|Execution Update' },
  @{ Name='scope limits'; Pattern='Scope Limits' },
  @{ Name='evidence'; Pattern='>Evidence<' },
  @{ Name='conflict status'; Pattern='Conflict Status' },
  @{ Name='decision custody'; Pattern='Execution Decision|Execution Update|Decision Custody' },
  @{ Name='verification'; Pattern='>Verification<' },
  @{ Name='next actions'; Pattern='Next Actions' },
  @{ Name='publication boundary'; Pattern='Publication Boundary' }
)
foreach ($id in $ids) {
  $source = @(Get-ChildItem -LiteralPath (Join-Path $root 'plans\correspondance') -File -Filter "$id-*.html")
  if ($source.Count -ne 1) { throw "Expected exactly one source artifact for correspondence $id; found $($source.Count)" }
  $sourceText = Get-Content -LiteralPath $source[0].FullName -Raw
  foreach ($contract in $artifactContracts) {
    if ($sourceText -notmatch $contract.Pattern) { throw "Correspondence $id is missing $($contract.Name)" }
  }
  if ($sourceText -notmatch 'data-publication-addendum') { throw "Correspondence $id is missing its labeled publication addendum" }
}
if ($app -notmatch 'addEventListener\("input"' -or $app -notmatch 'hashchange') { throw 'Search or detail routing hook is missing' }

$profilePatterns = @(
  '(?i)\b[A-Z]:\\Users\\[^\\\s"''<>]+',
  '(?i)(?<![A-Za-z0-9_])/(?:Users|home)/[^/\s"''<>]+'
)
$slash = [char]92
$fixtures = @(
  ('C:' + $slash + 'Users' + $slash + 'fixture-user' + $slash + 'project'),
  ('/' + 'Users' + '/fixture-user/project'),
  ('/' + 'home' + '/fixture-user/project')
)
foreach ($fixture in $fixtures) {
  if (-not ($profilePatterns | Where-Object { $fixture -match $_ })) { throw "Generic profile detector missed synthetic fixture: $fixture" }
}
$publishable = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object { $_.FullName -notmatch '[\\/]\.git[\\/]' -and $_.Extension -ne '.tmp' }
$profileHits = @()
foreach ($file in $publishable) {
  $text = Get-Content -LiteralPath $file.FullName -Raw
  foreach ($pattern in $profilePatterns) {
    if ($text -match $pattern) { $profileHits += $file.FullName; break }
  }
}
if ($profileHits.Count) { throw "Machine-local profile path found in publishable files: $($profileHits -join ', ')" }
Write-Output "Site verification passed: $($required.Count) required files, $($ids.Count) contiguous complete artifacts, search/detail hooks, and generic Windows/macOS/Linux profile fixtures plus self-scan."