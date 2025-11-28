import { Plug, Scissors, Bike, Hammer, Laptop, HelpCircle } from 'lucide-react';

type IconName = 'electronics' | 'textile' | 'bike' | 'wood' | 'toy' | 'software' | 'contact';

interface RepairCategoryIconProps {
  icon: IconName;
  className?: string;
}

const iconMap: Record<IconName, React.ElementType> = {
  electronics: Plug,
  textile: Scissors,
  bike: Bike,
  wood: Hammer,
  toy: Hammer, // Using Hammer for toys as well, or could use another suitable icon if available
  software: Laptop,
  contact: HelpCircle
};

export default function RepairCategoryIcon({ icon, className = 'h-6 w-6' }: RepairCategoryIconProps) {
  const IconComponent = iconMap[icon];

  if (!IconComponent) return null;

  return <IconComponent className={className} strokeWidth={2} />;
}
