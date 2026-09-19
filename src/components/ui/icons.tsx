/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/components/ui/icons.tsx
 * Centralized Icon Registry & UI Icon wrapper to standardize styling, sizes,
 * and decouple individual view communities from raw Lucide icon trees.
 */

import React from 'react';
import {
  Shield,
  ShieldCheck,
  Zap,
  BatteryCharging,
  Settings,
  User,
  Users,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  LogOut,
  LogIn,
  Key,
  MessageSquare,
  Sparkles,
  Award,
  BarChart3,
  TrendingUp,
  Sliders,
  Check,
  Copy,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  type LucideProps
} from 'lucide-react';

export interface IconProps extends LucideProps {
  className?: string;
}

export const Icons = {
  // Security & Auth
  Shield: (props: IconProps) => <Shield {...props} />,
  ShieldCheck: (props: IconProps) => <ShieldCheck {...props} />,
  Key: (props: IconProps) => <Key {...props} />,
  LogIn: (props: IconProps) => <LogIn {...props} />,
  LogOut: (props: IconProps) => <LogOut {...props} />,

  // Products & Power Systems
  Zap: (props: IconProps) => <Zap {...props} />,
  Battery: (props: IconProps) => <BatteryCharging {...props} />,
  Sparkles: (props: IconProps) => <Sparkles {...props} />,
  Award: (props: IconProps) => <Award {...props} />,

  // Users & Organizations
  User: (props: IconProps) => <User {...props} />,
  Users: (props: IconProps) => <Users {...props} />,
  Building: (props: IconProps) => <Building2 {...props} />,

  // Contact & Channels
  Mail: (props: IconProps) => <Mail {...props} />,
  Phone: (props: IconProps) => <Phone {...props} />,
  MapPin: (props: IconProps) => <MapPin {...props} />,
  MessageSquare: (props: IconProps) => <MessageSquare {...props} />,

  // Status & Feedback
  Success: (props: IconProps) => <CheckCircle2 {...props} />,
  Warning: (props: IconProps) => <AlertTriangle {...props} />,
  Error: (props: IconProps) => <XCircle {...props} />,
  Info: (props: IconProps) => <HelpCircle {...props} />,
  Clock: (props: IconProps) => <Clock {...props} />,

  // Actions & Controls
  Search: (props: IconProps) => <Search {...props} />,
  Filter: (props: IconProps) => <Filter {...props} />,
  Settings: (props: IconProps) => <Settings {...props} />,
  Sliders: (props: IconProps) => <Sliders {...props} />,
  Refresh: (props: IconProps) => <RefreshCw {...props} />,
  Download: (props: IconProps) => <Download {...props} />,
  Upload: (props: IconProps) => <Upload {...props} />,
  Check: (props: IconProps) => <Check {...props} />,
  Copy: (props: IconProps) => <Copy {...props} />,
  Trash: (props: IconProps) => <Trash2 {...props} />,
  Edit: (props: IconProps) => <Edit {...props} />,
  Eye: (props: IconProps) => <Eye {...props} />,
  EyeOff: (props: IconProps) => <EyeOff {...props} />,

  // Navigation
  ArrowRight: (props: IconProps) => <ArrowRight {...props} />,
  ArrowLeft: (props: IconProps) => <ArrowLeft {...props} />,
  ChevronDown: (props: IconProps) => <ChevronDown {...props} />,
  ChevronUp: (props: IconProps) => <ChevronUp {...props} />,
  ExternalLink: (props: IconProps) => <ExternalLink {...props} />,

  // Analytics & Documents
  FileText: (props: IconProps) => <FileText {...props} />,
  Analytics: (props: IconProps) => <BarChart3 {...props} />,
  TrendingUp: (props: IconProps) => <TrendingUp {...props} />,
};

export default Icons;
