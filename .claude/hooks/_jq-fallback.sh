# T3Series — jq fallback locator
# Sourced by hooks before they check `command -v jq`.
# Tries common Windows install locations (winget · chocolatey · scoop).
# No-op on Linux/Mac where jq is usually in PATH already.

if ! command -v jq >/dev/null 2>&1; then
  for _t3_jq_dir in \
    "${LOCALAPPDATA:-$HOME/AppData/Local}/Microsoft/WinGet/Packages/jqlang.jq_Microsoft.Winget.Source_8wekyb3d8bbwe" \
    "${LOCALAPPDATA:-$HOME/AppData/Local}/Microsoft/WinGet/Links" \
    "/c/ProgramData/chocolatey/bin" \
    "${USERPROFILE:-$HOME}/scoop/shims" \
    "/c/Program Files/jq" \
    "/usr/local/bin"; do
    if [ -x "$_t3_jq_dir/jq.exe" ] || [ -x "$_t3_jq_dir/jq" ]; then
      PATH="$_t3_jq_dir:$PATH"
      break
    fi
  done
  unset _t3_jq_dir
fi
