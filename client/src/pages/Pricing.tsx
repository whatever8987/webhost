import { TopNavigation } from "@/components/layout/TopNavigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { API } from "@/lib/api";
import axios from "axios";

export default function Pricing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch user profile
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await API.user.getProfile();
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        return null;
      }
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: false,
  });

  // Fetch subscription plans
  const { data: plansResponse, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: async () => {
      try {
        const response = await API.payments.listPlans();
        return {
          count: response.data.count,
          results: response.data.results.map(plan => ({
            ...plan,
            features: parseFeatures(plan.features)
          }))
        };
      } catch (error) {
        toast({
          title: "Error loading plans",
          description: "Failed to load subscription plans. Please try again later.",
          variant: "destructive"
        });
        return { count: 0, results: [] };
      }
    },
    retry: false,
  });

  const parseFeatures = (features: any): string[] => {
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const isLoggedIn = !!user;
  const plans = plansResponse?.results || [];

  const handleSelectPlan = (planId: number) => {
    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "Please log in to select a subscription plan",
        variant: "destructive"
      });
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    navigate(`/subscribe?planId=${planId}`);
  };

  if (isLoadingUser || isLoadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading pricing plans...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation user={user} isLoggedIn={isLoggedIn} />

      {/* Styled Pricing Section */}
      <section className="py-24 bg-background relative">
        <div className="absolute inset-0 bg-grid-slate-200/70 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary/10 text-secondary mb-4">
              <Sparkles className="h-4 w-4 mr-2" /> Start for free, upgrade anytime
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">transparent</span> pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that works for your salon - all with no setup fees and a 14-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`bg-white rounded-xl border ${plan.is_popular ? 'border-primary/30 shadow-lg relative' : 'border-gray-200'} overflow-hidden`}
              >
                {plan.is_popular && (
                  <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-primary to-purple-600 text-center py-1 text-xs font-medium text-white">
                    Most Popular
                  </div>
                )}
                <div className={`p-8 ${plan.is_popular ? 'pt-12' : ''}`}>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-bold">${plan.display_price}</span>
                    <span className="text-muted-foreground ml-2">/month</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                  
                  {plan.trial_period_days > 0 && (
                    <Badge variant="outline" className="mb-4">
                      {plan.trial_period_days}-day free trial
                    </Badge>
                  )}

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span>{typeof feature === 'object' ? feature.feature || feature.desc : feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className="w-full" 
                    variant={plan.is_popular ? "default" : "outline"}
                    size="lg"
                  >
                    {isLoggedIn ? "Choose Plan" : "Get Started"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">What payment methods do you accept?</h3>
                  <p className="text-gray-600">We accept all major credit cards through our secure Stripe payment processor.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Can I upgrade or downgrade later?</h3>
                  <p className="text-gray-600">Yes, you can change your plan at any time from your account dashboard.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Is there a setup fee?</h3>
                  <p className="text-gray-600">No, there are no hidden fees. You only pay the monthly subscription price.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">What happens if I cancel?</h3>
                  <p className="text-gray-600">Your website will remain active until the end of your billing period.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}