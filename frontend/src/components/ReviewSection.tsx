"use client"

import { useCallback, useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import Link from 'next/link'

import api from '@/lib/api'
import { useAuth } from '@/lib/authContext'

interface Review {
  id: number
  product: number
  user: number
  user_name: string
  user_email_masked: string
  rating: number
  title: string
  body: string
  created_at: string
  location?: string
}

interface ReviewStats {
  average_rating: number
  total_reviews: number
  rating_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

interface ReviewSectionProps {
  productId: number
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const { isAuthenticated, user } = useAuth()
  const userHasReviewed = user ? reviews.some((r) => r.user === user.id) : false

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get(`/api/products/reviews/?product=${productId}`)
      const reviewList = res.data.results || res.data || []
      setReviews(reviewList)

      if (reviewList.length > 0) {
        const total = reviewList.reduce((sum: number, r: Review) => sum + r.rating, 0)
        const avg = total / reviewList.length
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        reviewList.forEach((r: Review) => {
          distribution[r.rating as keyof typeof distribution] += 1
        })
        setStats({
          average_rating: avg,
          total_reviews: reviewList.length,
          rating_distribution: distribution,
        })
      } else {
        setStats(null)
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess(false)

    if (rating === 0) {
      setSubmitError('Please select a rating')
      return
    }
    if (!title.trim()) {
      setSubmitError('Please enter a review title')
      return
    }
    if (!comment.trim()) {
      setSubmitError('Please enter your review')
      return
    }

    try {
      setSubmitting(true)
      await api.post('/api/products/reviews/', {
        product: productId,
        rating,
        title: title.trim(),
        body: comment.trim(),
      })
      setSubmitSuccess(true)
      setRating(0)
      setTitle('')
      setComment('')
      await fetchReviews()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setSubmitError(error.response?.data?.detail || 'Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="mt-12 border-t border-default pt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 rounded bg-[var(--bg-soft)]" />
          <div className="h-24 rounded bg-[var(--bg-soft)]" />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-12 border-t border-default pt-8">
      <h2 className="font-display text-[28px] text-[var(--text-primary)]">Customer Reviews</h2>

      {/* Rating Summary */}
      {stats && stats.total_reviews > 0 && (
        <div className="mt-6 flex flex-col gap-6 rounded-[12px] border border-default bg-[var(--bg-soft)] p-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-5xl font-bold text-[var(--text-primary)]">{stats.average_rating.toFixed(1)}</p>
            <div className="mt-1 flex justify-center gap-1 sm:justify-start">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={star <= Math.round(stats.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{stats.total_reviews} reviews</p>
          </div>

          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.rating_distribution[star as keyof typeof stats.rating_distribution] || 0
              const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-8 text-sm text-[var(--text-secondary)]">{star} star</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-[var(--text-secondary)]">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Review Form - Only show for authenticated users who haven't reviewed yet */}
      {!isAuthenticated ? (
        <div className="mt-8">
          <h3 className="font-display text-xl text-[var(--text-primary)]">Write a Review</h3>
          <div className="mt-4 rounded-[12px] border border-default bg-[var(--bg-soft)] p-6 text-center">
            <p className="text-[var(--text-secondary)]">
              Please <Link href="/login" className="text-[var(--accent-primary)] hover:underline">sign in</Link> to write a review.
            </p>
          </div>
        </div>
      ) : userHasReviewed ? (
        <div className="mt-8">
          <h3 className="font-display text-xl text-[var(--text-primary)]">Write a Review</h3>
          <div className="mt-4 rounded-[12px] border border-default bg-[var(--bg-soft)] p-6 text-center">
            <p className="text-[var(--text-secondary)]">
              You have already reviewed this product. Thank you for your feedback!
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <h3 className="font-display text-xl text-[var(--text-primary)]">Write a Review</h3>

          {submitSuccess && (
            <div className="mt-4 rounded-[12px] border border-green-200 bg-green-50 p-4 text-green-700">
              Thank you for your review! It will appear after moderation.
            </div>
          )}

          {submitError && (
            <div className="mt-4 rounded-[12px] border border-red-200 bg-red-50 p-4 text-red-700">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Your Rating <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    {(hoverRating || rating) >= star ? (
                      <Star size={28} className="fill-yellow-400 text-yellow-400" />
                    ) : (
                      <Star size={28} className="text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Review Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your review"
                className="input-soft mt-2 w-full"
                maxLength={200}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this product"
                rows={4}
                className="input-soft mt-2 w-full resize-y"
                maxLength={1000}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-6 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="mt-10">
        <h3 className="font-display text-xl text-[var(--text-primary)]">
          {reviews.length > 0 ? `Reviews (${reviews.length})` : 'No Reviews Yet'}
        </h3>

        {reviews.length === 0 ? (
          <p className="mt-4 text-[var(--text-secondary)]">
            Be the first to review this product!
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-[12px] border border-default bg-surface p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="font-medium text-[var(--text-primary)]">
                        {review.user_name || review.user_email_masked || 'Verified Buyer'}
                      </span>
                    </div>
                    {review.title && (
                      <h4 className="mt-2 font-semibold text-[var(--text-primary)]">{review.title}</h4>
                    )}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {formatDate(review.created_at)}
                  </span>
                </div>
                {review.body && (
                  <p className="mt-3 text-[var(--text-secondary)]">{review.body}</p>
                )}
                {review.location && (
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">{review.location}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
