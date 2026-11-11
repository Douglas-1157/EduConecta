export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="7" y="6" width="4" height="20" rx="2" fill="#fff" /><rect x="7" y="6" width="16" height="4" rx="2" fill="#fff" />
      <rect x="7" y="22" width="16" height="4" rx="2" fill="#fff" /><rect x="7" y="14" width="8" height="4" rx="2" fill="#fff" />
      <rect x="15.5" y="15.2" width="3.5" height="1.6" rx=".8" fill="#5ef0e6" /><circle cx="22" cy="16" r="3" fill="#5ef0e6" />
    </svg>
  );
}
export const Logo = ({ size = 34, className = '' }: { size?: number; className?: string }) => (
  <span className={`logo ${className}`} style={{ width: size, height: size }}><LogoMark size={Math.round(size * 0.65)} /></span>
);
export const Wordmark = () => <span className="wm">Edu<b>Conecta</b></span>;
