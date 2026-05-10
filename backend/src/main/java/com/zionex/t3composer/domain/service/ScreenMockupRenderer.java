package com.zionex.t3composer.domain.service;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import javax.imageio.ImageIO;

/**
 * 화면 spec (검색조건 fields + 그리드 columns) 으로부터 mock-up PNG 이미지를 생성.
 * 부모 wingui 의 SearchArea (라벨박스+입력박스) + RealGrid2 (헤더+격자) 시각을 단순 모방.
 *
 * 사용처 — 설계서 (.xlsx) 의 "레이아웃" 시트 하단에 image 로 첨부.
 */
public class ScreenMockupRenderer {

    // ── 색상 ─────────────────────────────────────────
    private static final Color BG_PAGE   = new Color(0xFA, 0xFA, 0xFA);
    private static final Color BG_SEARCH = new Color(0xF4, 0xF6, 0xF8);
    private static final Color BORDER    = new Color(0xE0, 0xE0, 0xE0);
    private static final Color LABEL_BG  = new Color(0xEE, 0xF1, 0xF5);
    private static final Color LABEL_FG  = new Color(0x33, 0x41, 0x55);
    private static final Color INPUT_BG  = Color.WHITE;
    private static final Color BTN_BG    = new Color(0x3B, 0x82, 0xF6);
    private static final Color BTN_FG    = Color.WHITE;
    private static final Color GRID_HEAD_BG = new Color(0xE8, 0xEE, 0xF6);
    private static final Color GRID_HEAD_FG = new Color(0x33, 0x41, 0x55);
    private static final Color GRID_LINE = new Color(0xCF, 0xD6, 0xE0);
    private static final Color GRID_ALT  = new Color(0xF8, 0xFA, 0xFC);
    private static final Color TEXT_DIM  = new Color(0x94, 0xA3, 0xB8);

    // ── 치수 ─────────────────────────────────────────
    private static final int W            = 960;
    private static final int PAD          = 12;
    private static final int SEARCH_PAD   = 8;
    private static final int FIELD_H      = 28;
    private static final int FIELD_GAP    = 6;
    private static final int LABEL_W      = 78;
    private static final int INPUT_W      = 170;
    private static final int FIELD_W      = LABEL_W + INPUT_W;
    private static final int BTN_W        = 76;
    private static final int GRID_HEADER_H = 30;
    private static final int GRID_ROW_H   = 26;
    private static final int GRID_ROWS    = 8;
    private static final int TITLE_H      = 22;

    /**
     * 캡션 mock-up image — width 960px, height 가변.
     *
     * @param title         화면 제목 (예: "사용자정보 관리")
     * @param searchLabels  검색조건 label 목록 (왼쪽부터 순서대로)
     * @param gridHeaders   그리드 컬럼 headerText 목록 (왼쪽부터 순서대로)
     * @return PNG bytes
     */
    public static byte[] render(String title, List<String> searchLabels, List<String> gridHeaders) {
        // 1) 검색 영역 행 수 계산 — 한 행에 들어갈 수 있는 field 수 + 마지막 [조회] 버튼 분
        int innerW = W - PAD * 2 - SEARCH_PAD * 2;
        int fieldsPerRow = Math.max(1, (innerW - BTN_W) / (FIELD_W + FIELD_GAP));
        int searchN = (searchLabels == null) ? 0 : searchLabels.size();
        int searchRows = (searchN == 0) ? 1 : (int) Math.ceil((double) searchN / fieldsPerRow);
        int searchAreaH = SEARCH_PAD * 2 + searchRows * FIELD_H + (searchRows - 1) * FIELD_GAP;

        // 2) 그리드 영역 — 헤더 + GRID_ROWS 행
        int gridH = GRID_HEADER_H + GRID_ROWS * GRID_ROW_H;

        int H = PAD + TITLE_H + 6 + searchAreaH + 8 + gridH + PAD;

        BufferedImage img = new BufferedImage(W, H, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            // 배경
            g.setColor(BG_PAGE);
            g.fillRect(0, 0, W, H);

            int y = PAD;

            // 제목
            g.setColor(new Color(0x0F, 0x17, 0x2A));
            g.setFont(cjkFont(Font.BOLD, 14));
            g.drawString(safe(title, "(화면 제목)"), PAD, y + 16);
            y += TITLE_H + 6;

            // ── SearchArea ───────────────────────────────────
            int saX = PAD, saY = y, saW = W - PAD * 2;
            g.setColor(BG_SEARCH);
            g.fillRect(saX, saY, saW, searchAreaH);
            g.setColor(BORDER);
            g.drawRect(saX, saY, saW - 1, searchAreaH - 1);

            // 검색 fields
            int fx = saX + SEARCH_PAD;
            int fy = saY + SEARCH_PAD;
            int colInRow = 0;
            for (int i = 0; i < searchN; i++) {
                String label = searchLabels.get(i);
                drawField(g, fx, fy, label);
                fx += FIELD_W + FIELD_GAP;
                colInRow++;
                if (colInRow >= fieldsPerRow) {
                    colInRow = 0;
                    fx = saX + SEARCH_PAD;
                    fy += FIELD_H + FIELD_GAP;
                }
            }
            // 우측 끝 [조회] 버튼 (첫 행 우측에 고정)
            int btnX = saX + saW - SEARCH_PAD - BTN_W;
            int btnY = saY + SEARCH_PAD;
            g.setColor(BTN_BG);
            g.fillRoundRect(btnX, btnY, BTN_W, FIELD_H, 4, 4);
            g.setColor(BTN_FG);
            g.setFont(cjkFont(Font.BOLD, 11));
            String btnText = "🔍 조회";
            int btnTextW = g.getFontMetrics().stringWidth(btnText);
            g.drawString(btnText, btnX + (BTN_W - btnTextW) / 2, btnY + 18);

            y = saY + searchAreaH + 8;

            // ── BaseGrid ─────────────────────────────────────
            int gx = PAD, gy = y, gw = W - PAD * 2;
            g.setColor(Color.WHITE);
            g.fillRect(gx, gy, gw, gridH);
            g.setColor(BORDER);
            g.drawRect(gx, gy, gw - 1, gridH - 1);

            // 헤더
            g.setColor(GRID_HEAD_BG);
            g.fillRect(gx + 1, gy + 1, gw - 2, GRID_HEADER_H - 1);

            int colCount = (gridHeaders == null || gridHeaders.isEmpty()) ? 6 : Math.min(gridHeaders.size(), 8);
            int colW = (gw - 2) / Math.max(1, colCount);
            g.setFont(cjkFont(Font.BOLD, 11));
            g.setColor(GRID_HEAD_FG);
            for (int c = 0; c < colCount; c++) {
                String h = (gridHeaders != null && c < gridHeaders.size()) ? gridHeaders.get(c) : "컬럼 " + (c + 1);
                int cx = gx + 1 + c * colW;
                g.drawString(truncate(h, colW - 8, g), cx + 6, gy + 20);
                if (c > 0) {
                    g.setColor(GRID_LINE);
                    g.drawLine(cx, gy + 1, cx, gy + GRID_HEADER_H - 1);
                    g.setColor(GRID_HEAD_FG);
                }
            }
            // 헤더 아래 강조선
            g.setColor(GRID_LINE);
            g.drawLine(gx, gy + GRID_HEADER_H, gx + gw, gy + GRID_HEADER_H);

            // 데이터 행 (placeholder)
            for (int r = 0; r < GRID_ROWS; r++) {
                int ry = gy + GRID_HEADER_H + r * GRID_ROW_H;
                if (r % 2 == 1) {
                    g.setColor(GRID_ALT);
                    g.fillRect(gx + 1, ry, gw - 2, GRID_ROW_H);
                }
                g.setColor(GRID_LINE);
                g.drawLine(gx + 1, ry + GRID_ROW_H, gx + gw - 1, ry + GRID_ROW_H);
                for (int c = 1; c < colCount; c++) {
                    int cx = gx + 1 + c * colW;
                    g.drawLine(cx, ry, cx, ry + GRID_ROW_H);
                }
            }
            // 빈 데이터 안내
            g.setColor(TEXT_DIM);
            g.setFont(cjkFont(Font.PLAIN, 11));
            String msg = "(데이터 영역 — 실제 운영시 RealGrid2 로 렌더링)";
            int msgW = g.getFontMetrics().stringWidth(msg);
            g.drawString(msg, gx + (gw - msgW) / 2, gy + GRID_HEADER_H + (GRID_ROWS * GRID_ROW_H) / 2 + 4);

        } finally {
            g.dispose();
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            return new byte[0];
        }
    }

