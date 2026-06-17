# T3 Validator — JSX 차트 라이브러리 화이트리스트 (T3SERIES overlay 한정)
# Sourced by pre-tool-use-validator.sh — uses $FILE_PATH $CONTENT
#
# 차단 대상: T3SERIES (wingui-core stack) 산출물 JSX 의 비표준 차트 라이브러리 import.
# 표준은 Chart.js + react-chartjs-2 또는 @zionex/wingui-core/component/chart/ChartComponent.
# 그 외 라이브러리는 wingui 본 환경 미설치 → sync 후 webpack `Module not found` 컴파일 실패.
#
# 룰: .claude/targets/t3series/rules/41c-composer-chart.md

if [[ "$FILE_PATH" == *.jsx || "$FILE_PATH" == *.tsx ]] && [ -n "$CONTENT" ]; then
  # _preview / shim / 미리보기 runtime 자체는 제외 — graceful-degradation mock 운영 영역.
  # 산출물 (view/<module>/...) 만 차단.
  if [[ "$FILE_PATH" != *"/_preview/"* ]] \
     && [[ "$FILE_PATH" != *"/preview/runtime.js" ]] \
     && [[ "$FILE_PATH" != *"/src/shim/"* ]]; then

    # 여러 줄 import 도 매칭하기 위해 줄바꿈을 공백으로 평탄화한 사본.
    _FLAT_CHART=$(tr '\n' ' ' <<<"$CONTENT")

    # CG-CHART-1. recharts — 가장 빈번한 LLM 환각.
    if grep -qE "from[[:space:]]+['\"]recharts['\"]" <<<"$_FLAT_CHART"; then
      block "recharts 는 wingui 본 환경에 미설치입니다. Chart.js + react-chartjs-2 또는 @zionex/wingui-core/component/chart/ChartComponent 만 사용. 변환 가이드: targets/t3series/rules/41c-composer-chart.md §3" \
            "targets/t3series/rules/41c-composer-chart.md §2"
    fi

    # CG-CHART-2. 그 외 비-Chart.js 차트 라이브러리 — 모두 미설치.
    # victory / @visx/* / @nivo/* / echarts / echarts-for-react / apexcharts / react-apexcharts
    # plotly.js / react-plotly.js / highcharts / highcharts-react-official / chartist / react-vis
    # react-d3-library
    if grep -qE "from[[:space:]]+['\"](victory|@visx/[^'\"]*|@nivo/[^'\"]*|echarts|echarts-for-react|apexcharts|react-apexcharts|plotly\.js|react-plotly\.js|highcharts|highcharts-react-official|chartist|react-vis|react-d3-library)['\"]" <<<"$_FLAT_CHART"; then
      block "비-Chart.js 차트 라이브러리 import 는 wingui 본 환경에 미설치입니다. Chart.js + react-chartjs-2 또는 @zionex/wingui-core/component/chart/ChartComponent 만 사용." \
            "targets/t3series/rules/41c-composer-chart.md §2"
    fi

    # CG-CHART-3. d3 / d3-* — react-chartjs-2 와 혼용 의도면 warn (직접 d3 로 SVG 그리는 산출물 비표준).
    if grep -qE "from[[:space:]]+['\"](d3|d3-[a-z-]+)['\"]" <<<"$_FLAT_CHART"; then
      warn "d3 직접 import — wingui 산출물은 Chart.js + react-chartjs-2 표준. d3 가 정말 필요하면 @zionex/wingui-core 의 GanttChart 등 기존 wrapper 사용 검토."
    fi
  fi
fi
