import { CircleLoader } from "react-spinners";


export function Loading() {

  return (
    <div className="loading-critical">
      <CircleLoader
        color="#10b981"
        loading={true}
        size={60}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
      <p className="loading-text">
        Loading...
      </p>
    </div>
  )
}
