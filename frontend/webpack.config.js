const path = require('path');
const http = require('http');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// keep-alive 끈 agent — backend 재시작 후 stale socket 으로 504 가 발생하던 문제 회피.
const noKeepAliveAgent = new http.Agent({ keepAlive: false });

module.exports = (env, argv) => {
  const isDev = argv.mode !== 'production';
  const apiBase = process.env.COMPOSER_API_BASE || 'http://localhost:8090';
  const insightApiBase = process.env.INSIGHT_API_BASE || 'http://localhost:9160';

  return {
    entry: './src/index.jsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[contenthash].js',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        // wingui 표면을 shim 으로 대체
        '@wingui/common/imports': path.resolve(__dirname, 'src/shim/wingui/common/imports.js'),
        '@wingui/view/common': path.resolve(__dirname, 'src/shim/wingui/view/common'),
        '@wingui/common': path.resolve(__dirname, 'src/shim/wingui/common'),
        '@wingui': path.resolve(__dirname, 'src/shim/wingui'),
        '@zionex/wingui-core/lang/i18n-func': path.resolve(__dirname, 'src/shim/zionex/i18n-func.js'),
        '@zionex/wingui-core/store/contentStore': path.resolve(__dirname, 'src/shim/zionex/contentStore.js'),
        '@zionex/wingui-core/component/dashboard/DashboardPanel': path.resolve(__dirname, 'src/shim/zionex/wingui-core.js'),
        '@zionex/wingui-core': path.resolve(__dirname, 'src/shim/zionex/wingui-core.js'),
        // insight 산출물 shim
        '@insight/style/AppCommonStyle': path.resolve(__dirname, 'src/shim/insight/style/AppCommonStyle.jsx'),
        '@insight': path.resolve(__dirname, 'src/shim/insight'),
        // 산출물이 환각하는 차트 라이브러리 — react-chartjs-2 로 wrapping
        '@progress/kendo-react-charts': path.resolve(__dirname, 'src/shim/kendo-react-charts.jsx'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          // _preview 폴더는 절대 main bundle 의 dependency graph 에 포함되지 않도록
          // babel-loader 에서 명시적으로 배제. 산출물 JSX 는 runtime 에 @babel/standalone
          // 으로 변환되어 격리된 형태로 로드됨 (frontend/src/preview/runtime.js).
          exclude: [/node_modules/, /[\\/]_preview[\\/]/],
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: { esmodules: true } }],
                ['@babel/preset-react', { runtime: 'automatic' }],
              ],
            },
          },
        },
        { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
        { test: /\.(png|jpg|jpeg|gif|svg)$/i, type: 'asset/resource' },
        // `?raw` query 가 붙은 import 는 파일 텍스트 그대로 반환.
        // t3mockup 의 *.jsx 소스를 LLM prompt 에 inline 첨부할 때 사용.
        { resourceQuery: /raw/, type: 'asset/source' },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        templateParameters: { apiBase },
      }),
      new webpack.DefinePlugin({
        'process.env.COMPOSER_API_BASE': JSON.stringify(apiBase),
        'process.env.INSIGHT_API_BASE': JSON.stringify(insightApiBase),
        'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      }),
      // _preview 격리 안전망 — 어떤 형태의 import / require 든 _preview 경로를 가리키면
      // 빈 모듈로 치환. 산출물 JSX 의 syntax error 나 부재 import 가 main bundle 컴파일에
      // 영향을 주는 모든 경로를 봉쇄.
      new webpack.IgnorePlugin({
        resourceRegExp: /[\\/]_preview[\\/]/,
      }),
    ],
    devServer: {
      historyApiFallback: true,
      port: 5173,
      host: '0.0.0.0',
      hot: true,
      client: {
        overlay: {
          // 컴파일 오류 오버레이는 유지 (개발 중 유용).
          errors: true,
          warnings: false,
          // ★ 런타임 오류 오버레이는 끈다.
          //   산출물 preview 는 iframe 안에서 메인 번들의 React 로 렌더되는데,
          //   React dev 모드는 ErrorBoundary 가 잡은 오류도 메인 window 로 다시 throw 한다.
          //   그러면 wds 오버레이가 전체 화면을 덮어 [화면 실행]·AI 자동보완 진행이
          //   보이지 않고 "멈춘 것처럼" 보인다. preview 오류는 PreviewEmbed 의
          //   ErrorBoundary + window 리스너가 잡아 자동보완 루프로 처리하므로
          //   오버레이로 막을 필요가 없다 (멈춤 현상의 근본 원인 — 2026-05-16).
          runtimeErrors: false,
        },
      },
      // 윈도우 host + Linux container 마운트에서는 inotify 가 cross-OS 로 동작하지 않아
      // src 변경 감지는 watchOptions.poll 로 처리한다.
      // public/ 정적 폴더(특히 t3mes-split 1460+ 파일)는 watch 를 끈다 —
      // usePolling 으로 매초 1460+ 파일을 스캔하면 dev-server 이벤트 루프가
      // 잠식되어 webpack-dev-middleware 가 번들을 0바이트로 끊어 보낸다.
      // (정적 카탈로그 HTML 은 라이브 리로드가 불필요)
      static: { watch: false },
      proxy: [
        {
          // SPA (Accept: text/html GET) 는 index.html 로 fallback,
          // 그 외 (XHR — Accept: application/json 등) 모든 요청은 backend 로 proxy.
          // 개별 prefix 화이트리스트 (/composer /auth /util /demandplan ...) 를 명시하지 않고
          // bypass 로 SPA route 만 분기 — 산출물이 만드는 모든 모듈 endpoint 자동 지원.
          context: () => true,
          target: apiBase,
          changeOrigin: true,
          secure: false,
          agent: noKeepAliveAgent,           // stale socket 회피 (backend 재시작 후 504 방지)
          proxyTimeout: 600_000,             // 10분 — Anthropic 호출 등 long-running 응답 수용
          timeout:      600_000,
          bypass: (req) => {
            const accept = req.headers.accept || '';
            // T3MES UI Pattern 카탈로그 정적 자산 (원본 /t3mes/ + 분리본 /t3mes-split/)
            //  — 항상 webpack-dev-server static 으로 처리 (proxy / SPA fallback 금지)
            if (req.url.startsWith('/t3mes/') || req.url.startsWith('/t3mes-split/')) {
              return req.url;
            }
            // SPA route — HTML GET 만 fallback
            if (req.method === 'GET' && accept.includes('text/html')) {
              return '/index.html';
            }
            // webpack-dev-server 자체 리소스 (정적 자산, hot-update 등) 는 proxy 하지 않음
            if (req.url.startsWith('/sockjs-node')
             || req.url.includes('hot-update')
             || req.url.endsWith('.js')
             || req.url.endsWith('.js.map')
             || req.url.endsWith('.css')
             || req.url.endsWith('.css.map')) {
              return req.url;
            }
            // public/ 정적 자산 (이미지·폰트 등) — webpack-dev-server static 으로 서빙
            // (proxy 로 backend 에 보내면 404 — 산출물·개념도 이미지 등이 안 보임)
            if (/\.(png|jpe?g|gif|svg|ico|webp|bmp|woff2?|ttf|eot)(\?.*)?$/i.test(req.url)) {
              return req.url;
            }
            return null;  // proxy 진행
          },
        },
      ],
    },
    devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',
    watchOptions: {
      poll: 1000,           // 1초 polling — docker mount 의 fs 변경 감지
      aggregateTimeout: 200,
      ignored: /node_modules/,
    },
  };
};
