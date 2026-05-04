// halkgunu-web/src/components/Logo.tsx
// "Pazar tezgâhı tentesi" monogramı + opsiyonel wordmark.

interface LogoProps {
  size?: number;
  mono?: boolean;        // tek renk varyantı (favicon, baskı)
  className?: string;
}

export function LogoMark({ size = 32, mono = false, className }: LogoProps) {
  const red = mono ? "#1c1410" : "#c1272d";
  const yellow = mono ? "#1c1410" : "#eab308";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      role="img"
    >
      {/* Tente üst trapez */}
      <path d="M4 13 L20 5 L36 13 L36 17 L4 17 Z" fill={red} />
      {/* 3 dikey şerit */}
      <rect x="6" y="17" width="6" height="18" fill={yellow} />
      <rect x="17" y="17" width="6" height="18" fill={red} />
      <rect x="28" y="17" width="6" height="18" fill={yellow} />
      {/* Alt taban */}
      <rect x="6" y="33" width="28" height="3" fill={red} />
    </svg>
  );
}

interface WordmarkProps { size?: number; className?: string; }

export function Wordmark({ size = 22, className }: WordmarkProps) {
  return (
    <span
      className={`font-display font-extrabold text-brand ${className ?? ""}`}
      style={{ fontSize: size, letterSpacing: "-0.04em", lineHeight: 1 }}
    >
      halkgünü
    </span>
  );
}

export function LogoLockup({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <Wordmark size={size * 0.7} />
    </span>
  );
}
