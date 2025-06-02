
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { UserCog, Loader2, Search, MapPinIcon } from 'lucide-react';

const formSchema = z.object({
  fullName: z.string()
    .min(3, "Full name must be at least 3 characters.")
    .max(100, "Full name seems too long."),
  location: z.string() 
    .optional() // Location is now optional
    .default("") // Default to empty string if not provided
    .refine(val => val === "" || (val.length >= 2 && val.length <= 100), { // Validate only if not empty
      message: "Location must be between 2 and 100 characters if provided."
    }),
});

type PdlSearchFormValues = z.infer<typeof formSchema>;

interface PersonSearchFormProps {
  onSubmit: (fullName: string, location: string) => Promise<void>;
  isLoading: boolean;
  formTitle?: string;
  fullNameLabel?: string;
  fullNamePlaceholder?: string;
  fullNameDescription?: string;
  locationLabel?: string;
  locationPlaceholder?: string;
  locationDescription?: string;
  buttonText?: string;
  loadingButtonText?: string;
}

export default function PersonSearchForm({ 
  onSubmit, 
  isLoading,
  formTitle = "PDL Search Parameters",
  fullNameLabel = "Target Full Name",
  fullNamePlaceholder = "[Enter Full Name to Search PDL]",
  fullNameDescription = "Provide the full name for the PDL search.",
  locationLabel = "Location (City/Region/Country - Optional)",
  locationPlaceholder = "[e.g., Dhaka, London, or Bangladesh]",
  locationDescription = "Specify a location to refine the PDL search. Leave blank for a global name search.",
  buttonText = "Search PDL",
  loadingButtonText = "Searching PDL Database..."
}: PersonSearchFormProps) {
  const form = useForm<PdlSearchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      location: '', 
    },
    mode: "onChange"
  });

  const handleSubmit = (values: PdlSearchFormValues) => {
    onSubmit(values.fullName, values.location || ""); // Pass empty string if location is undefined
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 bg-card/80 p-6 sm:p-8 rounded-lg shadow-xl border border-border/50">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-headline text-primary flex items-center">
                <UserCog className="mr-2 h-5 w-5" /> {fullNameLabel}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={fullNamePlaceholder}
                  {...field} 
                  className="text-base h-12 font-code bg-input/50 focus:bg-input border-border focus:border-primary"
                  aria-describedby="fullname-description"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription id="fullname-description" className="text-sm font-code text-muted-foreground/80">
                {fullNameDescription}
              </FormDescription>
              <FormMessage className="font-code text-destructive/80" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-headline text-primary flex items-center">
                <MapPinIcon className="mr-2 h-5 w-5" /> {locationLabel}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={locationPlaceholder}
                  {...field} 
                  className="text-base h-12 font-code bg-input/50 focus:bg-input border-border focus:border-primary"
                  aria-describedby="location-description"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription id="location-description" className="text-sm font-code text-muted-foreground/80">
                {locationDescription}
              </FormDescription>
              <FormMessage className="font-code text-destructive/80" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-code shadow-md hover:shadow-lg transition-all">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {loadingButtonText}
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              {buttonText}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

