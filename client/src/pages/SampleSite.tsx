import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useParams } from "wouter";

export default function SampleSite() {
  const { sampleUrl } = useParams<{ sampleUrl: string }>();

  const { data: salon, isLoading } = useQuery({
    queryKey: ["salon", sampleUrl],
    queryFn: async () => {
      const response = await API.salons.getBySampleUrl(sampleUrl!);
      return response.data;
    },
    enabled: !!sampleUrl,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Salon not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">{salon.name}</h1>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="relative bg-gray-50 overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div className="relative z-10 pb-8 bg-gray-50 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                  <div className="sm:text-center lg:text-left">
                    <h2 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                      <span className="block">{salon.hero_subtitle || "Welcome to our salon"}</span>
                    </h2>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      {salon.description}
                    </p>
                  </div>
                </main>
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="lg:text-center">
                <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Services</h2>
                <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  {salon.services_tagline || "Our Services"}
                </p>
              </div>

              <div className="mt-10">
                <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                  {salon.services?.map((service: any, index: number) => (
                    <div key={index} className="relative">
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                        {/* Service Icon */}
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{service.name}</p>
                      <p className="mt-2 ml-16 text-base text-gray-500">{service.description}</p>
                      <p className="mt-2 ml-16 text-base font-medium text-primary">{service.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="lg:text-center">
                <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Contact</h2>
                <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                  Get in Touch
                </p>
              </div>

              <div className="mt-10">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Location</h3>
                    <p className="mt-2 text-base text-gray-500">{salon.address}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                    <p className="mt-2 text-base text-gray-500">Phone: {salon.phone_number}</p>
                    <p className="mt-2 text-base text-gray-500">Email: {salon.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-400">
              &copy; {new Date().getFullYear()} {salon.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}