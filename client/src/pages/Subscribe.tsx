// client/src/pages/Subscribe.tsx

import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

// Import API object and types from your custom api file
import { API, User, SubscriptionPlan, PaginatedResponse, SubscriptionRequest, SubscriptionResponse } from "@/lib/api"; // Ensure SubscriptionRequest and SubscriptionResponse are imported
import { clearAuthTokens } from "@/lib/api"; // Assuming clearAuthTokens is exported from lib/api

import { useToast } from "@/hooks/use-toast";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

// Remove imports from shared schema if you are using types defined in lib/api.ts
// import { User, SubscriptionPlan } from "@shared/schema";

import { useLocation } from "wouter";
import { CheckCircle, AlertCircle, Loader2 as LoaderIcon } from "lucide-react"; // Rename Loader2 to avoid conflict
import { Button } from '@/components/ui/button';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
let stripePromise = null;

try {
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    console.warn('Missing Stripe public key. Payment functionality will be disabled.');
  } else {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY, {
      apiVersion: '2023-10-16',
    });
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
}

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!stripe || !elements) {
      setIsSubmitting(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redirect to a page that confirms subscription success if needed,
        // or just back to portal. Adjust the URL as per your app flow.
        return_url: window.location.origin + "/portal?subscription=success",
      },
    });

    if (error) {
      console.error("Stripe confirmPayment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    } else {
      // Payment succeeded, Stripe will handle the redirect via return_url
      // The redirect target page (/portal?subscription=success) should handle displaying success message
      // No need for an explicit toast here, the redirect will happen.
      // The navigate call below is redundant if Stripe redirect is used.
      // navigate("/portal"); // Remove this if Stripe's return_url handles navigation
      console.log("Stripe confirmPayment succeeded, redirecting...");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PaymentElement requires `elements` to be loaded */}
      {elements ? <PaymentElement /> : <div>Loading payment form...</div>}
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isSubmitting}
      >
        {isSubmitting ? "Processing..." : "Subscribe Now"}
      </Button>
      <p className="text-sm text-gray-500 text-center">
        You'll be charged after your 14-day free trial ends. You can cancel anytime.
      </p>
    </form>
  );
};


