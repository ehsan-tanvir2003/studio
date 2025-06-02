"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Search, Loader2 } from 'lucide-react';

const formSchema = z.object({
  phoneNumber: z.string()
    .min(1, "Phone number is required.")
    .regex(/^(?:\+?1[-.\s]?)?(?:\(?([2-9][0-8][0-9])\)?[-.\s]?)?([2-9][0-9]{2})[-.\s]?([0-9]{4})$/, "Please enter a valid North American phone number (e.g., 123-456-7890 or (123)456-7890).")
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
                  placeholder="(e.g., 555-123-4567)" 
                  {...field} 
                  className="text-base h-12"
                  aria-describedby="phone-description"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription id="phone-description" className="text-sm">
                Enter a North American phone number to start your search.
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
