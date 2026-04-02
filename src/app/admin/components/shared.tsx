export const inputStyle = {
  padding: '0.7rem 1rem', 
  background: 'rgba(15, 22, 40, 0.5)', 
  border: '1px solid var(--border-subtle)',
  borderRadius: '6px', 
  color: 'var(--text-primary)', 
  fontSize: '0.9rem', 
  fontFamily: 'inherit', 
  width: '100%'
};

export const rowStyle = {
  padding: '1rem 1.5rem', 
  background: 'rgba(15, 22, 40, 0.3)', 
  borderRadius: '8px',
  display: 'flex' as const, 
  justifyContent: 'space-between' as const, 
  alignItems: 'center' as const, 
  flexWrap: 'wrap' as const, 
  gap: '0.5rem'
};
