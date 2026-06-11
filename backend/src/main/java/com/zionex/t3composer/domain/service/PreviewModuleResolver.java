package com.zionex.t3composer.domain.service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Preview runtime 의 부재 import 해결.
 *
 * 산출물 JSX 가 import 한 spec (예: `@wingui/view/common/PopSelectItem`) 을
 * Target 별 wingui 의 실제 파일 경로로 매핑하고 raw text 를 반환한다.
 *
 * runtime 에서는 babel transform + 실행 + module 캐시.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PreviewModuleResolver {

    private static final List<String> EXTENSIONS = Arrays.asList(
            "", ".js", ".jsx", "/index.js", "/index.jsx"
    );

    /** CSS bundle 후보 — wingui 본 환경의 import 순서 그대로 concat (뒤 파일이 앞을 override).
     *  부재 파일은 skip.
     *  wingui index.js: realgrid-style.css 를 base 로 사용 (sky-blue 아님).
     *  ★ font-awesome all.min.css 를 realgrid-basic.css 앞에 둠 — realgrid-basic 의
     *    체크박스/체크마크가 'Font Awesome 5 Free' 의 \f0c8/\f14a glyph 를 사용. @font-face
     *    선언이 먼저 있어야 iframe 안에서 글리프가 렌더됨 (없으면 ☐/☒ unicode fallback). */
    private static final List<String> CSS_BUNDLE_PATHS = Arrays.asList(
            // font-awesome — RealGrid 의 체크박스/체크마크 글리프 (f0c8/f14a) 용.
            //   없어도 unicode fallback (☐/☒) 으로 동작은 하지만 룩이 어색해 유지.
            "src/main/webapp/js/font-awesome/css/all.min.css",
            // ★ RealGrid sky-blue 테마 (단독) — 헤더 옅은 파랑·zebra·border 톤.
            //   이전엔 realgrid-style.css (default 회색) + realgrid-basic.css + realgrid-custom.css
            //   를 함께 bundle 했는데, basic/custom 이 .rg-root / .rg-data-row 의 background 를
            //   #FFFFFF 로 override 해서 sky-blue 룩을 덮어버리는 사고가 있었다 (2026-06-11).
            //   sky-blue.css 는 RealGrid 의 self-contained theme — 단독으로 모든 .rg-* 룩 제공.
            //   wingui 의 custom CSS 는 t3series 본 환경의 추가 보강용이라 preview 에서는 제외.
            "packages/node_modules/realgrid/dist/realgrid-sky-blue.css",
            // 날짜 picker — InputField type=date/dateRange 의 캘린더 룩
            "packages/wingui/src/style/ReactDatePicker.css"
    );

    /** font-awesome all.min.css 의 `url(../webfonts/X.woff2)` 참조를 woff2 파일을 base64 로
     *  인코드한 data URL 로 치환 — iframe 안의 CSS 가 별도 HTTP 요청 없이 폰트를 로드.
     *  나머지 포맷 (eot/woff/ttf/svg) 의 url(...) 은 빈 문자열로 치환해 304 시도 회피
     *  (모든 모던 브라우저는 woff2 우선 사용). */
    private static final Pattern WEBFONT_URL =
            Pattern.compile("url\\(\\.\\./webfonts/([^)\"']+?\\.(woff2|woff|ttf|eot|svg))[^)]*\\)");

    private final TargetPathResolver pathResolver;

    public Resolved resolve(String spec, String targetCd) {
        if (spec == null || spec.isBlank()) return null;
        String winguiRoot = pathResolver.resolveWinguiPath(targetCd);
        Path base = Path.of(winguiRoot).toAbsolutePath().normalize();
        if (!Files.isDirectory(base)) return null;

        // spec → 후보 base-relative 경로(들). 첫 매칭 사용.
        List<String> candidates = candidatePaths(spec);
        for (String rel : candidates) {
            for (String ext : EXTENSIONS) {
                Path p = base.resolve(rel + ext).normalize();
                if (!p.startsWith(base)) continue;       // path traversal 방어
                if (Files.isRegularFile(p)) {
                    try {
                        String text = Files.readString(p, StandardCharsets.UTF_8);
                        String relStr = base.relativize(p).toString().replace('\\', '/');
                        return new Resolved(text, relStr);
                    } catch (Exception e) {
                        log.warn("preview module 읽기 실패 {} — {}", p, e.getMessage());
                    }
                }
            }
        }
        return null;
    }

    /** spec → wingui base 기준 후보 상대경로 (확장자 없이). */
    private List<String> candidatePaths(String spec) {
        // @wingui/X/Y/Z   →   packages/wingui/src/X/Y/Z
        if (spec.startsWith("@wingui/")) {
            String rest = spec.substring("@wingui/".length());
            return List.of(
                    "packages/wingui/src/" + rest,
                    // monorepo 형태가 다를 수 있는 케이스 대비
                    "packages/wingui/" + rest
            );
        }
        // @zionex/wingui-core[/X]   →   packages/wingui-core[/X]
        if (spec.equals("@zionex/wingui-core")) {
            return List.of(
                    "packages/wingui-core/index",
                    "packages/wingui-core"
            );
        }
        if (spec.startsWith("@zionex/wingui-core/")) {
            String rest = spec.substring("@zionex/wingui-core/".length());
            return List.of(
                    "packages/wingui-core/" + rest
            );
        }
        // 마운트 root 상대 경로로 추정되는 spec — 그대로 시도
        return List.of(spec);
    }

    /**
     * realgrid UMD bundle (node_modules/realgrid/dist/main.js) raw text 반환.
     * PreviewEmbed iframe 안에서 RealGrid 를 별도 instance 로 로드하기 위함 — main bundle 의
     * RealGrid module 과 cross-document issue 회피.
     *
     * 위치는 winguiRoot 기준 packages/node_modules 또는 host frontend 의 node_modules.
     * Target 폴더에 wingui-side node_modules 가 있으면 그것 우선, 없으면 frontend 컨테이너의 것.
     */
    public Resolved resolveRealgridUmd(String targetCd) {
        String winguiRoot = pathResolver.resolveWinguiPath(targetCd);
        // 후보 경로 — Target 별 wingui 안 그리고 frontend container 의 것
        List<Path> candidates = Arrays.asList(
                Path.of(winguiRoot, "packages", "node_modules", "realgrid", "dist", "main.js"),
                Path.of(winguiRoot, "node_modules", "realgrid", "dist", "main.js"),
                Path.of("/app", "node_modules", "realgrid", "dist", "main.js")
        );
        for (Path p : candidates) {
            if (Files.isRegularFile(p)) {
                try {
                    String text = Files.readString(p, StandardCharsets.UTF_8);
                    return new Resolved(text, p.toString());
                } catch (Exception e) {
                    log.warn("realgrid UMD 읽기 실패 {} — {}", p, e.getMessage());
                }
            }
        }
        return null;
    }

    /**
     * Target 의 wingui CSS 들을 정해진 순서로 concat 해서 반환.
     * iframe 격리된 PreviewEmbed 에 inject 하기 위한 단일 텍스트.
     */
    public String bundleCss(String targetCd) {
        String winguiRoot = pathResolver.resolveWinguiPath(targetCd);
        if (winguiRoot == null || winguiRoot.isBlank()) {
            log.warn("bundleCss: winguiRoot 미해석 (targetCd={}) — 빈 CSS 반환. "
                  + "프런트에서 targetCd 누락 또는 Target 의 wingui 경로 미설정.", targetCd);
            return "";
        }
        Path base = Path.of(winguiRoot).toAbsolutePath().normalize();
        if (!Files.isDirectory(base)) return "";

        StringBuilder sb = new StringBuilder();
        for (String rel : CSS_BUNDLE_PATHS) {
            Path p = base.resolve(rel).normalize();
            if (!p.startsWith(base)) continue;
            if (!Files.isRegularFile(p)) continue;
            try {
                String text = Files.readString(p, StandardCharsets.UTF_8);
                if (rel.endsWith("/all.min.css")) {
                    // FA all.min.css 의 webfont URL → base64 data URL (woff2 만 인라인, 나머지 제거)
                    text = inlineWebfontUrls(text, p.getParent());
                }
                sb.append("/* === ").append(rel).append(" === */\n");
                sb.append(text);
                if (!text.endsWith("\n")) sb.append('\n');
                sb.append('\n');
            } catch (Exception e) {
                log.warn("preview CSS 읽기 실패 {} — {}", p, e.getMessage());
            }
        }
        return sb.toString();
    }

    /** all.min.css 안의 `url(../webfonts/X.woff2)` 를 woff2 base64 data URL 로 치환.
     *  woff2 외 포맷 url 은 빈 url 로 치환 (브라우저가 시도하지 않도록).
     *  cssDir 는 all.min.css 가 있는 디렉토리 (../webfonts 의 기준). */
    private String inlineWebfontUrls(String css, Path cssDir) {
        Matcher m = WEBFONT_URL.matcher(css);
        StringBuilder out = new StringBuilder(css.length() + 200_000);
        while (m.find()) {
            String fileName = m.group(1);   // 예: "fa-regular-400.woff2"
            String fmt = m.group(2);
            String replacement;
            if ("woff2".equalsIgnoreCase(fmt)) {
                Path fontPath = cssDir.resolve("../webfonts/" + fileName).normalize();
                if (Files.isRegularFile(fontPath)) {
                    try {
                        byte[] bytes = Files.readAllBytes(fontPath);
                        String b64 = Base64.getEncoder().encodeToString(bytes);
                        replacement = "url(data:font/woff2;base64," + b64 + ")";
                    } catch (Exception e) {
                        log.warn("webfont 읽기 실패 {} — {}", fontPath, e.getMessage());
                        replacement = "url(about:blank)";
                    }
                } else {
                    log.warn("webfont 없음 {} — iframe checkbox 글리프 fallback 가능", fontPath);
                    replacement = "url(about:blank)";
                }
            } else {
                // eot/woff/ttf/svg — woff2 가 인라인되어 있으므로 시도 자체를 차단
                replacement = "url(about:blank)";
            }
            m.appendReplacement(out, Matcher.quoteReplacement(replacement));
        }
        m.appendTail(out);
        return out.toString();
    }

    /** 결과 — raw text + 매칭된 wingui base-relative 경로 (디버깅용 헤더에 사용). */
    public record Resolved(String source, String relativePath) {}
}
