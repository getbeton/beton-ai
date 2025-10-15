/**
 * Trowel Icon Component
 * 
 * SVG icon representing a construction trowel for the Beton brand.
 * Based on the official Beton trowel logo.
 */

export function TrowelIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1024 1024"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Beton Logo"
    >
      {/* Trowel shape based on the provided logo */}
      <path d="M320 896L128 704L384 448L576 640L320 896Z" />
      <path d="M448 768L256 576L448 384L640 576L448 768Z" />
      <path d="M704 512L512 320L640 192C672 160 704 144 736 144C768 144 800 160 832 192L832 192C864 224 880 256 880 288C880 320 864 352 832 384L704 512Z" />
      <rect x="500" y="140" width="200" height="120" rx="60" transform="rotate(45 500 140)" />
    </svg>
  );
}

