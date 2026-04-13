/** Placeholder when a recipe has no `image_url`: plate, fork, and food (custom SVG). */
export function RecipeListPlaceholderImage() {
  return (
    <div className="h-full w-full overflow-hidden rounded-[inherit]" aria-hidden>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        className="block h-full w-full"
      >
        {/* Very faint purple wash — uses theme tokens */}
        <rect
          width="200"
          height="200"
          rx="10"
          className="fill-primary-muted opacity-[0.38] dark:opacity-[0.22]"
        />
        <g
          stroke="var(--charcoal-muted)"
          strokeWidth={2.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <circle cx="100" cy="100" r="55" />
          <circle cx="100" cy="100" r="45" />

          <path d="M 20 45 L 20 75 C 20 95, 44 95, 44 75 L 44 45" />
          <path d="M 28 45 L 28 78" />
          <path d="M 36 45 L 36 78" />
          <path d="M 32 90 L 32 155" />

          <ellipse cx="168" cy="65" rx="14" ry="20" />
          <path d="M 168 85 L 168 155" />
        </g>
      </svg>
    </div>
  );
}
