/**
 * 商品评价组件
 * 展示评价列表、统计信息、发表评价表单
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Star,
  StarOff,
  Loader2,
  Edit,
  Trash2,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// 评价类型定义
interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  images: string[];
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface Statistics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 筛选和分页
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 评价表单
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
  });

  // 加载评价列表
  const fetchReviews = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy,
      });

      if (ratingFilter !== 'all') {
        params.append('rating', ratingFilter);
      }

      const response = await fetch(
        `/api/products/${productId}/reviews?${params}`,
      );
      const data = await response.json();

      if (data.success) {
        setReviews(data.data.reviews);
        setStatistics(data.data.statistics);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast.error(data.error || '加载评价失败');
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('加载评价失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, ratingFilter, sortBy, page]);

  // 提交评价
  const handleSubmitReview = async () => {
    if (!session) {
      toast.error('请先登录');
      return;
    }

    if (reviewForm.rating === 0) {
      toast.error('请选择评分');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('评价发表成功');
        setShowReviewForm(false);
        setReviewForm({ rating: 5, title: '', content: '' });
        fetchReviews();
      } else {
        toast.error(data.error || '发表失败');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('发表失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除评价
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('确定要删除这条评价吗？')) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('评价删除成功');
        fetchReviews();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error('删除失败');
    }
  };

  // 渲染星星
  const renderStars = (rating: number, interactive = false, size = 'default') => {
    const sizeClass = size === 'large' ? 'h-6 w-6' : 'h-4 w-4';
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setReviewForm({ ...reviewForm, rating: star })}
            disabled={!interactive}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
          >
            {star <= rating ? (
              <Star className={`${sizeClass} fill-yellow-400 text-yellow-400`} />
            ) : (
              <StarOff className={`${sizeClass} text-gray-300`} />
            )}
          </button>
        ))}
      </div>
    );
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* 评分统计 */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle>用户评价</CardTitle>
            <CardDescription>
              共 {statistics.totalReviews} 条评价
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* 平均分 */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold">
                    {statistics.averageRating}
                  </div>
                  <div className="mt-2">{renderStars(Math.round(statistics.averageRating))}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    基于 {statistics.totalReviews} 条评价
                  </div>
                </div>
              </div>

              {/* 评分分布 */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = statistics.ratingDistribution[rating] || 0;
                  const percentage =
                    statistics.totalReviews > 0
                      ? (count / statistics.totalReviews) * 100
                      : 0;

                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <div className="w-12 text-sm">{rating} 星</div>
                      <Progress value={percentage} className="flex-1" />
                      <div className="w-12 text-sm text-gray-500">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 发表评价按钮 */}
            <div className="mt-6">
              <Button
                onClick={() => setShowReviewForm(true)}
                disabled={!session}
                className="w-full md:w-auto"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {session ? '发表评价' : '登录后评价'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 筛选和排序 */}
      <div className="flex gap-4">
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="筛选评分" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有评分</SelectItem>
            <SelectItem value="5">5星</SelectItem>
            <SelectItem value="4">4星</SelectItem>
            <SelectItem value="3">3星</SelectItem>
            <SelectItem value="2">2星</SelectItem>
            <SelectItem value="1">1星</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">最新</SelectItem>
            <SelectItem value="rating">评分</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 评价列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4">暂无评价</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.user.avatar || ''} />
                      <AvatarFallback>
                        {review.user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.user.name}</span>
                        {review.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            已购买
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {session?.user?.email && review.user.id === session.user.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* 评价内容 */}
                <div className="mt-4">
                  {review.title && (
                    <h4 className="font-medium">{review.title}</h4>
                  )}
                  {review.content && (
                    <p className="mt-2 text-gray-700">{review.content}</p>
                  )}
                </div>

                {/* 评价图片 */}
                {review.images.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    {review.images.map((image, index) => (
                      <div
                        key={index}
                        className="h-20 w-20 overflow-hidden rounded-md border"
                      >
                        <Image
                          src={image}
                          alt={`评价图片 ${index + 1}`}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            上一页
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              第 {page} / {totalPages} 页
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 发表评价对话框 */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发表评价</DialogTitle>
            <DialogDescription>分享您对这件商品的使用体验</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>评分 *</Label>
              <div className="mt-2">
                {renderStars(reviewForm.rating, true, 'large')}
              </div>
            </div>

            <div>
              <Label htmlFor="review-title">标题 (可选)</Label>
              <Input
                id="review-title"
                placeholder="简短总结您的评价"
                value={reviewForm.title}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, title: e.target.value })
                }
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="review-content">评价内容 (可选)</Label>
              <Textarea
                id="review-content"
                placeholder="详细描述您的使用体验..."
                value={reviewForm.content}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, content: e.target.value })
                }
                rows={5}
                maxLength={2000}
              />
              <p className="mt-1 text-xs text-gray-500">
                {reviewForm.content.length} / 2000
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewForm(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '发表评价'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


