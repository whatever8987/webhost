import { TopNavigation } from "@/components/layout/TopNavigation";
import { TabNavigation } from "@/components/layout/TabNavigation";
// === FIX === Import the Button component ===
import { Button } from "@/components/ui/button";
// If you use Card component, you'd import it here too:
// import { Card } from "@/components/ui/card";
// === END FIX ===
import {
  Loader2,
  Edit,
  Eye,
  CreditCard,
  Settings,
  Sparkles,
  Globe,
  LineChart,
  Palette,
  BarChart4,
  CheckCircle,
  ArrowRight,
  Users, // Import Users icon for unique visitors
  TrendingUp // Import for popular pages
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { API, User, ReportOverviewData } from "@/lib/api"; // Import User and ReportOverviewData types
import axios from "axios"; // Import axios for error handling in catch blocks


export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [, navigate] = useLocation();

  // --- Fetch User Profile ---
  // This remains the primary auth check for this protected page
  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ["user", "me"],
    queryFn: async () => {
        // Your existing fetch logic with 401 handling and redirect
        try {
            const response = await API.user.getProfile();
            return response.data;
        } catch (error: any) {
             if (axios.isAxiosError(error) && error.response?.status === 401) {
                 // clearAuthTokens() and navigate('/login') is handled by the interceptor in api.ts
                 // Returning null here prevents component from trying to render with partial data
                 console.warn("User profile fetch failed with 401. Interceptor should handle logout.");
             } else {
                  console.error("Error fetching user profile:", error);
                  // Handle other errors (e.g., show toast)
             }
            return null;
        }
    },
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
    retry: 0, // Don't retry on initial load if 401 happens, interceptor handles redirect
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

   // --- Fetch User's Salon (if user object has salon string field) ---
   // Keep this if your API allows fetching salon details based on user association
   // If user.salon is just an identifier string, you might fetch the full salon object here
   // based on that identifier, using API.salons.getBySampleUrl or a new API.user.getSalonDetail method.
   // Based on your previous implementation attempt, let's simplify and assume we only rely on user.salon string.
   // You might need a separate query ONLY if you have an endpoint like /api/user/me/salon-detail/
   // that returns the FULL Salon object for the logged-in user.
   // Assuming for this example we *don't* have a separate full salon detail query.
   // The user.salon string is enough to know *if* they have a salon.


  const isLoggedIn = user !== undefined && user !== null;

  // Redirect admin users
  useEffect(() => {
    // Wait until user data is not loading and user object exists
    if (!isLoadingUser && user) {
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true }); // Use replace to avoid back navigation issues
      }
      // Note: No explicit redirect for non-logged-in users here.
      // The useQuery hook's 401 error handling (via the interceptor) is responsible
      // for redirecting unauthenticated users on protected routes.
    }
  }, [user, isLoadingUser, navigate]);


  // --- Fetch Tracking Report Data ---
  // Only enabled for admin users.
  const { data: analyticsData, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery<ReportOverviewData | null>({
    queryKey: ["tracking", "overview"],
    queryFn: async () => {
        try {
            // Fetch the overview report
            // You can pass date range parameters if you add date pickers later
            const response = await API.tracking.getReportOverview();
            return response.data;
        } catch (error: any) {
            console.error("Error fetching analytics data:", error);
            // Handle specific API errors if needed (e.g., permission denied)
            // If it's a 401, the global interceptor handles it.
            // If it's a 403 (Forbidden), inform the user they lack permission but don't redirect.
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                 console.warn("Access denied for analytics report.");
                 // Optionally show a toast here
                 // toast({ title: "Access Denied", description: "You do not have permission to view analytics.", variant: "destructive" });
                 return null; // Return null if permission denied
            }
             // For other errors (network, 500, etc.), react-query will handle retries if configured.
             // You can log or show a generic error toast here if needed.
             throw error; // Re-throw the error so react-query logs it or triggers retries
        }
    },
    // Only enable this query if the user is logged in AND has the 'admin' role.
    enabled: isLoggedIn && user?.role === 'admin',
    retry: 1, // Retry once on failure (excluding 401/403 handled in catch)
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });


  const userTabs = [
    { name: "Dashboard", href: "/dashboard" },
    // Only show 'My Website' tab if the user has a salon associated
    ...(user?.salon ? [{ name: "My Website", href: "/portal" }] : []),
    { name: "Billing", href: "/subscribe" },
    { name: "Account", href: "/account" },
  ];

  // Handle initial loading state (fetching user)
  // This shows a loader while the user session is being checked.
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading user session...</span>
      </div>
    );
  }

  // If user is null after loading AND isLoadingUser is false,
  // it implies the session check failed (likely 401) and the interceptor
  // should have already handled the redirect to login.
  // This return null is a safety fallback in case redirect hasn't completed yet.
  if (!user) {
       return null;
  }

  // Now, render the dashboard content since user is loaded and authenticated
  // and we know they are not an admin (as admins are redirected)

  return (
    <div className="min-h-screen bg-background">
      {/* Pass user and isLoggedIn status to TopNavigation */}
      <TopNavigation user={user} isLoggedIn={isLoggedIn} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dashboard Header */}
        <div className="py-4 md:py-10 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary/10 text-secondary mb-2">
                <Sparkles className="h-4 w-4 mr-2" /> Salon Dashboard
              </div>
              <h1 className="text-3xl font-bold">Welcome{user.username ? `, ${user.username}` : ''}!</h1>
              <p className="text-muted-foreground">Manage your salon website and subscription here.</p>
            </div>

            <div className="flex flex-wrap gap-2">
               {/* This is line 159 where the original error occurred */}
              <Button variant="outline" onClick={() => navigate('/account')}>
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
               {/* Only show Edit Website button if the user has a salon string associated */}
              {user.salon && (
                <Button className="gradient-bg border-0" onClick={() => navigate('/portal')}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Website
                </Button>
              )}
            </div>
          </div>

          {/* TabNavigation */}
          <TabNavigation tabs={userTabs} activeTab={activeTab} />
        </div>

        {/* Website Status (Simplified based on user.salon object existence) */}
        {/* Assumes user.salon is an object or null, not just a string ID */}
         <div className="mb-12">
           <h2 className="text-xl font-bold mb-6 flex items-center">
             <Globe className="h-5 w-5 mr-2 text-primary" /> Website Status
           </h2>
           <div className="glass-card overflow-hidden border border-slate-200 dark:border-slate-800">
             {/* Check if user.salon exists and has an id */}
             {user.salon && user.salon.id ? (
               <>
                 <div className="p-6">
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-xl font-bold text-foreground">{user.salon.name || 'Your Salon Website'}</h3>
                        {/* Displaying the salon sample_url from the nested salon object */}
                        {user.salon.sample_url && <p className="text-muted-foreground text-sm">Website URL: <a href={`/${user.salon.sample_url}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">/{user.salon.sample_url}</a></p>}
                     </div>
                     <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                       <CheckCircle className="h-3 w-3 mr-1" /> Linked
                     </span>
                   </div>
                   <div className="mt-6">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Manage Your Site</p>
                      <p className="text-muted-foreground text-sm">Access the portal to update your content and view your site.</p>
                   </div>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 p-4 flex justify-end space-x-2">
                   <Button className="gradient-bg border-0" size="sm" onClick={() => navigate(`/portal`)}>
                     <Edit className="h-4 w-4 mr-2" />
                     Manage Website
                   </Button>
                    {/* Add View Site button if sample_url exists */}
                   {user.salon.sample_url && (
                       <Button variant="outline" size="sm" asChild> {/* Use asChild to render Link inside Button */}
                           <Link href={`/${user.salon.sample_url}`} target="_blank">
                               <Eye className="h-4 w-4 mr-2" />
                               View Site
                           </Link>
                       </Button>
                   )}
                 </div>
               </>
             ) : (
               <div className="p-8 text-center">
                 <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                   <Globe className="h-6 w-6 text-primary" />
                 </div>
                 <h3 className="text-lg font-bold mb-2">Get Started with Your Website</h3>
                 <p className="text-muted-foreground mb-6 max-w-md mx-auto">You don't have a salon website set up yet. Create or claim your salon website in just a few minutes.</p>
                 <div className="flex justify-center">
                   <Button onClick={() => navigate('/portal')} className="gradient-bg border-0 px-8">
                     <Sparkles className="h-4 w-4 mr-2" />
                     Set Up Your Website
                   </Button>
                 </div>
               </div>
             )}
           </div>
         </div>


        {/* Analytics Overview - Only show if user is admin AND data is loaded */}
        {/* This section correctly checks for admin role and renders fetched data */}
        {user?.role === 'admin' && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <BarChart4 className="h-5 w-5 mr-2 text-purple-500" /> Website Analytics
            </h2>
            {isLoadingAnalytics ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                <span className="ml-2 text-muted-foreground">Loading analytics...</span>
              </div>
            ) : analyticsError ? (
               // Explicitly check for 403 (Access Denied) vs other errors
                <div className="text-center p-8 text-red-500">
                    {(analyticsError as any).response?.status === 403
                     ? "You do not have permission to view analytics."
                     : `Error loading analytics: ${(analyticsError as any).message || 'Unknown Error'}`
                    }
                </div>
            ) : analyticsData ? (
              <>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                   {/* Total Visits */}
                   <div className="glass-card p-6">
                     <div className="flex justify-between items-start mb-4">
                       <h3 className="text-sm font-medium text-muted-foreground">Total Visits</h3>
                       <LineChart className="h-5 w-5 text-purple-500" />
                     </div>
                     <p className="text-3xl font-bold mb-1">{analyticsData.total_visits}</p>
                      {/* Add growth percentage if your backend provides it */}
                     {/* <p className="text-sm text-green-500">+12% this month</p> */}
                   </div>

                    {/* Estimated Unique Visitors */}
                   <div className="glass-card p-6">
                     <div className="flex justify-between items-start mb-4">
                       <h3 className="text-sm font-medium text-muted-foreground">Unique Visitors (Est.)</h3>
                       <Users className="h-5 w-5 text-blue-500" /> {/* Using Users icon */}
                     </div>
                     <p className="text-3xl font-bold mb-1">{analyticsData.estimated_unique_visitors}</p>
                      {/* Add growth percentage */}
                   </div>

                    {/* Unique Authenticated Users (Optional) */}
                   {/* <div className="glass-card p-6">
                     <div className="flex justify-between items-start mb-4">
                       <h3 className="text-sm font-medium text-muted-foreground">Logged-in Visitors</h3>
                       <User className="h-5 w-5 text-cyan-500" />
                     </div>
                     <p className="text-3xl font-bold mb-1">{analyticsData.unique_authenticated_users}</p>
                   </div> */}

                    {/* Add other key metrics here */}
                     {/* Example: Total Appointment Requests (if you log these) */}
                      {/* <div className="glass-card p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-sm font-medium text-muted-foreground">Appt. Requests</h3>
                          <CalendarCheck2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="text-3xl font-bold mb-1">?</p>
                      </div> */}

                    {/* Display Date Range */}
                   <div className="glass-card p-6 lg:col-span-2"> {/* Span 2 columns on large screens */}
                     <h3 className="text-sm font-medium text-muted-foreground mb-4">Report Period</h3>
                     <p className="text-xl font-bold">
                       {analyticsData.date_range.start_date || 'N/A'} to {analyticsData.date_range.end_date || 'N/A'}
                     </p>
                      {/* Optional: Add date pickers here to allow users to change the range */}
                   </div>

                 </div>

                 {/* Visits by Day Chart (You'll need a charting library) */}
                 <div className="glass-card p-6 mb-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                       <LineChart className="h-5 w-5 mr-2 text-primary" /> Visits Trend
                    </h3>
                    {/* Placeholder for your chart */}
                    {analyticsData.visits_by_day && analyticsData.visits_by_day.length > 0 ? (
                        // Render Chart Component Here, passing analyticsData.visits_by_day
                        // Example: <VisitsChart data={analyticsData.visits_by_day} />
                        <div className="h-64 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-md text-muted-foreground">
                           [Visits by Day Chart Placeholder]
                           {/* Data: {JSON.stringify(analyticsData.visits_by_day)} */}
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground">No visit data for this period.</div>
                    )}
                 </div>

                 {/* Most Popular Pages */}
                 <div className="glass-card p-6">
                     <h3 className="text-lg font-bold mb-4 flex items-center">
                       <TrendingUp className="h-5 w-5 mr-2 text-secondary" /> Most Popular Pages
                     </h3>
                     {analyticsData.popular_pages && analyticsData.popular_pages.length > 0 ? (
                        <ul className="space-y-2">
                           {analyticsData.popular_pages.map((page, index) => (
                             <li key={index} className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>{page.path}</span>
                                <span className="font-medium text-foreground">{page.count} visits</span>
                             </li>
                           ))}
                        </ul>
                     ) : (
                         <div className="text-center text-muted-foreground">No page view data for this period.</div>
                     )}
                 </div>


              </>
            ) : (
               // Message if user is admin but there's no data yet (analyticsData is null/undefined after loading)
                <div className="text-center p-8 text-muted-foreground">
                    No analytics data available yet.
                </div>
            )}
          </div>
        )}


        {/* Quick Actions - Remains the same */}
        {/* Data Overview (Placeholder Analytics) - This section should now be removed or replaced by the fetched analytics above */}
        {/* Template gallery / Subscription plans - Remains commented out as per previous fix */}


      </main>
    </div>
  );
}