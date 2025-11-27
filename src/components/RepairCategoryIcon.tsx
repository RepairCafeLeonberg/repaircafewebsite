import { Zap, Scissors, Bike, Hammer, Gamepad2, Smartphone, Mail } from 'lucide-react';

interface RepairCategoryIconProps {
    icon: string;
    className?: string;
}

export default function RepairCategoryIcon({ icon, className = "h-6 w-6" }: RepairCategoryIconProps) {
    const iconMap = {
        electronics: Zap,
        textile: Scissors,
        bike: Bike,
        wood: Hammer,
        toy: Gamepad2,
        software: Smartphone,
        contact: Mail,
    };

    const IconComponent = iconMap[icon as keyof typeof iconMap];

    if (!IconComponent) {
        return null;
    }

    return <IconComponent className={className} strokeWidth={1.8} />;
}
