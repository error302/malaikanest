# Add this method to WishlistAdmin class:
def user_email(self, obj):
    return obj.user.email if obj.user else "Guest"
user_email.short_description = 'User Email'
