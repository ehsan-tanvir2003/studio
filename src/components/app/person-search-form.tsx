
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { UserSearch, Loader2, Search, MapPinIcon } from 'lucide-react';

const formSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name seems too long."),
  city: z.string()
    .min(2, "City name must be at least 2 characters.")
    .max(100, "City name seems too long."),
});

type PersonSearchFormValues = z.infer<typeof formSchema>;

interface PersonSearchFormProps {
  onSubmit: (fullName: string, city: string) => Promise<void>;
  isLoading: boolean;
}

export default function PersonSearchForm({ onSubmit, isLoading }: PersonSearchFormProps) {
  const form = useForm<PersonSearchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      city: '',
    },
    mode: "onChange"
  });

  const handleSubmit = (values: PersonSearchFormValues) => {
    onSubmit(values.fullName, values.city);
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
                <UserSearch className="mr-2 h-5 w-5" /> Person's Full Name
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="[Full Name of the Individual]" 
                  {...field} 
                  className="text-base h-12 font-code bg-input/50 focus:bg-input border-border focus:border-primary"
                  aria-describedby="fullname-description"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription id="fullname-description" className="text-sm font-code text-muted-foreground/80">
                Provide the full name of the person whose profile you want to enrich.
              </FormDescription>
              <FormMessage className="font-code text-destructive/80" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-headline text-primary flex items-center">
                <MapPinIcon className="mr-2 h-5 w-5" /> Person's City / Region
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="[City/Region for Context e.g., London]" 
                  {...field} 
                  className="text-base h-12 font-code bg-input/50 focus:bg-input border-border focus:border-primary"
                  aria-describedby="city-description"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription id="city-description" className="text-sm font-code text-muted-foreground/80">
                Specify the person's city or general region to help identify the correct profile.
              </FormDescription>
              <FormMessage className="font-code text-destructive/80" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-code shadow-md hover:shadow-lg transition-all">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Enriching Profile...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              [Enrich Profile]
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
    
