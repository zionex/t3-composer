import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Checkbox, IconButton, InputAdornment } from '@mui/material';

import t3ComposerUnion from '../../../assets/T3Composer_union.svg';
import t3ComposerWordmark from '../../../assets/T3Composer_logo_w.svg';
import iconEyeOn from '../../../assets/icons/eye-on.svg';
import iconEyeOff from '../../../assets/icons/eye-off.svg';
import iconCheckOn from '../../../assets/icons/_check-box-on-fill.svg';
import iconCheckOff from '../../../assets/icons/_check-box-off-line.svg';
import iconPerManagement from '../../../assets/icons/per-management.svg';
import SvgIcon from '../../../style/SvgIcon';
import { PALETTE } from '../../../theme';
import { FONT_FAMILY } from '../../../style/typography';
import { atomicColors } from '../../../style/atomicColors';

const AQ = atomicColors.color.aqua;
const DANGER_BORDER = '#FF6365';
const DANGER_TEXT   = '#FF4649';

// 우측 배경 — Figma 원본 radial gradient SVG 그대로
const RIGHT_BG_SVG =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 960 1080' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'>" +
  "<rect x='0' y='0' height='100%25' width='100%25' fill='url(%23grad)' opacity='1'/>" +
  "<defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' " +
  "gradientTransform='matrix(0.0000074378 -127.6 183.89 0.000010719 480 1242)'>" +
  "<stop stop-color='rgba(10,136,171,1)' offset='0'/>" +
  "<stop stop-color='rgba(24,150,182,1)' offset='0.125'/>" +
  "<stop stop-color='rgba(38,163,193,1)' offset='0.25'/>" +
  "<stop stop-color='rgba(66,190,214,1)' offset='0.5'/>" +
  "<stop stop-color='rgba(110,206,224,1)' offset='0.625'/>" +
  "<stop stop-color='rgba(154,221,234,1)' offset='0.75'/>" +
  "<stop stop-color='rgba(198,237,243,1)' offset='0.875'/>" +
  "<stop stop-color='rgba(242,252,253,1)' offset='1'/>" +
  "</radialGradient></defs></svg>\")";

/**
 * Login 화면
 */
