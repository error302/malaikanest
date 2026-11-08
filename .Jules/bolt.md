
## 2024-11-08 - Optimized Product queryset N+1 and Cartesian product blowup
**Learning:** Using multiple aggregate functions like `Avg`, `Count`, and `Sum` on independent reverse relations (like `reviews` and `orderitem`) within a single `.annotate()` call creates multiple `LEFT OUTER JOIN`s. This results in an N x M Cartesian product blowup causing massive performance degradation, especially as tables grow in size.
**Action:** Always use correlated `Subquery` annotations instead of implicit `.annotate()` aggregations over multiple reverse relations. Example: use `Subquery(Review.objects.filter(product=OuterRef('pk')).order_by().values('product').annotate(avg=Avg('rating')).values('avg')[:1])` to aggregate within the subquery.
