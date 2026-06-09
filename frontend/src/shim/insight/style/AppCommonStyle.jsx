// =============================================================================
// @insight/style/AppCommonStyle — shim for t3dashboard
// =============================================================================

import { makeStyles, createStyles } from '@mui/styles';

export const useDataGridStyle = makeStyles((theme) =>
  createStyles({
    container: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      paddingRight: '5px',
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      height: '56px',
      gap: 2,
      marginBottom: 1,
    },
    downloadBtn: {
      backgroundColor: theme.palette.mode === 'dark' ? '#444444' : '#F8F8F8',
      color: theme.palette.mode === 'dark' ? '#FFFFFF' : '#555555',
      border: theme.palette.mode === 'dark' ? '1px solid #555555' : '1px solid #DDDDDD',
      textTransform: 'none',
      borderRadius: '4px',
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? '#555555' : '#E8E8E8',
        boxShadow: 'none',
      },
      fontSize: '13px',
      padding: '4px 10px',
      minHeight: '28px',
      minWidth: 'auto',
    },
    totalText: {
      marginLeft: 1,
      color: theme.palette.text.primary,
    },
    selectControl: {
      minWidth: 80,
      '& .MuiOutlinedInput-root': {
        color: theme.palette.text.primary,
        '& fieldset': {
          borderColor: theme.palette.dataGrid?.inputBorder || (theme.palette.mode === 'dark' ? '#555555' : '#DDDDDD'),
        },
        '&:hover fieldset': {
          borderColor: theme.palette.dataGrid?.inputBorderHover || (theme.palette.mode === 'dark' ? '#777777' : '#BBBBBB'),
        },
      },
    },
    searchField: {
      marginLeft: 'auto',
      width: 200,
      '& .MuiOutlinedInput-root': {
        color: theme.palette.text.primary,
        '& fieldset': {
          borderColor: theme.palette.dataGrid?.inputBorder || (theme.palette.mode === 'dark' ? '#555555' : '#DDDDDD'),
        },
        '&:hover fieldset': {
          borderColor: theme.palette.dataGrid?.inputBorderHover || (theme.palette.mode === 'dark' ? '#777777' : '#BBBBBB'),
        },
        '&.Mui-focused fieldset': {
          borderColor: theme.palette.primary.main,
        },
      },
      '& .MuiInputBase-input::placeholder': {
        color: theme.palette.text.secondary,
        opacity: 1,
      },
    },
    tableContainer: {
      flex: 1,
      minWidth: 100,
      width: '100% !important',
      overflow: 'auto',
      backgroundColor: theme.palette.background.paper,
      '& .MuiTableCell-root': {
        borderBottom: `1px solid ${theme.palette.dataGrid?.border || (theme.palette.mode === 'dark' ? '#404040' : 'rgba(224, 224, 224, 1)')}`,
        padding: '4px 8px',
        color: theme.palette.dataGrid?.rowText || theme.palette.text.primary,
      },
    },
    table: {
      minWidth: '100%',
      width: 'max-content',
    },
    tableHead: {
      position: 'sticky',
      top: 0,
      zIndex: 1,
    },
    tableHeaderRow: {
      height: '35px',
    },
    tableHeaderCell: {
      fontWeight: 'bold',
      backgroundColor: theme.palette.dataGrid?.headerBg || (theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5'),
      color: theme.palette.dataGrid?.headerText || theme.palette.text.primary,
      height: '35px',
    },
    tableSortLabel: {
      '&.Mui-active': {
        color: theme.palette.primary.main,
      },
    },
    tableBodyRow: {
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
    tableBodyCell: {
      color: theme.palette.dataGrid?.rowText || theme.palette.text.primary,
    },
    pagination: {
      '& .MuiPaginationItem-root': {
        color: theme.palette.text.primary,
      },
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      paddingTop: '8px',
      paddingRight: '5px',
    },
    footerText: {
      color: theme.palette.text.secondary,
    },
  })
);

export default {
  useDataGridStyle,
};
