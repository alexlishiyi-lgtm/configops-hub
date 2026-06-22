import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-[#EEF2FF] text-[#4F46E5]',
        success: 'bg-[#ECFDF5] text-[#10B981]',
        warning: 'bg-[#FFFBEB] text-[#F59E0B]',
        danger: 'bg-[#FEF2F2] text-[#EF4444]',
        info: 'bg-[#EFF6FF] text-[#3B82F6]',
        gray: 'bg-[#F3F4F6] text-[#6B7280]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { Badge, badgeVariants };
