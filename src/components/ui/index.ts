/**
 * UI组件统一导出
 */

export { Button, buttonVariants } from './button';
export type { ButtonProps } from './button';

export { Input } from './input';
export type { InputProps } from './input';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from './card';

export {
  Spinner,
  LoadingScreen,
  LoadingButton,
  Skeleton,
  ProductCardSkeleton,
  PageLoader,
  InlineLoader,
} from './loading';

export {
  ErrorBoundary,
  ApiError,
  NotFound,
  NetworkError,
} from './error-boundary';

export { ImageUpload } from './image-upload';
export { AvatarUpload } from './avatar-upload';
