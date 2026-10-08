// Animated dental backdrop for the login page: drifting light, floating teeth, gold sparkles.
// Pure CSS/SVG (keyframes live in globals.css under "Login backdrop"); positions are fixed so
// server and client render identically.

const TOOTH =
  "M30 6C16 6 8 18 9 33c1 12 6 20 9 32 2 10 4 26 11 26 6 0 6-14 9-22 1-3 3-5 6-5s5 2 6 5c3 8 3 22 9 22 7 0 9-16 11-26 3-12 8-20 9-32C80 18 72 6 58 6c-6 0-10 4-14 4s-8-4-14-4z";

// left %, top %, size px, float duration s, delay s, opacity, gold?
const TEETH: [number, number, number, number, number, number, boolean][] = [
  [6, 14, 70, 19, 0, 0.24, false],
  [18, 68, 46, 23, -6, 0.2, true],
  [30, 30, 28, 17, -3, 0.18, false],
  [44, 82, 58, 26, -11, 0.18, false],
  [62, 10, 40, 21, -8, 0.22, true],
  [74, 58, 86, 28, -2, 0.2, false],
  [86, 24, 52, 20, -14, 0.24, false],
  [92, 80, 34, 18, -5, 0.22, true],
  [52, 44, 22, 16, -9, 0.16, false],
  [10, 44, 30, 22, -12, 0.18, true],
];

// left %, top %, size px, delay s
const SPARKLES: [number, number, number, number][] = [
  [12, 22, 14, 0], [24, 78, 10, -1.2], [38, 16, 12, -2.4], [48, 64, 8, -0.6],
  [58, 28, 16, -3.1], [70, 86, 12, -1.8], [80, 40, 10, -2.7], [90, 12, 14, -0.9],
  [16, 56, 8, -3.6], [66, 52, 10, -4.2], [34, 90, 12, -2], [84, 66, 16, -3.3],
];

function Sparkle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0z" fill="#e8c766" />
    </svg>
  );
}

export function LoginBackground() {
  return (
    <div className="login-bg" aria-hidden="true">
      {/* drifting light */}
      <div className="login-orb login-orb-gold" />
      <div className="login-orb login-orb-blue" />
      <div className="login-orb login-orb-teal" />

      {/* fine grid for depth */}
      <div className="login-grid" />

      {/* orbit rings with a travelling gold dot, centred behind the card */}
      <div className="login-rings">
        <div className="login-ring login-ring-1"><span /></div>
        <div className="login-ring login-ring-2"><span /></div>
        <div className="login-ring login-ring-3" />
      </div>

      {/* floating teeth */}
      {TEETH.map(([left, top, size, dur, delay, opacity, gold], i) => (
        <svg
          key={i}
          className="login-tooth"
          viewBox="0 0 88 100"
          width={size}
          height={size * 1.14}
          style={{ left: `${left}%`, top: `${top}%`, opacity, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
        >
          <path d={TOOTH} fill="none" stroke={gold ? "#d9b24c" : "#9fc2ee"} strokeWidth="4" strokeLinejoin="round" />
        </svg>
      ))}

      {/* sparkles */}
      {SPARKLES.map(([left, top, size, delay], i) => (
        <div key={i} className="login-sparkle" style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s` }}>
          <Sparkle size={size} />
        </div>
      ))}

      {/* soft vignette so the card stays the focus */}
      <div className="login-vignette" />
    </div>
  );
}
