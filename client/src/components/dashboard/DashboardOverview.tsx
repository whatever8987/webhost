// client/src/components/admin/DashboardOverview.tsx

import { useQuery } from "@tanstack/react-query";
// Import types and API from your custom API file
import { Stats, API } from "@/lib/api";
// Remove import from shared schema
// import { Stats } from "@shared/schema";

import { ArrowUpIcon, ArrowDownIcon, Store, LayoutGrid, CreditCard, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast"; // Added toast for error handling


export function DashboardOverview() {
   const { toast } = useToast(); // Initialize toast

  // Use the custom API object
  const { data: stats, isLoading, error } = useQuery<Stats>({
    queryKey: ["stats", "overview"], // More descriptive key
    queryFn: async () => {
        try {
           // API.stats.getStats returns AxiosResponse<Stats>
           const response = await API.stats.getStats();
           return response.data; // Return the data from the Axios response
        } catch (error: any) { // Use 'any' or AxiosError
            console.error("Error fetching stats:", error);
             let errorMessage = "Failed to load dashboard stats.";
             if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
             } else if (error.message) {
                errorMessage = error.message;
             }
            toast({
               title: "Error",
               description: errorMessage,
               variant: "destructive",
            });
            throw error; // Re-throw for react-query error state
        }
    },
    retry: 1, // Retry once on failure
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Note: The 'change' and 'changeType' are hardcoded placeholders in the original code.
  // They are not coming from the 'Stats' type defined in lib/api.ts.
  // Keep them for display purposes as they were in the original component,
  // but acknowledge they are static.
  const statItems = [
    {
      name: "Total Salons",
      // Access properties using snake_case as defined in lib/api.ts Stats type
      value: stats?.total_salons,
      change: 12, // Hardcoded placeholder
      changeType: "increase" as const, // Hardcoded placeholder
      icon: Store,
      bgColor: "bg-primary",
    },
    {
      name: "Sample Sites",
       // Access properties using snake_case
      value: stats?.sample_sites,
      change: 8, // Hardcoded placeholder
      changeType: "increase" as const, // Hardcoded placeholder
      icon: LayoutGrid,
      // Consider updating bgColor names if you have custom Tailwind classes for these
      bgColor: "bg-accent", // Assuming bg-accent exists or map to a color
    },
    {
      name: "Active Subscriptions",
       // Access properties using snake_case
      value: stats?.active_subscriptions,
      change: 20, // Hardcoded placeholder
      changeType: "increase" as const, // Hardcoded placeholder
      icon: CreditCard,
       // Consider updating bgColor names
      bgColor: "bg-secondary", // Assuming bg-secondary exists or map to a color
    },
    {
      name: "Pending Contacts",
       // Access properties using snake_case
      value: stats?.pending_contacts,
      change: 5, // Hardcoded placeholder
      changeType: "decrease" as const, // Hardcoded placeholder
      icon: HelpCircle,
       // Consider updating bgColor names
      bgColor: "bg-warning", // Assuming bg-warning exists or map to a color
    },
  ];

   // Handle loading state
  if (isLoading) {
      return (
         <div className="mt-8">
           <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
           <p className="mt-1 text-sm text-gray-500">
             Loading platform performance stats...
           </p>
           <dl className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statItems.map((item, index) => (
                     <Card key={index} className="overflow-hidden"> {/* Use index for key during skeleton */}
                         <CardContent className="p-0">
                             <div className="relative bg-white pt-5 px-4 pb-6 sm:pt-6 sm:px-6">
                                 <dt>
                                     <div className={`absolute ${item.bgColor} rounded-md p-3`}>
                                         <item.icon className="h-5 w-5 text-white" />
                                     </div>
                                     <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                                         {item.name}
                                     </p>
                                 </dt>
                                 <dd className="ml-16 pb-6 flex items-baseline">
                                     <Skeleton className="h-8 w-16" /> {/* Skeleton for value */}
                                     {/* Skeleton for change (optional) */}
                                     <Skeleton className="h-4 w-12 ml-2" />
                                 </dd>
                             </div>
                         </CardContent>
                     </Card>
                ))}
           </dl>
         </div>
      );
  }

   // Handle error state
    if (error) {
        return (
            <div className="mt-8 text-center text-red-600">
                <h2 className="text-2xl font-bold mb-2">Error Loading Stats</h2>
                <p>Could not fetch dashboard statistics. Please try refreshing the page.</p>
            </div>
        );
    }

    // Handle no data state (shouldn't happen if no error, but safety)
    if (!stats) {
         return (
            <div className="mt-8 text-center text-gray-600">
                <h2 className="text-2xl font-bold mb-2">No Stats Available</h2>
                <p>Dashboard statistics are currently not available.</p>
            </div>
         );
    }


  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
      <p className="mt-1 text-sm text-gray-500">
        Monitor your salon website platform performance at a glance. (Last updated: {stats.last_updated ? new Date(stats.last_updated).toLocaleDateString() : 'N/A'})
      </p>

      <dl className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
         
          <Card key={item.name} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative bg-white pt-5 px-4 pb-6 sm:pt-6 sm:px-6">
                <dt>
                  <div className={`absolute ${item.bgColor} rounded-md p-3`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </p>
                </dt>
                <dd className="ml-16 pb-6 flex items-baseline">
                     <p className="text-2xl font-semibold text-gray-900">
                      {/* Display value, defaulting to 0 if undefined */}
                      {item.value !== undefined ? item.value : 0}
                    </p>

                   {/* Placeholder change display - only show if value is not 0 or undefined */}
                    {item.value !== undefined && item.value !== 0 && (
                        <p
                            className={`ml-2 flex items-baseline text-sm font-semibold ${
                              item.changeType === "increase"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {item.changeType === "increase" ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {item.changeType === "increase" ? "Increased" : "Decreased"} by
                            </span>
                            {item.change}%
                         </p>
                    )}
                </dd>
              </div>
            </CardContent>
          </Card>
        ))}
      </dl>
    </div>
  );
}