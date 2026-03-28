import { GiStrawberry } from "react-icons/gi";

const FresaLoader = ({
  fullScreen = true,
  title = "Preparando tu antojo...",
  subtitle = "Cargando datos del sistema"
}) => {
  const wrapperClass = fullScreen
    ? "fixed inset-0 z-[9999]"
    : "absolute inset-0 z-40";

  return (
    <div className={`${wrapperClass} flex items-center justify-center bg-gradient-to-br from-pink-100/95 via-white/95 to-rose-100/95 backdrop-blur-sm`}>
      <div className="relative w-[280px] rounded-3xl border border-pink-200 bg-white/90 p-6 text-center shadow-2xl">
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-pink-300/40" />
            <div className="relative rounded-full bg-pink-50 p-3 shadow-lg">
              <GiStrawberry className="text-[42px] text-pink-600 animate-bounce" />
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <p className="text-sm font-black uppercase tracking-widest text-pink-700">{title}</p>
          <p className="text-xs font-semibold text-gray-500">{subtitle}</p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pink-500" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pink-400 [animation-delay:150ms]" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pink-300 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
};

export default FresaLoader;