    /** 단일 필드 박스 (좌측 라벨 + 우측 입력) — wingui InputField wrapBox 모방 */
    private static void drawField(Graphics2D g, int x, int y, String label) {
        // 입력 박스 배경
        g.setColor(INPUT_BG);
        g.fillRoundRect(x, y, FIELD_W, FIELD_H, 4, 4);
        // 라벨 박스 배경
        g.setColor(LABEL_BG);
        g.fillRoundRect(x, y, LABEL_W, FIELD_H, 4, 4);
        g.fillRect(x + LABEL_W - 8, y, 8, FIELD_H);  // 라벨 우측 직각 마무리
        // 외곽 border
        g.setColor(BORDER);
        g.drawRoundRect(x, y, FIELD_W, FIELD_H, 4, 4);
        // 라벨/입력 사이 분리선
        g.drawLine(x + LABEL_W, y + 1, x + LABEL_W, y + FIELD_H - 1);
        // 라벨 텍스트
        g.setColor(LABEL_FG);
        g.setFont(cjkFont(Font.BOLD, 11));
        g.drawString(truncate(label == null ? "" : label, LABEL_W - 8, g), x + 6, y + 18);
    }

    private static String truncate(String s, int maxPx, Graphics2D g) {
        if (s == null) return "";
        if (g.getFontMetrics().stringWidth(s) <= maxPx) return s;
        String t = s;
        while (t.length() > 1 && g.getFontMetrics().stringWidth(t + "…") > maxPx) {
            t = t.substring(0, t.length() - 1);
        }
        return t + "…";
    }

    private static String safe(String s, String def) {
        return (s == null || s.isBlank()) ? def : s;
    }

    // ── 한글 fallback 폰트 자동 선택 (caching) ─────────────────────
    // Linux 컨테이너에 fonts-noto-cjk 설치된 경우 자동 매칭. 실패 시 logical Sans-Serif.
    private static volatile String CJK_FAMILY = null;

    private static String resolveCjkFamily() {
        if (CJK_FAMILY != null) return CJK_FAMILY;
        String[] candidates = {
            "Noto Sans CJK KR", "Noto Sans KR", "NanumGothic",
            "Malgun Gothic", "AppleGothic",
            "Noto Sans CJK SC", "Noto Sans CJK JP", "Noto Sans CJK TC",
            "Noto Sans", Font.SANS_SERIF
        };
        for (String name : candidates) {
            Font f = new Font(name, Font.PLAIN, 12);
            // 한글 '가' 글리프가 표시 가능한 첫 폰트 선택
            if (f.canDisplay('가')) {
                CJK_FAMILY = name;
                return name;
            }
        }
        CJK_FAMILY = Font.SANS_SERIF;
        return CJK_FAMILY;
    }

    private static Font cjkFont(int style, int size) {
        return new Font(resolveCjkFamily(), style, size);
    }
}
