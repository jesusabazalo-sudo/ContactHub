import {
  Activity,
  Archive,
  BookOpenCheck,
  Bot,
  Boxes,
  Brain,
  BriefcaseBusiness,
  Clapperboard,
  Cpu,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  Joystick,
  Laptop,
  LucideIcon,
  MapPin,
  Megaphone,
  Music2,
  PackagePlus,
  Palette,
  Rocket,
  Shirt,
  Sparkles,
  TrendingUp,
  Workflow,
  Wrench,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  Activity,
  Archive,
  BookOpenCheck,
  Bot,
  Boxes,
  Brain,
  BriefcaseBusiness,
  Clapperboard,
  Cpu,
  Gamepad2,
  GraduationCap,
  HeartHandshake,
  Joystick,
  Laptop,
  MapPin,
  Megaphone,
  Music2,
  PackagePlus,
  Palette,
  Rocket,
  Shirt,
  Sparkles,
  TrendingUp,
  Workflow,
  Wrench,
};

type IconProps = {
  name: string;
  className?: string;
  ariaHidden?: boolean;
};

export default function Icon({ name, className, ariaHidden = true }: IconProps) {
  const LucideIconComponent = icons[name] ?? Sparkles;
  return <LucideIconComponent aria-hidden={ariaHidden} className={className} />;
}
