import {
  Home,
  Users,
  ClipboardCheck,
  GraduationCap,
  Database,
  BarChart,
  FileText,
  PieChart,
  Settings as SettingsIcon,
  Target,
  User,
} from 'lucide-react'

export type Role = 'admin' | 'intern' | 'recruiter' | 'manager' | 'verifier'

export type MenuItem = {
  label: string
  icon?: keyof typeof iconMap
  path?: string
  children?: Array<{ label: string; path: string }>
}

export const iconMap = {
  Home,
  Users,
  ClipboardCheck,
  GraduationCap,
  Database,
  BarChart,
  FileText,
  PieChart,
  Settings: SettingsIcon,
  Target,
  User,
}

export const sidebarMenus: Record<Role, MenuItem[]> = {
  admin: [
     { label: 'Dashboard', icon: 'Home', path: '/dashboard' },
    {
      label: 'Recruitment',
      icon: 'Users',
      path: '/recruitment/candidates', // removed children, added path for direct landing
    },
    {
      label: 'Onboarding',
      icon: 'ClipboardCheck',
      path: '/onboarding/pending', // removed children, added path for direct landing
    },
    {
      label: 'Intern Management',
      icon: 'GraduationCap',
      path: '/interns/active'
    },
    {
      label: 'Subscriptions',
      icon: 'Database',
      children: [
        { label: 'Add Subscription', path: '/subscriptions/add' },
        { label: 'My Subscriptions', path: '/subscriptions/list' },
        // { label: 'Verification', path: '/subscriptions/verify' },
      ],
    },
    {
      label: 'Performance',
      icon: 'BarChart',
      children: [
        { label: 'Targets', path: '/performance/targets' },
        { label: 'Employee Targets', path: '/performance/employee_targets' },
        { label: 'Evaluation', path: '/performance/evaluation' },
      ],
    },
    // { label: 'Documents', icon: 'FileText', path: '/documents' },
    { label: 'Reports', icon: 'PieChart', path: '/reports' },
    { label: 'Email Templates', icon: 'FileText', path: '/email-templates' },
    { label: 'Settings', icon: 'Settings', path: '/settings' },
  ],
  intern: [
    { label: 'Dashboard', icon: 'Home', path: '/dashboard' },
    {
      label: 'Subscriptions',
      icon: 'Database',
      children: [
        { label: 'Add Subscription', path: '/subscriptions/add' },
        { label: 'My Subscriptions', path: '/subscriptions/list' },
      ],
    },
    { label: 'Targets & Tasks', icon: 'Target', path: '/performance/targets' },
    // { label: 'Documents', icon: 'FileText', path: '/documents' },
    { label: 'My Profile', icon: 'User', path: '/profile' },
  ],
  recruiter: [
    { label: 'Dashboard', icon: 'Home', path: '/dashboard' },
    {
      label: 'Recruitment',
      icon: 'Users',
      path: '/recruitment/candidates', // removed children, added path for direct landing
    },
     {
      label: 'Onboarding',
      icon: 'ClipboardCheck',
      path: '/onboarding/pending', // removed children, added path for direct landing
    },
    {
      label: 'Intern Management',
      icon: 'GraduationCap',
      path: '/interns/active'
    },
    // { label: 'Documents', icon: 'FileText', path: '/documents' },
    { label: 'Reports', icon: 'PieChart', path: '/reports' },
    { label: 'Settings', icon: 'Settings', path: '/settings' },
  ],
  manager: [
    { label: 'Dashboard', icon: 'Home', path: '/dashboard' },
    {
      label: 'Intern Management',
      icon: 'GraduationCap',
      children: [
        { label: 'Active Interns', path: '/interns/active' },
        { label: 'Extensions', path: '/interns/extensions' },
        { label: 'Terminations', path: '/interns/terminations' },
      ],
    },
    {
      label: 'Performance',
      icon: 'BarChart',
      children: [
        { label: 'Targets', path: '/performance/targets' },
        { label: 'Employee Targets', path: '/performance/employee_targets' },
        { label: 'Evaluation', path: '/performance/evaluation' },
      ],
    },
    { label: 'Reports', icon: 'PieChart', path: '/reports' },
    { label: 'Settings', icon: 'Settings', path: '/settings' },
  ],
  verifier: [
    { label: 'Dashboard', icon: 'Home', path: '/dashboard' },
    {
      label: 'Onboarding',
      icon: 'ClipboardCheck',
      children: [
        { label: 'Pending Verification', path: '/onboarding/pending' },
        { label: 'Verified', path: '/onboarding/verified' },
      ],
    },
    // { label: 'Documents', icon: 'FileText', path: '/documents' },
    { label: 'Reports', icon: 'PieChart', path: '/reports' },
    { label: 'Settings', icon: 'Settings', path: '/settings' },
  ],
}

export function flattenPathsForRole(role: Role): Array<{ path: string; label: string }> {
  const items = sidebarMenus[role] || []
  const out: Array<{ path: string; label: string }> = []
  items.forEach((i) => {
    if (i.path) out.push({ path: i.path, label: i.label })
    if (i.children) i.children.forEach((c) => out.push({ path: c.path, label: c.label }))
  })
  return out
}


