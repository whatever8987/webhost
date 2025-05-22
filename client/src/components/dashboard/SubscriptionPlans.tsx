import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { CheckCircle, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function SubscriptionPlans() {
  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });
  
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSelectPlan = (planId: number) => {
    navigate(`/subscribe?planId=${planId}`);
  };

  // Fallback plans if API hasn't loaded yet
  const fallbackPlans = [
    {
      id: 1,
      name: "Basic",
      price: 29,
      features: ["Custom subdomain", "Mobile-friendly design", "Basic content management", "Email support"],
      isPopular: true,
    },
    {
      id: 2,
      name: "Premium",
      price: 49,
      features: ["All Basic features", "Custom domain connection", "Online booking integration", "Priority support"],
      isPopular: false,
    },
    {
      id: 3,
      name: "Luxury",
      price: 99,
      features: ["All Premium features", "Custom design modifications", "SEO optimization", "Dedicated support manager"],
      isPopular: false,
    },
  ];

  const displayPlans = plans || fallbackPlans;

  return (
    <Card className="mt-10">
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <CardTitle>Subscription Plans</CardTitle>
        <CardDescription>Monthly hosting plans for salon owners.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array(3)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="relative p-6 border border-gray-200 rounded-lg">
                    <Skeleton className="h-6 w-24 mb-4" />
                    <Skeleton className="h-10 w-32 mb-4" />
                    <Skeleton className="h-4 w-full mb-6" />
                    <div className="space-y-4 mb-8">
                      {Array(4)
                        .fill(0)
                        .map((_, i) => (
                          <Skeleton key={i} className="h-4 w-full" />
                        ))}
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))
            : displayPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-6 border ${
                    plan.isPopular ? "border-gray-300" : "border-gray-200"
                  } rounded-lg`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 h-16 w-16 overflow-hidden">
                      <div className="absolute transform rotate-45 bg-primary text-center text-white font-semibold py-1 right-[-35px] top-[32px] w-[170px]">
                        Most Popular
                      </div>
                    </div>
                  )}
                  <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                  <p className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold tracking-tight text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>
                  </p>
                  <p className="mt-6 text-gray-500">
                    {plan.name === "Basic"
                      ? "Everything needed for a standard salon website."
                      : plan.name === "Premium"
                      ? "Enhanced features for growing salons."
                      : "Full-service solution for high-end salons."}
                  </p>

                  <ul role="list" className="mt-6 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="ml-3 text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Button
                      className={`w-full ${
                        plan.isPopular
                          ? "bg-primary text-white"
                          : "bg-white border border-primary text-primary"
                      }`}
                      variant={plan.isPopular ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      Select Plan
                    </Button>
                  </div>
                </div>
              ))}
        </div>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-green-500" />
            <span className="ml-2 text-sm text-gray-500">
              All plans include Stripe integration for easy billing
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Free 14-day trial available for all plans. No credit card required to start.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
