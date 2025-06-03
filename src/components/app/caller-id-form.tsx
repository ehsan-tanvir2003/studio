
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Phone, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  phoneNumber: z
    .string()
    .min(7, "Phone number is too short.")
    .max(20, "Phone number is too long.")
    .regex(/^[0-9]+$/, "Phone number should only contain digits. Do not include '+', spaces, or hyphens.")
    .describe('The phone number, including country code (e.g., 1XXXXXXXXXX for US, 971501234567 for UAE).'),
});

type CallerIdFormValues = z.infer<typeof formSchema>;

interface CallerIdFormProps {
  onSubmit: (phoneNumber: string) => Promise<void>;
  isLoading: boolean;
}

export default function CallerIdForm({ onSubmit, isLoading }: CallerIdFormProps) {
  const { toast } = useToast();

  const form = useForm<CallerIdFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      phoneNumber: "",
    }
  });

  const handleSubmit = async (values: CallerIdFormValues) => {
    await onSubmit(values.phoneNumber);
  };

  return (
    <Card className="w-full shadow-xl bg-card/80 border border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <Phone className="mr-3 h-7 w-7" />
          Enter Phone Number
        </CardTitle>
        <CardDescription className="font-code text-muted-foreground/80">
          Provide the full phone number (including country code, no symbols) to search.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-code text-muted-foreground">Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="e.g., 971501234567 or 14155552671" 
                      className="font-code bg-input/50 focus:bg-input border-border focus:border-primary h-12 text-base"
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="font-code text-xs text-muted-foreground/70">
                    Enter digits only, including country code. Example: 971... for UAE, 1... for US/Canada.
                  </FormDescription>
                  <FormMessage className="font-code text-destructive/80" />
                </FormItem>
              )}
            />
            
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
