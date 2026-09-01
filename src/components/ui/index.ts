/**
 * Barrel export for src/components/ui
 *
 * Import from '@/components/ui' for new code.
 * Existing imports from individual files (e.g. '@/components/ui/Button') still work.
 */

// Foundation
export { cn } from '@/lib/utils';

// Primitives
export { Button, ButtonLink } from './Button';
export type { ButtonProps, ButtonLinkProps, ButtonVariant, ButtonSize } from './Button';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, SectionHeader } from './Card';
export type { CardProps, SectionHeaderProps } from './Card';

export { Input, Textarea, Select, Label, Field, Checkbox } from './Input';

export { Badge, StatusBadge, statusTone } from './Badge';

// Phase 1 components
export { Modal, ConfirmDialog } from './Modal';
export type { ModalProps, ConfirmDialogProps } from './Modal';

export { DataTable, Table, THead, TBody, TR, TH, TD } from './Table';
export type { DataTableProps, Column } from './Table';

export { Tabs } from './Tabs';
export type { TabsProps, TabItem } from './Tabs';

export { StatCard } from './StatCard';
export type { StatCardProps } from './StatCard';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { Skeleton, SkeletonText, SkeletonCard, ConversationThreadSkeleton, LedgerRowSkeleton, FormSkeleton } from './Skeleton';

export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

export { AppShell, BottomNav } from './AppShell';
export type { AppShellProps, BottomNavProps, BottomNavItem } from './AppShell';

// Context (canonical path — also re-exported from './ToastProvider')
export { ToastProvider, useToast } from './ToastContext';

export { ThemeProvider, useTheme, ThemeToggle } from './ThemeContext';

export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

export { UserMenu } from './UserMenu';
export type { UserMenuProps } from './UserMenu';

export { CommandPalette } from './CommandPalette';
export type { CommandPaletteProps, CommandItem } from './CommandPalette';
