# =============================================================================
# sync-files-to-wingui.ps1
# manifest.json 의 파일들을 t3series-wingui 폴더로 복사
# Java 파일은 패키지 rename 자동 적용 (com.zionex.t3composer → com.zionex.t3series)
# =============================================================================

[CmdletBinding()]
param(
    [string]$Manifest = "./sync/manifest.json",
    [string]$WinguiPath = $env:COMPOSER_WINGUI_REF_PATH,
    [string]$DatabasePath = $env:COMPOSER_DATABASE_REF_PATH,
    [string]$UpgradeVersion = $env:COMPOSER_UPGRADE_VERSION,
    [switch]$DryRun
)

if (-not $WinguiPath) { $WinguiPath = "C:/Project/t3series/t3series-wingui" }
if (-not $DatabasePath) { $DatabasePath = "C:/Project/t3series/t3series-database" }
if (-not $UpgradeVersion) { $UpgradeVersion = "v26.0.0-20260507" }

if (-not (Test-Path $Manifest)) {
    Write-Host "[sync-files] manifest 없음: $Manifest" -ForegroundColor Red
    Write-Host "  먼저 manifest-from-staging.ps1 을 실행하세요."
    exit 1
}

$m = Get-Content $Manifest -Raw | ConvertFrom-Json

# -----------------------------------------------------------------------------
# Java 파일의 패키지 rename 변환 표 (단독 → wingui)
# -----------------------------------------------------------------------------
$packageRewrites = @(
    @{ from = 'com\.zionex\.t3composer\.domain'; to = 'com.zionex.t3series.web.domain.<MODULE>.<FEATURE>' },  # placeholder — 실제는 파일 위치로 결정
    @{ from = 'com\.zionex\.t3composer\.shared\.audit\.BaseEntity'; to = 'com.zionex.t3series.web.util.audit.BaseEntity' },
    @{ from = 'com\.zionex\.t3composer\.shared\.data\.ResponseMessage'; to = 'com.zionex.t3series.web.util.data.ResponseMessage' },
    @{ from = 'com\.zionex\.t3composer\.shared\.auth'; to = 'com.zionex.t3series.web.security.authentication' },
    @{ from = 'com\.zionex\.t3composer\.shared\.util'; to = 'com.zionex.t3series.util' },
    @{ from = 'com\.zionex\.t3composer\.shared\.constant\.ServiceConstants'; to = 'com.zionex.t3series.web.constant.ServiceConstants' },
    @{ from = 'com\.zionex\.t3composer\.config\.ApplicationProperties'; to = 'com.zionex.t3series.ApplicationProperties' }
)

function Apply-PackageRewrite {
    param([string]$Content, [string]$DestPath)

    foreach ($rw in $packageRewrites) {
        if ($rw.to -match '<MODULE>') {
            # Java 파일의 wingui 위치 (com/zionex/t3series/web/domain/<module>/<feature>) 에서 module/feature 추출
            $matches = [regex]::Match($DestPath, 'web[/\\]domain[/\\](?<m>[^/\\]+)[/\\](?<f>[^/\\]+)[/\\]')
            if ($matches.Success) {
                $resolvedTo = "com.zionex.t3series.web.domain.$($matches.Groups['m'].Value).$($matches.Groups['f'].Value)"
                $Content = $Content -replace 'com\.zionex\.t3composer\.domain(\.[a-z]+)?', $resolvedTo
            }
            continue
        }
        $Content = $Content -replace $rw.from, $rw.to
    }
    return $Content
}

function Get-WinguiTarget {
    param([string]$RelPath, [string]$Category)

    # 다양한 카테고리별 대상 경로
    if ($Category -eq 'JSX') {
        # frontend/src/view/util/userinfomgmt/UserInfoMgmt.jsx → packages/wingui/src/view/util/userinfomgmt/UserInfoMgmt.jsx
        $idx = $RelPath.IndexOf('view/')
        if ($idx -ge 0) {
            return Join-Path $WinguiPath "packages/wingui/src/$($RelPath.Substring($idx))"
        }
    }
    if ($Category -eq 'JAVA') {
        $idx = $RelPath.IndexOf('com/zionex/')
        if ($idx -ge 0) {
            $sub = $RelPath.Substring($idx).Replace('t3composer/domain', 't3series/web/domain')
            return Join-Path $WinguiPath "src/main/java/$sub"
        }
    }
    if ($Category -in 'SQL_DDL','SQL_SP','MENU_SQL') {
        $name = Split-Path $RelPath -Leaf
        $sub = if ($Category -eq 'SQL_SP') { 'procedures' } elseif ($Category -eq 'MENU_SQL') { 'menus' } else { 'tables' }
        return Join-Path $DatabasePath "mssql/upgrade/$UpgradeVersion/$sub/$name"
    }
    return $null
}

# -----------------------------------------------------------------------------
# 실 작업 (또는 dry-run)
# -----------------------------------------------------------------------------
$copied = 0
$skipped = 0
$conflicts = @()

foreach ($f in $m.files) {
    $target = Get-WinguiTarget -RelPath $f.path -Category $f.category
    if (-not $target) { Write-Host "  [skip] $($f.path) (분류 실패)" -ForegroundColor DarkYellow; $skipped++; continue }

    $sourceAbs = Join-Path "./staging/output" $f.path

    if ($DryRun) {
        if (Test-Path $target) {
            Write-Host "  [overwrite] $target" -ForegroundColor Yellow
            $conflicts += $target
        } else {
            Write-Host "  [create]    $target" -ForegroundColor Green
        }
        continue
    }

    # 실 적용
    $destDir = Split-Path $target -Parent
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

    if ($f.category -eq 'JAVA') {
        $content = Get-Content $sourceAbs -Raw -Encoding UTF8
        $content = Apply-PackageRewrite -Content $content -DestPath $target
        Set-Content -Path $target -Value $content -Encoding UTF8
    } else {
        Copy-Item -Path $sourceAbs -Destination $target -Force
    }
    Write-Host "  [copied] $target" -ForegroundColor Green
    $copied++
}

if ($DryRun) {
    Write-Host ""
    Write-Host "=== DRY RUN SUMMARY ===" -ForegroundColor Cyan
    Write-Host "  total files     : $($m.files.Count)"
    Write-Host "  would create    : $(($m.files.Count) - ($conflicts.Count) - $skipped)"
    Write-Host "  would overwrite : $($conflicts.Count)"
    Write-Host "  skipped (분류실패): $skipped"
    Write-Host ""
    Write-Host "실 적용: -DryRun 옵션 빼고 다시 실행" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "=== SYNC DONE ===" -ForegroundColor Green
    Write-Host "  copied  : $copied"
    Write-Host "  skipped : $skipped"
}