export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast(); // Use toast hook here too

  // --- Fetch User Profile ---
  // Use the custom API object
  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ["user", "me"],
    queryFn: async () => {
        try {
            const response = await API.user.getProfile();
            return response.data;
        } catch (error: any) {
             if (error.response?.status === 401) {
                 clearAuthTokens();
                 // Redirect is handled by the effect below, but clearing tokens here is immediate
                 // navigate('/login?redirect=/subscribe'); // Let the effect handle this
                 return null;
             }
             console.error("Error fetching user profile for Subscribe page:", error);
             // Re-throw other errors for react-query to handle retry/error state
             throw error;
        }
    },
    enabled: !!localStorage.getItem('access_token'), // Only run query if a token is potentially available
    retry: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });


  // --- Fetch Subscription Plans ---
  // Use the custom API object
  const { data: plans, isLoading: isLoadingPlans, error: plansError } = useQuery<SubscriptionPlan[] | undefined>({ // Use undefined initially
    queryKey: ["payments", "plans"],
    queryFn: async () => {
      try {
        // API.payments.listPlans returns PaginatedResponse, extract results
        const response = await API.payments.listPlans();
        return response.data.results;
      } catch (error) {
         console.error("Error fetching subscription plans:", error);
         toast({
             title: "Error Loading Plans",
             description: "Could not fetch subscription plans. Please try again later.",
             variant: "destructive",
         });
         throw error; // Re-throw for react-query error state
      }
    },
    retry: 1, // Retry once on failure
    staleTime: 10 * 60 * 1000, // Cache plans for 10 minutes
    gcTime: 60 * 60 * 1000, // Keep plans in cache for 1 hour
  });

  // Get the plan from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planId = params.get("planId");
    if (planId) {
      const id = parseInt(planId, 10);
      if (!isNaN(id)) {
         setSelectedPlanId(id);
      } else {
         console.warn("Invalid planId in URL:", planId);
         // Optionally clear the invalid param
          params.delete("planId");
          navigate(window.location.pathname + (params.toString() ? '?' + params.toString() : ''), { replace: true });
      }
    }
  }, [navigate]); // Add navigate to dependency array


  // Redirect to login if not authenticated after user query loads
  useEffect(() => {
    // Wait until isLoadingUser is false to check the user state
    if (!isLoadingUser && user === null) {
      navigate("/login?redirect=/subscribe");
    }
  }, [user, isLoadingUser, navigate]); // Add isLoadingUser and navigate to dependency array


  // Find the selected plan from the loaded plans
  const selectedPlan = plans?.find(plan => plan.id === selectedPlanId);

  // Effect to create subscription payment intent
  useEffect(() => {
    // Only run if a plan is selected AND user data is available AND we don't already have a client secret
    if (selectedPlanId !== null && user && !clientSecret) {
      console.log(`Attempting to create subscription for plan ID: ${selectedPlanId}`);
      // Use the custom API method
      const data: SubscriptionRequest = { plan_id: selectedPlanId }; // Match the type
      API.payments.createSubscription(data)
        .then((response: AxiosResponse<SubscriptionResponse>) => { // Axios call returns AxiosResponse
          console.log("Subscription response data:", response.data);
          if (response.data.clientSecret) {
             setClientSecret(response.data.clientSecret);
          } else if (response.data.message) {
              // Handle cases where the API returns a message instead of a client secret
              // e.g., if the user already has a subscription or the plan is invalid
              toast({
                  title: "Subscription Info",
                  description: response.data.message,
                  variant: "default" // Or 'warning'
              });
              // Maybe navigate away or update UI to show current subscription status
              // navigate('/portal'); // Example: Go to portal if already subscribed
          } else {
               toast({
                  title: "Subscription Error",
                  description: "Received unexpected response from subscription API.",
                  variant: "destructive"
              });
               console.error("Unexpected subscription response:", response.data);
          }
        })
        .catch((error: any) => { // Handle Axios errors
          console.error("Failed to create subscription:", error);
           let errorMessage = "Failed to create subscription. Please try again.";
           if (error.response?.data?.detail) {
               errorMessage = error.response.data.detail;
           } else if (error.message) {
               errorMessage = error.message;
           }
           toast({
               title: "Subscription Creation Failed",
               description: errorMessage,
               variant: "destructive",
           });
           // Clear selected plan and client secret on error to allow re-selection
           setSelectedPlanId(null);
           setClientSecret("");
        });
    }
     // Dependencies: selectedPlanId, user, clientSecret, toast
     // Add navigate if you decide to navigate in the .then block based on messages
  }, [selectedPlanId, user, clientSecret, toast]);


  // Show loading spinner while user or plans are loading, or if plan is selected but client secret is not yet available
  if (isLoadingUser || isLoadingPlans || (selectedPlanId !== null && !clientSecret)) {
     return (
       <div className="flex justify-center items-center min-h-screen">
         <LoaderIcon className="h-12 w-12 animate-spin text-primary" />
       </div>
     );
   }

  // Handle case where user is null after loading (should be caught by effect, but fallback)
   if (!user) {
       return null; // Effect should navigate, render nothing or a minimal message
   }

  // Handle case where plans failed to load
   if (plansError) {
       return (
           <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
               <h1 className="text-3xl font-bold text-red-600 mb-4">Error Loading Plans</h1>
               <p className="text-gray-700 mb-6">Could not fetch subscription plans. Please try again later.</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
           </div>
       );
   }

    // Handle case where plans loaded but is empty
   if (!plans || plans.length === 0) {
        return (
           <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
               <h1 className="text-3xl font-bold text-gray-800 mb-4">No Plans Available</h1>
               <p className="text-gray-700 mb-6">Subscription plans are not currently available. Please check back later.</p>
           </div>
        );
   }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pass user and isLoggedIn state to TopNavigation */}
      <TopNavigation user={user} isLoggedIn={user !== null} /> {/* isLoggedIn check refined */}

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Choose Your Subscription Plan</h1>
          <p className="text-gray-600 mt-2">Select a plan that works best for your salon</p>
        </div>

        {/* Show plan cards if no plan is selected */}
        {selectedPlanId === null && ( // Check against selectedPlanId state directly
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {plans.map((plan: SubscriptionPlan) => ( // Use the loaded plans
              <Card key={plan.id} className={`overflow-hidden ${plan.is_popular ? 'border-primary' : ''}`}> {/* Use plan.is_popular */}
                {plan.is_popular && ( // Use plan.is_popular
                  <div className="bg-primary text-white text-center py-1 font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  {/* Use plan.name and plan.display_price */}
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.display_price}</span> {/* Use display_price */}
                    <span className="text-gray-500">/month</span>
                  </div>
                   {/* You might want a description field on the Plan model */}
                  <CardDescription>{plan.description || "Unlock powerful features for your salon website."}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {/* Use plan.features */}
                    {Array.isArray(plan.features) && plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.is_popular ? "default" : "outline"} // Use plan.is_popular
                    onClick={() => setSelectedPlanId(plan.id)} // Set selectedPlanId
                  >
                    Select Plan
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

         {/* Show payment form if plan is selected and client secret is available */}
        {selectedPlan && clientSecret && stripePromise ? ( // Ensure stripePromise is also valid
          <Card className="mx-auto max-w-xl">
            <CardHeader>
              <CardTitle>Complete Your Subscription</CardTitle>
              {/* Use selectedPlan.name and selectedPlan.display_price */}
              <CardDescription>
                You're subscribing to the {selectedPlan.name} plan at {selectedPlan.display_price}/month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                       {/* Use trial_period_days from the selected plan */}
                       {selectedPlan.trial_period_days > 0 ?
                        `Your ${selectedPlan.trial_period_days}-day free trial starts today. You won't be charged until the trial ends.` :
                        "Complete the form to subscribe."}
                    </p>
                  </div>
                </div>
              </div>
              {/* Elements requires a valid stripe instance and clientSecret */}
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm />
              </Elements>
            </CardContent>
          </Card>
         ) : (
             // Show loading if selectedPlan is true but clientSecret or stripePromise is missing
             selectedPlan && (
                 <div className="flex justify-center items-center py-20">
                     <LoaderIcon className="h-12 w-12 animate-spin text-primary" />
                     <span className="ml-2 text-gray-600">Setting up payment...</span>
                 </div>
             )
         )}
      </div>
    </div>
  );
}