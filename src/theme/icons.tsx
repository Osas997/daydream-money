import React from 'react';
import {
  Home,
  Clock,
  Plus,
  PieChart,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Search,
  Filter,
  Lock,
  Trash2,
  Edit3,
  Share2,
  Calendar,
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Sparkles,
  CreditCard,
  Gift,
  Briefcase,
  TrendingUp,
  Laptop,
  Landmark,
  Smartphone,
  Banknote,
  Folder,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Download,
  AlertCircle,
  HelpCircle,
  FileText,
  FileSpreadsheet,
  LucideProps,
} from 'lucide-react-native';

export type IconName =
  | 'home'
  | 'history'
  | 'plus'
  | 'budget'
  | 'report'
  | 'settings'
  | 'eye'
  | 'eyeOff'
  | 'chevronLeft'
  | 'chevronRight'
  | 'check'
  | 'close'
  | 'search'
  | 'filter'
  | 'lock'
  | 'trash'
  | 'edit'
  | 'share'
  | 'calendar'
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'sparkles'
  | 'subscription'
  | 'gift'
  | 'salary'
  | 'investment'
  | 'freelance'
  | 'bank'
  | 'ewallet'
  | 'cash'
  | 'other'
  | 'transfer'
  | 'income'
  | 'expense'
  | 'shield'
  | 'download'
  | 'pdf'
  | 'excel'
  | 'alert';

const iconMap: Record<string, React.FC<LucideProps>> = {
  home: Home,
  history: Clock,
  plus: Plus,
  budget: PieChart,
  report: BarChart3,
  settings: Settings,
  eye: Eye,
  eyeOff: EyeOff,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  check: Check,
  close: X,
  search: Search,
  filter: Filter,
  lock: Lock,
  trash: Trash2,
  edit: Edit3,
  share: Share2,
  calendar: Calendar,
  food: Utensils,
  transport: Car,
  shopping: ShoppingBag,
  bills: Receipt,
  entertainment: Gamepad2,
  health: HeartPulse,
  education: GraduationCap,
  sparkles: Sparkles,
  subscription: CreditCard,
  gift: Gift,
  salary: Briefcase,
  investment: TrendingUp,
  freelance: Laptop,
  bank: Landmark,
  ewallet: Smartphone,
  cash: Banknote,
  other: Folder,
  transfer: ArrowLeftRight,
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  shield: ShieldCheck,
  download: Download,
  pdf: FileText,
  excel: FileSpreadsheet,
  alert: AlertCircle,
};

export interface AppIconProps extends LucideProps {
  name: IconName | string;
}

export function AppIcon({ name, strokeWidth = 1.5, size = 24, ...props }: AppIconProps) {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent strokeWidth={strokeWidth} size={size} {...props} />;
}
