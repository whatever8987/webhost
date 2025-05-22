// client/src/pages/Checkout.tsx

import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

// Import API object and types from your custom api file
// Ensure PaymentIntentRequest and PaymentIntentResponse are imported
import { API, User, PaymentIntentRequest, PaymentIntentResponse, clearAuthTokens } from "@/lib/api"; // Assuming clearAuthTokens is exported

import { useToast } from "@/hooks/use-toast";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

// Remove import from shared schema if you are using User type from lib/api.ts
// import { User } from "@shared/schema";

import { useLocation } from "wouter";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 as LoaderIcon } from "lucide-react"; // Rename Loader2 to avoid conflict


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

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The navigate call below is likely redundant if Stripe's return_url works
  // const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!stripe || !elements) {
      setIsSubmitting(false);
      return;
    }

    // Use the `return_url` parameter to redirect the user after the payment is complete
    // This should be a public route in your app that confirms the payment status.
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/portal?payment=success",
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
      // The redirect target page (/portal?payment=success) should handle displaying success message
      // No need for an explicit toast or navigate here, the redirect will happen.
      console.log("Stripe confirmPayment succeeded, redirecting...");
      // navigate("/portal"); // Remove this if Stripe's return_url handles navigation
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
        {isSubmitting ? "Processing..." : "Complete Payment"}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(100); // Stored in dollars for input
  const [description, setDescription] = useState("Website development services");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);


  // --- Fetch User Profile ---
  // Use the custom API object
  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ["user", "me"], // More descriptive key
    queryFn: async () => {
        try {
            const response = await API.user.getProfile();
            return response.data; // API call returns AxiosResponse, so return data
        } catch (error: any) { // Use 'any' or AxiosError type for error handling
             // Standard Axios error handling
             if (error.response) {
                 const status = error.response.status;
                 console.error("User Profile API Response Error:", status, error.response.data);
                 if (status === 401) {
                     // If unauthorized, clear tokens and redirect to login
                     clearAuthTokens();
                      // Let the effect below handle the navigation based on user === null
                     // navigate('/login?redirect=/checkout');
                     return null; // Return null as the data
                 }
                  // Re-throw other response errors
                 throw error;
             } else if (error.request) {
                 console.error("User Profile API Request Error:", error.request);
                 throw error; // Re-throw network errors
             } else {
                 console.error("Unexpected Error fetching user profile:", error.message);
                 throw error; // Re-throw unexpected errors
             }
        }
    },
    // Only run query if a token is potentially available
    enabled: !!localStorage.getItem('access_token'),
    retry: 0, // Or adjust retry logic based on needs
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });


  // Redirect to login if not authenticated after user query loads
  useEffect(() => {
    // Wait until isLoadingUser is false to check the user state
    if (!isLoadingUser && user === null) {
      navigate("/login?redirect=/checkout");
    }
  }, [user, isLoadingUser, navigate]); // Add isLoadingUser and navigate to dependency array


  // Parse amount and description from URL if provided
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const amountParam = params.get("amount");
    const descParam = params.get("description");

    if (amountParam) {
      const parsedAmount = parseFloat(amountParam);
       if (!isNaN(parsedAmount) && parsedAmount > 0) {
          setAmount(parsedAmount);
       } else {
           console.warn("Invalid amount in URL:", amountParam);
       }
    }

    if (descParam) {
      setDescription(descParam);
    }
     // No dependencies needed that would cause re-parsing
  }, []); // Empty dependency array means this runs once on mount


  const handleCreatePayment = async () => {
    if (amount <= 0 || isNaN(amount)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount greater than zero.",
        variant: "destructive",
      });
      return;
    }

     // Ensure amount is an integer number of cents
    const amountInCents = Math.round(amount * 100);
     if (amountInCents <= 0) {
        toast({
            title: "Invalid Amount",
            description: "Calculated amount in cents is zero or negative.",
            variant: "destructive",
        });
        return;
     }


    setIsCreatingPaymentIntent(true);
    setClientSecret(""); // Clear previous client secret

    try {
      // Use the custom API method
      const data: PaymentIntentRequest = {
        amount_cents: amountInCents, // Send amount in cents
        description: description || "One-time payment", // Use default if description is empty
        // currency is optional per your type, default likely handled by backend
      };
      const response = await API.payments.createPaymentIntent(data); // Axios call returns AxiosResponse

      console.log("Payment Intent response data:", response.data);

       // Check if clientSecret is present in the response data
      if (response.data.clientSecret) {
         setClientSecret(response.data.clientSecret);
      } else {
          // This case might indicate an API error even with a 2xx status,
          // or unexpected response structure.
           toast({
              title: "Payment Initialization Failed",
              description: "Received unexpected response from payment API.",
              variant: "destructive"
          });
           console.error("Unexpected payment intent response:", response.data);
      }

    } catch (error: any) { // Handle Axios errors
      console.error("Error creating payment intent:", error);
       let errorMessage = "Failed to initialize payment. Please try again.";
       if (error.response?.data?.detail) {
           errorMessage = error.response.data.detail;
       } else if (error.message) {
           errorMessage = error.message;
       }
       toast({
           title: "Payment Initialization Failed",
           description: errorMessage,
           variant: "destructive",
       });
    } finally {
        setIsCreatingPaymentIntent(false);
    }
  };

  // Show loading spinner while user is loading, or while creating payment intent
  if (isLoadingUser || isCreatingPaymentIntent) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderIcon className="h-12 w-12 animate-spin text-primary" />
         <span className="ml-2 text-gray-600">{isCreatingPaymentIntent ? "Setting up payment..." : "Loading user..."}</span>
      </div>
    );
  }

  // Handle case where user is null after loading (should be caught by effect, but fallback)
  if (!user) {
      return null; // Effect should navigate, render nothing or a minimal message
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pass user and isLoggedIn state to TopNavigation */}
      <TopNavigation user={user} isLoggedIn={user !== null} /> {/* isLoggedIn check refined */}

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Secure Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your one-time payment</p>
        </div>

        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Safe and secure payment processing with Stripe
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!clientSecret ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0.01" // Minimum amount
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="text-xl"
                    disabled={isCreatingPaymentIntent}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Payment Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isCreatingPaymentIntent}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreatePayment}
                  disabled={isCreatingPaymentIntent}
                >
                   {isCreatingPaymentIntent ? "Processing..." : "Continue to Payment"}
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Amount:</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>Description:</span>
                    <span className="text-gray-600">{description || 'N/A'}</span> {/* Handle empty description */}
                  </div>
                </div>

                <Separator className="my-4" />

                 {/* Render Elements only if stripePromise is valid and clientSecret is available */}
                {stripePromise && clientSecret ? (
                   <Elements stripe={stripePromise} options={{ clientSecret }}>
                     <CheckoutForm />
                   </Elements>
                ) : (
                    // Should ideally not happen if clientSecret is true, but as a fallback
                    <div className="text-center text-red-500">Could not load payment form.</div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}