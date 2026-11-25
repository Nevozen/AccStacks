export function HeroContours({ className }: { className: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 460"
      preserveAspectRatio="none"
      fill="none"
    >
      <defs>
        <linearGradient id="accstacks-back-wash" x2="0" y2="1">
          <stop stopColor="var(--wave-back)" stopOpacity=".8" />
          <stop offset=".89" stopColor="var(--wave-back)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="accstacks-front-wash" x2="0" y2="1">
          <stop stopColor="var(--wave-front)" stopOpacity=".9" />
          <stop offset="1" stopColor="var(--wave-front)" stopOpacity="0" />
        </linearGradient>
        <path
          id="accstacks-back-ridge"
          d="M-80 170C18 56 93 46 199 148C324 268 427 241 610 211C803 179 899 216 1057 105C1170 26 1217 53 1331 115C1410 157 1468 156 1520 127V490H-80Z"
        />
        <path
          id="accstacks-front-ridge"
          d="M-80 290C89 346 202 246 331 203C466 157 557 221 684 275C845 343 946 322 1068 261C1239 176 1351 196 1520 270V490H-80Z"
        />
      </defs>
      <use href="#accstacks-back-ridge" fill="url(#accstacks-back-wash)" />
      <g stroke="var(--wave-line)">
        <use href="#accstacks-back-ridge" opacity=".65" />
        <use href="#accstacks-back-ridge" transform="translate(0 15)" opacity=".35" />
        <use href="#accstacks-back-ridge" transform="translate(0 31)" opacity=".25" />
      </g>
      <use href="#accstacks-front-ridge" fill="url(#accstacks-front-wash)" />
      <g stroke="var(--wave-line)">
        <use href="#accstacks-front-ridge" opacity=".6" />
        <use href="#accstacks-front-ridge" transform="translate(0 13)" opacity=".32" />
        <use href="#accstacks-front-ridge" transform="translate(0 27)" opacity=".24" />
        <use href="#accstacks-front-ridge" transform="translate(0 43)" opacity=".18" />
      </g>
    </svg>
  );
}
