import { CircleLoader } from "react-spinners";


export function Loading() {
  return (
    <CircleLoader 
      color="#36d7b7"  // cor do spinner
      loading={true}   // controla se mostra ou não o spinner
      size={50}        // tamanho em pixels
      aria-label="Loading Spinner"
      data-testid="loader"
    />
  );
}
