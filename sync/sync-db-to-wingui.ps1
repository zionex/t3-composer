# =============================================================================
# sync-db-to-wingui.ps1
# composer-db 에서 만든 신규 SP / Table / TB_AD_MENU INSERT 를 wingui DB 에 적용
# =============================================================================
# 사용:
#   ./sync/sync-db-to-wingui.ps1 [-WhatIf] [-Manifest ./sync/manifest.json]
# =============================================================================

[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$Manifest = "./sync/manifest.json",

    # composer-db (source)
    [string]$ComposerDbHost = "localhost",
    [int]$ComposerDbPort = 11433,
    [string]$ComposerDbUser = "sa",
    [string]$ComposerDbPassword = $env:MSSQL_SA_PASSWORD,

    # wingui DB (target)
    [string]$WinguiDbHost = $env:WINGUI_DB_HOST,
    [int]$WinguiDbPort = 1433,
    [string]$WinguiDbUser = $env:WINGUI_DB_USER,
    [string]$WinguiDbPassword = $env:WINGUI_DB_PASSWORD,
    [string]$WinguiDbName = "T3SMARTSCM"
)

if (-not $ComposerDbPassword) { $ComposerDbPassword = "Composer!2026" }
if (-not $WinguiDbHost)  { $WinguiDbHost  = "localhost" }
if (-not $WinguiDbUser)  { Write-Host "WINGUI_DB_USER 환경변수 필수" -ForegroundColor Red; exit 1 }
if (-not $WinguiDbPassword) { Write-Host "WINGUI_DB_PASSWORD 환경변수 필수" -ForegroundColor Red; exit 1 }

if (-not (Test-Path $Manifest)) {
    Write-Host "[sync-db] manifest 없음: $Manifest" -ForegroundColor Red
    exit 1
}
$m = Get-Content $Manifest -Raw | ConvertFrom-Json

# -----------------------------------------------------------------------------
# 1) 신규 SP DDL 추출 (composer-db) → wingui DB 에 적용
# -----------------------------------------------------------------------------
$composerArgs = @("-S", "$ComposerDbHost,$ComposerDbPort", "-U", $ComposerDbUser, "-P", $ComposerDbPassword, "-d", "T3SMARTSCM", "-C")
$winguiArgs   = @("-S", "$WinguiDbHost,$WinguiDbPort",     "-U", $WinguiDbUser,   "-P", $WinguiDbPassword,   "-d", $WinguiDbName, "-C")

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "composer-sync-$(Get-Date -Format yyyyMMddHHmmss)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Host "[sync-db] temp dir: $tempDir" -ForegroundColor Cyan

# 1-1) SP 들의 DDL 추출
foreach ($spName in $m.spList) {
    if (-not $spName) { continue }
    $sp = $spName.Trim()
    if (-not $sp) { continue }
    $script = "EXEC sp_helptext '$sp'"
    $ddlPath = Join-Path $tempDir "sp_$sp.sql"
    & sqlcmd @composerArgs -Q $script -h -1 -W -o $ddlPath 2>$null
    if (Test-Path $ddlPath) {
        $body = (Get-Content $ddlPath -Raw -Encoding UTF8)
        # CREATE → CREATE OR ALTER 로 안전 적용
        $body = $body -replace '(?im)^\s*CREATE\s+(PROCEDURE|PROC)\s', 'CREATE OR ALTER $1 '
        Set-Content -Path $ddlPath -Value $body -Encoding UTF8
    }
}

# 1-2) 신규 Table DDL — sp_helpsource 무 → INFORMATION_SCHEMA 기반 단순 추출 (권장: composer-db 에서 SSMS 로 export 후 manual)
foreach ($tbl in $m.tableList) {
    if (-not $tbl) { continue }
    $tableName = $tbl.Trim()
    if (-not $tableName) { continue }
    Write-Host "  [warn] new table $tableName 의 DDL 은 자동 추출 미지원 — SSMS 로 수동 추출 필요" -ForegroundColor Yellow
}

# 1-3) MENU_SQL 생성 — composer-db 의 새 메뉴 + 4언어 라벨 + 권한 복사
$menuSqlPath = Join-Path $tempDir "menu_sync.sql"
$menuSqlContent = @"
-- composer-db 의 신규 메뉴를 wingui DB 에 동기화
SET NOCOUNT ON;
"@

foreach ($menu in $m.menuRows) {
    $menuCd = $menu.menuCd
    if (-not $menuCd) { continue }
    # MENU_CD 기반 멱등 INSERT (이미 있으면 skip)
    $menuSqlContent += @"

IF NOT EXISTS (SELECT 1 FROM TB_AD_MENU WHERE MENU_CD = N'$menuCd')
BEGIN
    INSERT INTO TB_AD_MENU (ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM)
    VALUES (LOWER(REPLACE(NEWID(),'-','')),
            (SELECT TOP 1 ID FROM TB_AD_MENU WHERE MENU_CD = 'MENU_UTIL'),    -- TODO: 실제 parent 매핑 필요
            N'$menuCd',
            N'$($menu.menuPath)',
            $($menu.menuSeq),
            N'$($menu.menuFilePath)',
            'Y', 'composer-sync', GETDATE());
    PRINT N'INSERTED: $menuCd';
END
ELSE
    PRINT N'SKIP (exists): $menuCd';
"@
}
Set-Content -Path $menuSqlPath -Value $menuSqlContent -Encoding UTF8

# -----------------------------------------------------------------------------
# 2) 적용 (또는 WhatIf)
# -----------------------------------------------------------------------------
$allFiles = @(Get-ChildItem -Path $tempDir -Filter '*.sql' | Sort-Object Name)

if ($PSCmdlet.MyInvocation.BoundParameters.ContainsKey('WhatIf') -or $WhatIfPreference) {
    Write-Host ""
    Write-Host "=== WHATIF: 다음 SQL 들이 wingui DB 에 적용됩니다 ===" -ForegroundColor Cyan
    foreach ($f in $allFiles) {
        Write-Host "  -> $($f.FullName)"
    }
    Write-Host ""
    Write-Host "실 적용: -WhatIf 빼고 다시 실행" -ForegroundColor Yellow
    Write-Host "임시 파일들이 $tempDir 에 보존됩니다 (수동 검토용)"
    exit 0
}

# 실 적용
foreach ($f in $allFiles) {
    Write-Host "[sync-db] applying $($f.Name)" -ForegroundColor Green
    & sqlcmd @winguiArgs -i $f.FullName -b
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  FAILED at $($f.Name) — abort." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== DB SYNC DONE ===" -ForegroundColor Green
Write-Host "  applied : $($allFiles.Count) sql files"
Write-Host "  temp    : $tempDir (검토용 보존)"
