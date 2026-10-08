/** Tooth-with-implant mark used on screen and on printed documents. */
export function LogoMark({ size = 64, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 100 105" className={className} aria-hidden="true">
      {/* tooth outline */}
      <path
        d="M30 8C14 8 6 22 8 38c2 14 8 22 11 36 2 10 4 24 10 24 7 0 6-20 12-26"
        fill="none"
        stroke="#123a6b"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M30 8c8 0 13 5 20 5s12-5 20-5c16 0 24 14 22 30-2 14-8 22-11 36-2 10-4 24-10 24-5 0-6-10-8-18"
        fill="none"
        stroke="#123a6b"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* gold crown */}
      <path d="M33 30c6-6 12-4 17-1s11-5 17 1c-2 6-6 9-17 9s-15-3-17-9z" fill="#c9a24a" />
      {/* implant screw */}
      <path d="M44 42h12l-1 42-5 8-5-8z" fill="#123a6b" />
      {[48, 56, 64, 72, 80].map((y) => (
        <path key={y} d={`M41 ${y}l18-3`} stroke="#c9a24a" strokeWidth="4" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function LogoLockup({
  name = "UMAR DENTAL",
  subtitle = "& IMPLANT CENTER",
  size = 72,
  light = false,
}: {
  name?: string;
  subtitle?: string;
  size?: number;
  light?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} />
      <div className="leading-none">
        <div
          className="font-extrabold tracking-wide"
          style={{ fontSize: size * 0.46, color: light ? "#fff" : "#123a6b" }}
        >
          {name}
        </div>
        <div
          className="mt-1.5 font-medium"
          style={{ fontSize: size * 0.2, letterSpacing: "0.32em", color: light ? "#e5d3a1" : "#123a6b" }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
