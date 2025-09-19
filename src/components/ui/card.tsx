/**
 * Card组件
 * 基础卡片组件，用于内容容器
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

// Card组件Props接口
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否有悬停效果 */
  hoverable?: boolean;
}

/**
 * Card组件
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-card text-card-foreground rounded-lg border shadow-sm',
        hoverable && 'transition-shadow hover:shadow-md',
        className,
      )}
      {...props}
    />
  ),
);

Card.displayName = 'Card';

// CardHeader组件Props接口
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * CardHeader组件
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  ),
);

CardHeader.displayName = 'CardHeader';

// CardTitle组件Props接口
export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * CardTitle组件
 */
const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-2xl leading-none font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  ),
);

CardTitle.displayName = 'CardTitle';

// CardDescription组件Props接口
export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * CardDescription组件
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

// CardContent组件Props接口
export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * CardContent组件
 */
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);

CardContent.displayName = 'CardContent';

// CardFooter组件Props接口
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * CardFooter组件
 */
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  ),
);

CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
