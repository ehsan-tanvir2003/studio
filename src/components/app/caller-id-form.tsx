
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Phone, AlertCircle, Globe } from 'lucide-react';

const formSchema = z.object({
  countryCode: z
    .string()
    .min(1, "Country code is required.")
    .regex(/^[0-9]+$/, "Country code must be digits only.")
    .max(4, "Country code seems too long."),
  nationalNumber: z
    .string()
    .min(5, "Phone number is too short.")
    .regex(/^[0-9]+$/, "Phone number must be digits only.")
    .max(15, "Phone number seems too long."),
});

type CallerIdFormValues = z.infer<typeof formSchema>;

interface CallerIdFormProps {
  onSubmit: (countryCode: string, nationalNumber: string) => Promise<void>;
  isLoading: boolean;
}

export default function CallerIdForm({ onSubmit, isLoading }: CallerIdFormProps) {
  const form = useForm<CallerIdFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      countryCode: "",
      nationalNumber: "",
    }
  });

  const handleSubmit = async (values: CallerIdFormValues) => {
    await onSubmit(values.countryCode, values.nationalNumber);
  };

  return (
    <Card className="w-full shadow-xl bg-card/80 border border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <Phone className="mr-3 h-7 w-7" />
          Enter Phone Number
        </CardTitle>
        <CardDescription className="font-code text-muted-foreground/80">
          Provide the country code and national phone number (digits only).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem className="sm:col-span-1">
                    <FormLabel className="font-code text-muted-foreground flex items-center"><Globe className="w-4 h-4 mr-1"/>Country Code</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel"
                        placeholder="e.g., 91" 
                        className="font-code bg-input/50 focus:bg-input border-border focus:border-primary h-12 text-base"
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="font-code text-destructive/80" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationalNumber"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="font-code text-muted-foreground">National Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel"
                        placeholder="e.g., 9768836827" 
                        className="font-code bg-input/50 focus:bg-input border-border focus:border-primary h-12 text-base"
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                     <FormMessage className="font-code text-destructive/80" />
                  </FormItem>
                )}
              />
            </div>
             <FormDescription className="font-code text-xs text-muted-foreground/70">
                Example: Country Code: 1, National Number: 4155552671 (for US). Country Code: 971, National Number: 501234567 (for UAE).
            </FormDescription>
            
            <div className="flex items-start text-xs text-muted-foreground/90 mt-1 p-3 bg-muted/30 rounded-md border border-border/20">
              <AlertCircle className="mr-2 h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span>
                This tool uses the Eyecon RapidAPI service. Ensure RAPIDAPI_KEY and RAPIDAPI_EYECON_HOST are correctly configured in your environment.
              </span>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !form.formState.isValid} 
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-code shadow-md hover:shadow-lg transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  SEARCHING...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  [Get Caller Details]
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