export default function Login({ onPass }) {
    const [key, setKey] = useState('');
    // TODO: '인증키 기억' 초기값 — 저장소(localStorage 등)에서 이전 선택 복원.
    const [remember, setRemember] = useState(true);
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState('');

    const submit = (e) => {
        e?.preventDefault?.();
        const trimmed = key.trim();
        if (!trimmed) {
            setError('인증키를 입력해 주세요.');
            return;
        }
        // TODO: 인증키 검증 로직을 여기에 삽입.
        //   - 검증 실패 시:   setError('발급받은 인증키를 다시 확인해주세요.'); return;
        //   - 검증 성공 시:   아래 onPass 호출을 그대로 진행 (remember 값에 따라 저장 여부 결정)
        setError('');
        // TODO: remember=true 면 통과 키를 저장소(localStorage 등)에 보관하는 처리는
        //   호출측(App.jsx Root)에서 수행. 여기서는 값과 옵션만 전달.
        onPass?.(trimmed, { remember });
    };

    return (
        <Box sx={{ display: 'flex', width: '100%', height: '100vh', minHeight: 0 }}>
            {/* ===== 좌측 — 로그인 폼 ===== */}
            <Box
                sx={{
                    flex: 1, minWidth: 0,
                    bgcolor: '#FFFFFF',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center',
                    pt: '60px', pb: '32px',
                }}
            >
                <Box sx={{
                    flex: 1, minHeight: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '40px',
                }}>
                    <Box
                        component="form"
                        onSubmit={submit}
                        sx={{
                            width: 360,
                            display: 'flex', flexDirection: 'column',
                            gap: '20px', pb: '24px',
                        }}
                    >
                        {/* Logo */}
                        <Box sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '12px', pb: '24px',
                        }}>
                            <Box sx={{
                                width: 32, height: 32, flexShrink: 0,
                                bgcolor: AQ[50],
                                borderRadius: '6px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <SvgIcon src={t3ComposerUnion} size={13} color="#FFFFFF" alt="T³Composer" />
                            </Box>
                            <SvgIcon
                                src={t3ComposerWordmark}
                                color="#000000"
                                alt="T³Composer"
                                style={{ width: 176, height: 26, marginTop: 4 }}
                            />
                        </Box>

                        {/* 인증키 InputField */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                            <TextField
                                type={showKey ? 'text' : 'password'}
                                value={key}
                                onChange={(e) => { setKey(e.target.value); if (error) setError(''); }}
                                label="인증키"
                                placeholder="인증키 입력"
                                variant="outlined"
                                size="small"
                                fullWidth
                                autoFocus
                                error={!!error}
                                InputLabelProps={{
                                    shrink: true,
                                    sx: {
                                        fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 500,
                                        color: '#000000',
                                        '&.Mui-focused': { color: '#000000' },
                                        '&.Mui-error':   { color: '#000000' },
                                    },
                                }}
                                InputProps={{
                                    sx: {
                                        height: 42,
                                        fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: 500,
                                        borderRadius: '8px',
                                        pl: '16px', pr: '16px',
                                        '& .MuiOutlinedInput-input':           { pl: 0, pr: 0 },
                                        '& fieldset':                            { borderColor: '#DDDDDD', borderWidth: '1px' },
                                        '&:hover fieldset':                      { borderColor: AQ[50] },
                                        '&.Mui-focused fieldset':                { borderColor: AQ[50], borderWidth: '1px' },
                                        '&&.Mui-error fieldset':                 { borderColor: DANGER_BORDER, borderWidth: '1px' },
                                        '&&.Mui-error:hover fieldset':           { borderColor: DANGER_BORDER, borderWidth: '1px' },
                                        '&&.Mui-error.Mui-focused fieldset':     { borderColor: DANGER_BORDER, borderWidth: '1px' },
                                        '&:has(input:-webkit-autofill)': {
                                            backgroundColor: AQ[95],
                                        },
                                        '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                                            WebkitBoxShadow: `0 0 0 1000px ${AQ[95]} inset`,
                                            WebkitTextFillColor: '#000000',
                                            caretColor: '#000000',
                                            borderRadius: 'inherit',
                                            transition: 'background-color 5000s ease-in-out 0s',
                                        },
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end" sx={{ ml: '8px', mr: 0 }}>
                                            <IconButton
                                                aria-label={showKey ? '인증키 표시' : '인증키 숨김'}
                                                onClick={() => setShowKey((s) => !s)}
                                                sx={{ p: 0 }}
                                            >
                                                <SvgIcon
                                                    src={showKey ? iconEyeOn : iconEyeOff}
                                                    size={20}
                                                    color={PALETTE.textSecondary}
                                                    alt=""
                                                />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {error && (
                                <Typography sx={{
                                    fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 500, lineHeight: 'normal',
                                    color: DANGER_TEXT,
                                }}>
                                    {error}
                                </Typography>
                            )}
                        </Box>

                        {/* 인증키로 로그인 버튼 */}
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={
                                <SvgIcon
                                    src={iconPerManagement}
                                    size={18}
                                    color="#FFFFFF"
                                    alt=""
                                />
                            }
                            sx={{
                                height: 42,
                                bgcolor: AQ[50],
                                color: '#FFFFFF',
                                borderRadius: '8px',
                                fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: 600, lineHeight: '20px',
                                textTransform: 'none',
                                boxShadow: '0 0 4px 0 rgba(15, 168, 204, 0.04), 0 8px 16px 0 rgba(15, 168, 204, 0.12)',
                                '& .MuiButton-startIcon': { mr: '4px', ml: 0 },
                                '&:hover': {
                                    bgcolor: AQ[40],
                                    boxShadow: '0 0 4px 0 rgba(15, 168, 204, 0.08), 0 8px 16px 0 rgba(15, 168, 204, 0.20)',
                                },
                                '&:active':  { bgcolor: AQ[30] },
                            }}
                        >
                            인증키로 로그인
                        </Button>

                        {/* 인증키 기억 체크박스 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Checkbox
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                icon={
                                    <SvgIcon src={iconCheckOff} size={20} color={PALETTE.textMuted} alt="" />
                                }
                                checkedIcon={
                                    <SvgIcon src={iconCheckOn} size={20} color={AQ[50]} alt="" />
                                }
                                sx={{ p: 0 }}
                            />
                            <Typography
                                onClick={() => setRemember((v) => !v)}
                                sx={{
                                    fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 500, lineHeight: '16px',
                                    color: PALETTE.textPrimary,
                                    cursor: 'pointer', userSelect: 'none',
                                }}
                            >
                                인증키 기억
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* 하단 저작권 */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Typography sx={{
                        fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 400, lineHeight: '14px',
                        color: '#888888',
                    }}>
                        © 2026 ZIONEX Inc. All rights reserved
                    </Typography>
                </Box>
            </Box>

            {/* ===== 우측 — Aqua radial gradient ===== */}
            <Box
                aria-hidden
                sx={{
                    flex: 1, minWidth: 0,
                    backgroundImage: RIGHT_BG_SVG,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            />
        </Box>
    );
}
