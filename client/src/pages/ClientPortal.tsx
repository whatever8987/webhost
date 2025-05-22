import { TopNavigation } from "@/components/layout/TopNavigation";
import { TabNavigation } from "@/components/layout/TabNavigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, EyeIcon, PanelLeft, Image, FileText, Clock, MapPin } from "lucide-react";
import { API } from "@/lib/api";
import { useState, useEffect } from "react";

// Define basic types if you don't have them from @shared/schema
type User = {
  id: number;
  username: string;
  email: string;
  phone_number?: string;
  role: 'user' | 'admin';
};

type Salon = {
  id: number;
  name: string;
  address?: string;
  location: string;
  email?: string;
  phone_number?: string;
  description?: string;
  services?: string[];
  opening_hours?: string;
  template_id?: number;
  claimed: boolean;
  sample_url: string;
};

type Template = {
  id: number;
  name: string;
  description: string;
};

const salonSchema = z.object({
  name: z.string().min(2, {
    message: "Salon name must be at least 2 characters.",
  }),
  address: z.string().min(5, {
    message: "Please enter a valid address.",
  }),
  location: z.string().min(2, {
    message: "Please enter a city or location.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).optional().nullable(),
  phone_number: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  services: z.array(z.string()).optional().nullable(),
  opening_hours: z.string().optional().nullable(),
  template_id: z.number().optional().nullable(),
});

export default function ClientPortal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [editMode, setEditMode] = useState(false);
  
  // Get template ID from URL if it exists
  const searchParams = new URLSearchParams(window.location.search);
  const templateIdParam = searchParams.get('template');

  // Get user, salon, and templates data using the new API client
  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      try {
        const response = await API.user.getProfile();
        return response.data;
      } catch (error) {
        if (error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });

  const { data: salon, isLoading: isLoadingSalon } = useQuery<Salon | null>({
    queryKey: ["userSalon"],
    queryFn: async () => {
      try {
        const response = await API.user.getProfile();
        if (response.data.salon_id) {
          const salonResponse = await API.salons.get(response.data.salon_id);
          return salonResponse.data;
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    enabled: !!user,
  });

  const { data: templates, isLoading: isLoadingTemplates } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      const response = await API.templates.list();
      return response.data.results;
    },
    retry: false,
  });

  const salonForm = useForm<z.infer<typeof salonSchema>>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: "",
      address: "",
      location: "",
      email: "",
      phone_number: "",
      description: "",
      services: [],
      opening_hours: "",
      template_id: templateIdParam ? parseInt(templateIdParam) : null,
    },
  });

  // Update form values when salon data is loaded
  useEffect(() => {
    if (salon) {
      salonForm.reset({
        name: salon.name,
        address: salon.address || "",
        location: salon.location,
        email: salon.email || "",
        phone_number: salon.phone_number || "",
        description: salon.description || "",
        services: salon.services || [],
        opening_hours: salon.opening_hours || "",
        template_id: salon.template_id || null,
      });
    }
  }, [salon, salonForm]);

  const createOrUpdateSalonMutation = useMutation({
    mutationFn: async (data: z.infer<typeof salonSchema>) => {
      if (salon) {
        const response = await API.salons.update(salon.id, data);
        return response.data;
      } else {
        const response = await API.salons.create(data);
        return response.data;
      }
    },
    onSuccess: (data: Salon) => {
      toast({
        title: salon ? "Website updated" : "Website created",
        description: salon 
          ? "Your website has been updated successfully." 
          : "Your website has been created successfully.",
      });
      API.queryClient.setQueryData(["userSalon"], data);
      setEditMode(false);
    },
    onError: (error: any) => {
      toast({
        title: salon ? "Update failed" : "Creation failed",
        description: error.response?.data?.message || "Failed to save website data.",
        variant: "destructive",
      });
    },
  });

  const claimSalonMutation = useMutation({
    mutationFn: async (salonId: number) => {
      const response = await API.salons.claim(salonId);
      return response.data;
    },
    onSuccess: (data: Salon) => {
      toast({
        title: "Website claimed",
        description: "You have successfully claimed this website.",
      });
      API.queryClient.setQueryData(["userSalon"], data);
    },
    onError: (error: any) => {
      toast({
        title: "Claim failed",
        description: error.response?.data?.message || "Failed to claim website.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof salonSchema>) => {
    createOrUpdateSalonMutation.mutate(data);
  };

  const handleClaimSalon = () => {
    if (salon && salon.id) {
      claimSalonMutation.mutate(salon.id);
    }
  };

  const addService = () => {
    const currentServices = salonForm.getValues().services || [];
    salonForm.setValue("services", [...currentServices, "New Service - $0"]);
  };

  const removeService = (index: number) => {
    const currentServices = salonForm.getValues().services || [];
    salonForm.setValue(
      "services", 
      currentServices.filter((_, i) => i !== index)
    );
  };

  const handleUpdateService = (index: number, value: string) => {
    const currentServices = salonForm.getValues().services || [];
    const newServices = [...currentServices];
    newServices[index] = value;
    salonForm.setValue("services", newServices);
  };

  const handlePreviewWebsite = () => {
    if (salon) {
      window.open(`/demo/${salon.sample_url}`, '_blank');
    } else {
      toast({
        title: "Preview unavailable",
        description: "Save your website first to preview it.",
        variant: "destructive",
      });
    }
  };

  // If loading, show loading spinner
  if (isLoadingUser || isLoadingSalon || isLoadingTemplates) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    navigate("/login?redirect=/portal");
    return null;
  }

  // Set up tabs for portal
  const portalTabs = [
    { name: "My Website", href: "/portal" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Subscription", href: "/subscribe" },
    { name: "Account", href: "/account" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation user={user} isLoggedIn={true} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Website Management</h1>
            <p className="mt-2 text-gray-600">
              {salon ? "Edit your website content and settings" : "Set up your salon website"}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handlePreviewWebsite}
              disabled={!salon}
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              Preview Website
            </Button>
            {salon && !editMode ? (
              <Button onClick={() => setEditMode(true)}>
                Edit Website
              </Button>
            ) : null}
          </div>
        </div>

        <TabNavigation tabs={portalTabs} activeTab="portal" />

        <div className="mt-6">
          {/* If salon exists and not in edit mode, show the salon details */}
          {salon && !editMode ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{salon.name}</CardTitle>
                  <CardDescription>{salon.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                      <div className="space-y-2">
                        <p><strong>Email:</strong> {salon.email || "Not provided"}</p>
                        <p><strong>Phone:</strong> {salon.phoneNumber || "Not provided"}</p>
                        <p><strong>Address:</strong> {salon.address}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Website Details</h3>
                      <div className="space-y-2">
                        <p><strong>Website URL:</strong> {window.location.origin}/demo/{salon.sampleUrl}</p>
                        <p><strong>Template:</strong> {templates?.find(t => t.id === salon.templateId)?.name || "Custom"}</p>
                        <p><strong>Status:</strong> <span className="text-green-600 font-medium">Active</span></p>
                      </div>
                    </div>
                  </div>

                  {salon.description && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">About</h3>
                      <p className="text-gray-700">{salon.description}</p>
                    </div>
                  )}

                  {salon.services && salon.services.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Services</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {salon.services.map((service, idx) => (
                          <li key={idx} className="text-gray-700">{service}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {salon.openingHours && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Opening Hours</h3>
                      <p className="text-gray-700 whitespace-pre-line">{salon.openingHours}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {!salon.claimed && (
                    <Button onClick={handleClaimSalon}>
                      Claim This Website
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          ) : (
            /* If no salon exists or in edit mode, show the form to create/edit salon */
            <Form {...salonForm}>
              <form onSubmit={salonForm.handleSubmit(onSubmit)} className="space-y-8">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="general" className="flex items-center">
                      <PanelLeft className="mr-2 h-4 w-4" />
                      General
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="services" className="flex items-center">
                      <Image className="mr-2 h-4 w-4" />
                      Services
                    </TabsTrigger>
                    <TabsTrigger value="hours" className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Hours
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Business Information</CardTitle>
                        <CardDescription>Basic information about your salon</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={salonForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salon Name*</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Glamour Nails & Spa" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={salonForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address*</FormLabel>
                                <FormControl>
                                  <Input placeholder="123 Main St, Suite 101" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={salonForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Miami" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={salonForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="contact@yoursalon.com" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={salonForm.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="(123) 456-7890" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={salonForm.control}
                          name="templateId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website Template</FormLabel>
                              <FormControl>
                                <select 
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                  value={field.value || ""}
                                >
                                  <option value="">Select a template</option>
                                  {templates?.map((template) => (
                                    <option key={template.id} value={template.id}>
                                      {template.name} - {template.description}
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormDescription>
                                Choose a template for your salon website
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Website Content</CardTitle>
                        <CardDescription>Describe your salon and services</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={salonForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>About Your Salon</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your salon, specialties, and what makes you unique..." 
                                  rows={6}
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                This content will appear on your website's homepage
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="services" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Salon Services</CardTitle>
                        <CardDescription>Add the services you offer with prices</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {(salonForm.getValues().services || []).map((service, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <Input 
                                value={service}
                                onChange={(e) => handleUpdateService(index, e.target.value)}
                                placeholder="Service Name - $Price"
                              />
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                type="button"
                                onClick={() => removeService(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" onClick={addService}>
                            Add Service
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="hours" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Business Hours</CardTitle>
                        <CardDescription>Enter your salon's opening hours</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={salonForm.control}
                          name="openingHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Opening Hours</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={`Monday: 9:00 AM - 7:00 PM\nTuesday: 9:00 AM - 7:00 PM\nWednesday: 9:00 AM - 7:00 PM\nThursday: 9:00 AM - 7:00 PM\nFriday: 9:00 AM - 8:00 PM\nSaturday: 9:00 AM - 6:00 PM\nSunday: Closed`}
                                  rows={8}
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter each day on a new line
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-3">
                  {editMode && (
                    <Button variant="outline" type="button" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={createOrUpdateSalonMutation.isPending}
                  >
                    {createOrUpdateSalonMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {salon ? "Update Website" : "Create Website"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </main>
    </div>
  );
}