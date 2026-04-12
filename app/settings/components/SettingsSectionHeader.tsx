"use client";

type SettingsSectionHeaderProps = {
  title: string;
  sectionId: string;
  onEdit?: () => void;
  showEditButton?: boolean;
  editAriaLabel?: string;
};

const pencilIcon = (
  <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
    />
  </svg>
);

export function SettingsSectionHeader({
  title,
  sectionId,
  onEdit,
  showEditButton = true,
  editAriaLabel,
}: SettingsSectionHeaderProps) {
  const label = editAriaLabel ?? `Edit ${title}`;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
      <h2 id={sectionId} className="text-lg font-semibold text-foreground sm:text-xl">
        {title}
      </h2>
      {showEditButton && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={label}
        >
          {pencilIcon}
        </button>
      ) : null}
    </div>
  );
}
