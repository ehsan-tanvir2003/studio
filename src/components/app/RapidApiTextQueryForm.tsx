
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, AlertCircle, FileSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  query: z.string().min(1, "Search query cannot be empty.").max(200, "Query is too long (max 200 chars)."),
  // limit: z.coerce.number().min(1).max(50).optional().default(10), // Optional limit field
});

type RapidApiTextQueryFormValues = z.infer<typeof formSchema>;

interface RapidApiTextQueryFormProps {
  onSubmit: (query: string, limit?: number) => Promise<void>;
  isLoading: boolean;
}

export default function RapidApiTextQueryForm({ onSubmit, isLoading }: RapidApiTextQueryFormProps) {
  const { toast } = useToast();

  const form = useForm<RapidApiTextQueryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
      // limit: 10,
    },
    mode: "onChange"
  });

  const handleSubmit = async (values: RapidApiTextQueryFormValues) => {
    await onSubmit(values.query /*, values.limit*/);
  };

  return (
    <Card className="w-full shadow-xl bg-card/80 border border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <FileSearch className="mr-3 h-7 w-7" />
          Image Search Query
        </CardTitle>
        <CardDescription className="font-code text-muted-foreground/80">
          Enter a text query to search for images using the configured RapidAPI service.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-code text-muted-foreground">Search Term</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 'sunset over mountains', 'cute cats'" 
                      className="font-code bg-input/50 focus:bg-input border-border focus:border-primary h-12 text-base"
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="font-code text-xs text-muted-foreground/70">
                    Describe the image you are looking for.
                  </FormDescription>
                  <FormMessage className="font-code text-destructive/80" />
                </FormItem>
              )}
            />
            {/* 
            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-code text-muted-foreground">Number of Results (1-50)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1"
                      max="50"
                      placeholder="e.g., 10" 
                      className="font-code bg-input/50 focus:bg-input border-border focus:border-primary"
                      {...field} 
                      disabled={isLoading}
                      onChange={event => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage className="font-code text-destructive/80" />
                </FormItem>
              )}
            />
            */}
            
            <div className="flex items-start text-xs text-muted-foreground/90 mt-1 p-3 bg-muted/30 rounded-md border border-border/20">
              <AlertCircle className="mr-2 h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span>
                This tool uses the Real Time Image Search API on RapidAPI. Ensure your API key and host are correctly configured.
                The response structure is handled by the Genkit flow; adjustments might be needed if the API changes.
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
                  SEARCHING IMAGES...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  [Find Images]
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
