
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Search, Loader2, Terminal } from 'lucide-react';

const formSchema = z.object({
  phoneNumber: z.string()
    .min(1, "Phone number is required.")
    .regex(/^(?:\+8801|8801|01)[13-9]\d{8}$/, "Invalid BD Phone Number. Format: 01XXXXXXXXX or +8801XXXXXXXXX")
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
    mode: "onChange"
  });

  const handleSubmit = (values: PhoneNumberFormValues) => {
    onSubmit(values.phoneNumber);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 bg-card/80 p-6 sm:p-8 rounded-lg shadow-xl border border-border/50">
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-headline text-primary flex items-center">
                <Terminal className="mr-2 h-5 w-5" /> Target Phone Number
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="[Enter BD Number e.g., 01712345678]" 
                  {...field} 
                  className="text-base h-12 font-code bg-input/50 focus:bg-input border-border focus:border-primary"
                  aria-describedby="phone-description"
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription id="phone-description" className="text-sm font-code text-muted-foreground/80">
                Initiate public record scan for the provided number.
              </FormDescription>
              <FormMessage className="font-code text-destructive/80" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-code shadow-md hover:shadow-lg transition-all">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              SCANNING_PROTOCOL_ACTIVE...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              [Execute Scan]
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
