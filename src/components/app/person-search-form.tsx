
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { UserCog, Loader2, Search, MapPinIcon, BrainCircuit } from 'lucide-react'; // Changed UserSearch to UserCog or BrainCircuit

const formSchema = z.object({
  fullName: z.string()
    .min(3, "Full name must be at least 3 characters.")
    .max(100, "Full name seems too long."),
  locationHint: z.string() // Changed from city to locationHint
    .min(2, "Location hint must be at least 2 characters.")
    .max(100, "Location hint seems too long."),
});

type PersonProfileFormValues = z.infer<typeof formSchema>; // Renamed for clarity

interface PersonSearchFormProps {
  onSubmit: (fullName: string, locationHint: string) => Promise<void>;
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
  formTitle = "Initiate Search",
  fullNameLabel = "Person's Full Name",
  fullNamePlaceholder = "[Enter Full Name to Search]",
  fullNameDescription = "Provide the full name of the person you are searching for.",
  locationLabel = "Person's City / Region",
  locationPlaceholder = "[Enter City/Region e.g., Dhaka]",
  locationDescription = "Specify the person's city or general region to refine the search.",
  buttonText = "[Initiate Search]",
  loadingButtonText = "Searching Intel Database..."
}: PersonSearchFormProps) {
  const form = useForm<PersonProfileFormValues>({ // Use renamed type
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      locationHint: '', // Changed from city
    },
    mode: "onChange"
  });

  const handleSubmit = (values: PersonProfileFormValues) => {
    onSubmit(values.fullName, values.locationHint); // Pass locationHint
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
          name="locationHint" 
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
              <BrainCircuit className="mr-2 h-5 w-5" /> {/* Or Search icon if preferred */}
              {buttonText}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
