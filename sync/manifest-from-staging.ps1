# =============================================================================
# manifest-from-staging.ps1
# Composer staging 폴더 + composer-db 의 변경분을 manifest.json 으로 추출
# =============================================================================
# 사용:
#   ./sync/manifest-from-staging.ps1 [-SessionId <sid>] [-Output ./sync/manifest.json]
#
# 출력 manifest.json 구조:
# {
#   "generatedAt": "2026-05-07T10:00:00",
#   "sessionId": "...",
#   "files": [ { "path": "...", "sha256": "...", "category": "JSX|JAVA|SQL_DDL|SQL_SP|MENU_SQL" } ],
#   "menuRows": [ { "menuCd": "...", "menuFilePath": "...", "parentMenuCd": "...", "menuSeq": ... } ],
#   "spList": [ "SP_UI_UT_USER_INFO_V3_Q1", ... ],
#   "tableList": [ ]
# }
# =============================================================================

[CmdletBinding()]
param(
    [string]$SessionId = $null,
    [string]$Output = "./sync/manifest.json",
    [string]$StagingDir = "./staging/output",
    [string]$DbHost = "localhost",
    [int]$DbPort = 11433,
    [string]$DbUser = "sa",
    [string]$DbPassword = $env:MSSQL_SA_PASSWORD
)

if (-not $DbPassword) { $DbPassword = "Composer!2026" }

function Get-FileSha256 {
    param([string]$Path)
    $hash = Get-FileHash -Path $Path -Algorithm SHA256
    return $hash.Hash.ToLower()
}

function Classify-File {
    param([string]$Path)
    if ($Path -match '\.jsx$') { return 'JSX' }
    if ($Path -match '\.java$') { return 'JAVA' }
    if ($Path -match '_MENU\.sql$' -or $Path -match '/menus/') { return 'MENU_SQL' }
    if ($Path -match '/procedures/') { return 'SQL_SP' }
    if ($Path -match '\.sql$') { return 'SQL_DDL' }
    return 'OTHER'
}

# Step 1 — staging 의 모든 파일 스캔
$rootPath = Resolve-Path $StagingDir -ErrorAction SilentlyContinue
if (-not $rootPath) {
    Write-Host "[manifest] staging 폴더가 없습니다: $StagingDir" -ForegroundColor Yellow
    Write-Host "  Composer 가 staging mode 로 산출물을 만들었는지 확인하세요." -ForegroundColor Yellow
    exit 1
}

$files = @()
Get-ChildItem -Path $rootPath -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($rootPath.Path.Length).TrimStart('\','/').Replace('\','/')
    if ($SessionId -and -not $rel.StartsWith($SessionId)) { return }
    $files += @{
        path = $rel
        absPath = $_.FullName
        sha256 = Get-FileSha256 $_.FullName
        size = $_.Length
        category = Classify-File $rel
    }
}
Write-Host "[manifest] $($files.Count) files in $StagingDir" -ForegroundColor Cyan

# Step 2 — composer-db 에서 신규 등록된 메뉴 / SP / Table 추출
$sqlcmd = "sqlcmd"
$dbArgs = @("-S", "$DbHost,$DbPort", "-U", $DbUser, "-P", $DbPassword, "-d", "T3SMARTSCM", "-C", "-h", "-1", "-W")

# 신규 메뉴 — composer 가 만든 leaf 메뉴 (system 외 사용자/composer 등이 만든 것 + 부모 메뉴 9개 제외)
$menuQuery = @"
SET NOCOUNT ON;
SELECT MENU_CD + '|' + ISNULL(MENU_FILE_PATH,'') + '|' + ISNULL(MENU_PATH,'') + '|' + CONVERT(VARCHAR(20), ISNULL(MENU_SEQ,0))
  FROM dbo.TB_AD_MENU
 WHERE CREATE_BY <> 'system'
   AND MENU_CD NOT LIKE 'MENU_%'
 ORDER BY MENU_CD
"@
$menuRows = & $sqlcmd @dbArgs -Q $menuQuery 2>$null | Where-Object { $_ -match '\|' }

# 신규 SP 목록
$spQuery = @"
SET NOCOUNT ON;
SELECT name FROM sys.procedures
 WHERE name LIKE 'SP_UI_%'
   AND create_date >= DATEADD(day, -30, GETDATE())
 ORDER BY name
"@
$spList = & $sqlcmd @dbArgs -Q $spQuery 2>$null | Where-Object { $_.Trim() -ne '' -and $_.Trim() -notmatch '^(name|---)' }

# 신규 Table 목록 (TB_AD_/TB_IS_/TB_UT_ 외)
$tableQuery = @"
SET NOCOUNT ON;
SELECT name FROM sys.tables
 WHERE name NOT IN (SELECT name FROM sys.tables WHERE create_date < DATEADD(day, -1, GETDATE()))
   AND name NOT LIKE 'TB_AD_%'
   AND name NOT LIKE 'TB_IS_COMPOSER_%'
 ORDER BY name
"@
$tableList = & $sqlcmd @dbArgs -Q $tableQuery 2>$null | Where-Object { $_.Trim() -ne '' -and $_.Trim() -notmatch '^(name|---)' }

# Step 3 — manifest.json 작성
$manifest = @{
    generatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    sessionId = $SessionId
    files = $files
    menuRows = @($menuRows | ForEach-Object {
        $parts = $_.Split('|')
        @{ menuCd = $parts[0].Trim(); menuFilePath = $parts[1].Trim(); menuPath = $parts[2].Trim(); menuSeq = $parts[3].Trim() }
    })
    spList = @($spList | ForEach-Object { $_.Trim() })
    tableList = @($tableList | ForEach-Object { $_.Trim() })
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $Output -Encoding UTF8
Write-Host "[manifest] written → $Output" -ForegroundColor Green
Write-Host "  files       : $($files.Count)"
Write-Host "  new menus   : $($manifest.menuRows.Count)"
Write-Host "  new SPs     : $($manifest.spList.Count)"
Write-Host "  new tables  : $($manifest.tableList.Count)"
