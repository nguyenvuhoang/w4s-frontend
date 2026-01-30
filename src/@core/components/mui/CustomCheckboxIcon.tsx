export const CustomCheckboxIcon = ({ checked, header }: { checked: boolean; header?: boolean }) => (
  <svg className="MuiSvgIcon-root" width="18" height="18" viewBox="0 0 24 24" style={{ display: 'inline-block' }}>
    <rect x="2" y="2" width="20" height="20" rx="4" ry="4"
      fill={checked ? '#225087' : 'transparent'}
      stroke={header ? '#fff' : '#225087'} strokeWidth="2" />
    {checked && (
      <polyline points="6,12 10,16 18,6" fill="none" stroke="#fff"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);
