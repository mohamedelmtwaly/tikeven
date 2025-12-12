export default function Spinner({size, color, padding}: {size?: string, color?: string, padding?:string}) {
  return (
    <div className={`flex justify-center items-center ${padding ?? "py-8"}`}>

      <div className={` animate-spin ${ size ?? "h-8 w-8" } border-2 ${ color ?? "border-primary-600"} border-t-transparent rounded-full `}></div>
    </div>
  );
}
