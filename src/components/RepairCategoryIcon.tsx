type IconName = 'electronics' | 'textile' | 'bike' | 'wood' | 'toy' | 'software' | 'contact';

interface RepairCategoryIconProps {
  icon: IconName;
  className?: string;
}

const iconPaths: Record<IconName, JSX.Element> = {
  electronics: (
    <path d="M13 2 7 14h4l-1 8 6-12h-4l1-8Z" strokeLinecap="round" strokeLinejoin="round" />
  ),
  textile: (
    <>
      <circle cx="7" cy="7" r="2" />
      <circle cx="17" cy="7" r="2" />
      <path d="M3 3 21 21M9 9l-6 6M15 9l6 6" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="17" r="3.5" />
      <circle cx="18" cy="17" r="3.5" />
      <path d="M6 17h6l-2-6h5l3 6" />
      <path d="M10 5h4" />
    </>
  ),
  wood: (
    <>
      <path d="M11 2 6 7l11 11 5-5Z" />
      <path d="M16 7 9 14" strokeWidth="1.5" />
    </>
  ),
  toy: (
    <>
      <rect x="4" y="8" width="16" height="10" rx="3" />
      <circle cx="9" cy="13" r="1.4" />
      <circle cx="15" cy="13" r="1.4" />
      <path d="M9 10v6M7 12h4" strokeWidth="1.5" />
    </>
  ),
  software: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M10 5h4M10 19h4M9 15h6" />
    </>
  ),
  contact: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 8.5 12 13l9-4.5" />
    </>
  )
};

export default function RepairCategoryIcon({ icon, className = 'h-6 w-6' }: RepairCategoryIconProps) {
  const paths = iconPaths[icon];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths}
    </svg>
  );
}
