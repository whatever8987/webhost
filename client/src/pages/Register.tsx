import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { API, setAuthTokens, clearAuthTokens } from "@/lib/api"; // Import our API client
import axios from "axios"; // Import axios for error handling

// Zod schema with enhanced validation (unchanged)
const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores allowed"),
  email: z.string()
    .email("Please enter a valid email address")
    .max(50, "Email cannot exceed 50 characters"),
  password: z.string()
   .min(8, "Password must be at least 8 characters")
  .max(50, "Password cannot exceed 50 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, // Regex: requires lowercase, uppercase, digit, min 8 chars. Allowed chars is anything (.)
    "Password must contain at least one uppercase letter, one lowercase letter, and one number."
  ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check if user is already logged in - updated to use our API client
  const { data: user, isLoading: isUserLoading } = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await API.user.getProfile();
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          clearAuthTokens();
        }
        return null;
      }
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    staleTime: Infinity,
  });

  // Redirect if already logged in (unchanged)
  useEffect(() => {
    if (!isUserLoading && user) {
      navigate(user.role === "admin" ? "/admin/dashboard" : "/dashboard", { 
        replace: true 
      });
    }
  }, [user, isUserLoading, navigate]);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  // Updated registration mutation to use our API client
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await API.auth.register({
        username: data.username,
        email: data.email,
        password: data.password,
        password2: data.confirmPassword,
      });
      return response.data;
    },
    onSuccess: (data: User) => {
      toast({
        title: "Registration successful!",
        description: `Account for ${data.username} created. Please check your email to verify your account.`,
      });
      navigate("/login", { replace: true });
    },
    onError: (error: unknown) => {
      // Handle field errors from Django
      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        
        // Map backend field names to form field names
        const fieldMap: Record<string, keyof RegisterFormData> = {
          username: "username",
          email: "email",
          password: "password",
          password2: "confirmPassword",
        };

        // Apply field-specific errors
        Object.entries(fieldMap).forEach(([backendField, formField]) => {
          if (errorData[backendField]) {
            form.setError(formField, {
              type: "server",
              message: Array.isArray(errorData[backendField]) 
                ? errorData[backendField].join(". ") 
                : errorData[backendField],
            });
          }
        });

        // Handle non-field errors
        if (errorData.detail || errorData.non_field_errors) {
          const message = errorData.detail || errorData.non_field_errors?.join(". ");
          toast({
            title: "Registration failed",
            description: message,
            variant: "destructive",
          });
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive",
        });
      }

      // Clear sensitive fields
      form.resetField("password");
      form.resetField("confirmPassword");
    },
  });

  function onSubmit(data: RegisterFormData) {
    form.clearErrors();
    registerMutation.mutate(data);
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Checking session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="font-medium text-primary hover:underline"
                >
                  Sign in here
                </Link>
              </p>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>

          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)} 
              className="space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-200"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="johndoe" 
                        {...field} 
                        autoComplete="username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        {...field} 
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              {form.formState.errors.root && (
                <div className="text-sm text-destructive text-center">
                  {form.formState.errors.root.message}
                </div>
              )}
            </form>
          </Form>

          <div className="text-center text-xs text-gray-500 mt-4">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>

      {/* Right side - Marketing */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary to-purple-600 items-center justify-center p-12">
        <div className="max-w-lg text-white">
          <h2 className="text-4xl font-bold mb-6">Welcome to Our Platform</h2>
          <p className="text-xl mb-8">
            Join thousands of professionals who are building their online presence with us.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-lg font-medium">No credit card required</p>
                <p className="text-white/90">Start with a free 14-day trial</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-lg font-medium">Cancel anytime</p>
                <p className="text-white/90">No long-term contracts</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-lg font-medium">24/7 Support</p>
                <p className="text-white/90">Dedicated customer service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}