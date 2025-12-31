// ⚙️ Style dùng chung
export const actionButtonSx = {
    textTransform: 'none',
    borderWidth: 1.5,
    '&:hover': {
        borderWidth: 1.5,
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    '&.Mui-disabled': {
        opacity: 0.7,
    },
    '& .MuiButton-startIcon': {
        marginRight: 1,
        '& > *:first-of-type': { fontSize: 18 }
    },
    '&:focus-visible': {
        outline: '2px solid rgba(0,0,0,0.25)',
        outlineOffset: 1
    }
}

// 🎨 Màu riêng từng loại
export const actionButtonColors = {
    primary: {
        color: '#225087',
        borderColor: '#225087',
        '&:hover': {
            borderColor: '#0a7a43',
            backgroundColor: 'rgba(12,145,80,0.04)'
        },
        '&.Mui-disabled': {
            color: 'rgba(12,145,80,0.6)',
            borderColor: 'rgba(12,145,80,0.4)'
        }
    },
    info: {
        color: '#1876d1',
        borderColor: '#1876d1',
        '&:hover': {
            borderColor: '#145ea5',
            backgroundColor: 'rgba(24,118,209,0.04)'
        },
        '&.Mui-disabled': {
            color: 'rgba(24,118,209,0.6)',
            borderColor: 'rgba(24,118,209,0.4)'
        }
    },
    warning: {
        color: '#f0a000',
        borderColor: '#f0a000',
        '&:hover': {
            borderColor: '#cc8600',
            backgroundColor: 'rgba(240,160,0,0.04)'
        },
        '&.Mui-disabled': {
            color: 'rgba(240,160,0,0.6)',
            borderColor: 'rgba(240,160,0,0.4)'
        }
    },
    error: {
        color: '#d33',
        borderColor: '#d33',
        '&:hover': {
            borderColor: '#a00',
            backgroundColor: 'rgba(211,51,51,0.04)'
        },
        '&.Mui-disabled': {
            color: 'rgba(211,51,51,0.6)',
            borderColor: 'rgba(211,51,51,0.4)'
        }
    }
}
