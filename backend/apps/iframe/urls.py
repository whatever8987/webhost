from django.urls import path
from . import views

app_name = 'iframe'

urlpatterns = [
    # Type endpoints
    path('types/', views.TypeListView.as_view(), name='type-list'),
    path('types/<slug:slug>/', views.TypeDetailView.as_view(), name='type-detail'),
    path('types-businesses/', views.type_businesses, name='type-businesses'),
    
    # Business endpoints
    path('businesses/', views.BusinessListView.as_view(), name='business-list'),
    path('businesses/<slug:slug>/', views.BusinessDetailView.as_view(), name='business-detail'),
    path('businesses/<slug:slug>/claim/', views.BusinessClaimView.as_view(), name='business-claim'),
    path('businesses/<slug:slug>/unclaim/', views.BusinessUnclaimView.as_view(), name='business-unclaim'),
    path('businesses/<slug:slug>/check-ownership/', views.check_business_ownership, name='check-ownership'),
    
    # User business endpoints
    path('user/businesses/', views.user_businesses, name='user-businesses'),
]