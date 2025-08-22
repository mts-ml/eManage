import { CircleLoader } from "react-spinners"

export function Loading() {
  
  return (
    <div className="loading-fallback">
      <CircleLoader
        color="#10b981"
        loading={true}        
        size={60}
        aria-label="Loading Spinner"
        data-testid="loader"
      />

      <p className="loading-text">
        Carregando...
      </p>
    </div>
  )
}
