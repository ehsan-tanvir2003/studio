"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Search, Loader2 } from 'lucide-react';

// Matches 01XXXXXXXXX or +8801XXXXXXXXX (or 8801XXXXXXXXX)
// Operator codes start with 1 or 3-9 after the '01' or '+8801' prefix.
const formSchema = z.object({
  phoneNumber: z.string()
    .min(1, "Phone number is required.")
    .regex(/^(?:\+8801|8801|01)[13-9]\d{8}$/, "Please enter a valid Bangladeshi phone number (e.g., 01712345678 or +8801712345678).")
});

type PhoneNumberFormValues = z.infer<typeof formSchema>;

interface PhoneNumberFormProps {
  onSubmit: (phoneNumber: string) => Promise<void>;
  isLoading: boolean;
}

export default function PhoneNumberForm({ onSubmit, isLoading }: PhoneNumberFormProps) {
  const form = useForm<PhoneNumberFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
    },
    mode: "onChange" // Validate on change for better user experience
  });

  const handleSubmit = (values: PhoneNumberFormValues) => {
    onSubmit(values.phoneNumber);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 bg-card p-6 sm:p-8 rounded-lg shadow-lg">
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-headline">Phone Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., 01712345678" 
                  {...field} 
                  className="text-base h-12"
                  aria-describedby="phone-description"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription id="phone-description" className="text-sm">
                Enter a Bangladeshi phone number to start your search.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Scan Number
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
