import React from 'react';
import { Switch, Route, Redirect, Link } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';

import T3Composer from './view/util/t3composer/T3Composer';
import T3ComposerPatterns from './view/util/t3composerpatterns/T3ComposerPatterns';
import T3ComposerDict from './view/util/t3composerdict/T3ComposerDict';

/**
 * T3Composer 단독 환경 라우팅.
 * - /composer       → 메인 워크스페이스 (T3Composer.jsx)
 * - /patterns       → 화면 패턴 카탈로그
 * - /dict           → Composer Dictionary (Grid/Chart/KPI)
 */
export default function App() {
    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="static" color="default" elevation={1} sx={{ flex: '0 0 auto' }}>
                <Toolbar variant="dense" sx={{ minHeight: 40 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 4 }}>
                        T3Composer (Standalone)
                    </Typography>
                    <Button component={Link} to="/composer" size="small" color="inherit">메인</Button>
                    <Button component={Link} to="/patterns" size="small" color="inherit">패턴</Button>
                    <Button component={Link} to="/dict" size="small" color="inherit">사전</Button>
                </Toolbar>
            </AppBar>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Switch>
                    <Route exact path="/composer" component={T3Composer} />
                    <Route exact path="/patterns" component={T3ComposerPatterns} />
                    <Route exact path="/dict"     component={T3ComposerDict} />
                    <Route exact path="/"><Redirect to="/composer" /></Route>
                </Switch>
            </Box>
        </Box>
    );
}
