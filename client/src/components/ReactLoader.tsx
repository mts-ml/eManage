import { CircleLoader } from "react-spinners";


export function Loading() {

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <CircleLoader
        color="#10b981"
        loading={true}        
        size={60}
        aria-label="Loading Spinner"
        data-testid="loader"
      />

      <p className="font-medium text-[#10b981] mt-2">
        Loading...
      </p>
    </div>
  )
}
