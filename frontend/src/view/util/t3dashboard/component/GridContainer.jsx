import React from 'react';
import { Box } from '@mui/material';

/**
 * 
 mui의 Grid 콤포넌트를 대체한다.
 */
export const GridContainer = ({ children, spacing = 2, columns = 12, ...props }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: spacing,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export const GridItem = ({ children, xs = 12, md = 6, ...props }) => {
  const getColumnSpan = (size) => `span ${Math.floor((size / 12) * 12)}`;
  
  return (
    <Box
      sx={{
        gridColumn: {
          xs: getColumnSpan(xs),
          md: getColumnSpan(md),
        },
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
