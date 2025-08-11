import { CircleLoader } from "react-spinners";

export function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <CircleLoader 
        color="#10b981"  // cor verde esmeralda
        loading={true}
        size={60}        // tamanho maior
        aria-label="Loading Spinner"
        data-testid="loader"
      />
      <p className="text-black font-medium text-lg tracking-wide">
        Loading...
      </p>
    </div>
  )
}
