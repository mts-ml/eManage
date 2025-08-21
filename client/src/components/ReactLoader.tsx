import { CircleLoader } from "react-spinners";

export function Loading() {
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #fafdf9 0%, #f8fdfa 50%, #f0fdf4 100%)'
    }}>
      <CircleLoader
        color="#10b981"
        loading={true}        
        size={60}
        aria-label="Loading Spinner"
        data-testid="loader"
      />

      <p style={{
        fontWeight: '500',
        color: '#10b981',
        marginTop: '8px',
        fontSize: '16px'
      }}>
        Loading...
      </p>
    </div>
  )
}
