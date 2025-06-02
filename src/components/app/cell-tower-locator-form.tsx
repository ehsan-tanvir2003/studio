
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, RadioTower, Loader2, Search, Link as LinkIcon, CheckCircle, Home } from 'lucide-react';
import { locateCellTower, type CellTowerLocatorInput } from '@/app/actions';
import type { CellTowerLocation } from '@/services/unwiredlabs';

const BANGLADESH_OPERATORS = [
  { name: 'Grameenphone (GP)', mnc: '01' },
  { name: 'Robi', mnc: '02' },
  { name: 'Banglalink', mnc: '03' },
  { name: 'Teletalk', mnc: '04' },
  { name: 'Airtel (Robi)', mnc: '07' },
];

const formSchema = z.object({
  lac: z.string().min(1, "LAC is required.").regex(/^\d+$/, "LAC must be a number."),
  cellId: z.string().min(1, "Cell ID is required.").regex(/^\d+$/, "Cell ID must be a number."),
  mnc: z.string().min(1, "Operator is required."),
});

type CellTowerFormValues = z.infer<typeof formSchema>;

export default function CellTowerLocatorForm() {
  const [result, setResult] = useState<CellTowerLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CellTowerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lac: '',
      cellId: '',
      mnc: '',
    },
    mode: "onChange"
  });

  const handleSubmit = async (values: CellTowerFormValues) => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    const inputData: CellTowerLocatorInput = {
      lac: parseInt(values.lac, 10),
      cellId: parseInt(values.cellId, 10),
      mnc: values.mnc,
    };

    try {
      const response = await locateCellTower(inputData);
      if ('error' in response) {
        setError(response.error);
      } else {
        setResult(response);
      }
    } catch (e) {
      setError("An unexpected error occurred while initiating the location search.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <RadioTower className="mr-3 h-7 w-7" />
          Cell Tower Locator (Bangladesh)
        </CardTitle>
        <CardDescription>
          Find approximate location of a cell tower using its LAC and Cell ID.
          Requires an Unwired Labs API key in your <code>.env</code> file. Default radio type is LTE.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lac"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Area Code (LAC)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 12345" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cellId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cell ID (CID)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 67890" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="mnc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Operator</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an operator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BANGLADESH_OPERATORS.map(op => (
                        <SelectItem key={op.mnc} value={op.mnc}>
                          {op.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Locating...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Locate Tower
                </>
              )}
            </Button>
          </form>
        </Form>

        {isLoading && (
          <div className="mt-6 text-center py-8">
            <div role="status" className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin fill-primary" />
              <p className="mt-3 text-md text-muted-foreground font-medium">
                Querying Unwired Labs API...
              </p>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-6 shadow-sm">
            <RadioTower className="h-4 w-4" />
            <AlertTitle>Location Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {result && !isLoading && (
          <Card className="mt-6 bg-secondary/30">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-primary flex items-center">
                <CheckCircle className="mr-2 h-6 w-6 text-green-500" /> Location Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <strong>Latitude:</strong> <span className="ml-1">{result.latitude.toFixed(6)}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <strong>Longitude:</strong> <span className="ml-1">{result.longitude.toFixed(6)}</span>
              </div>
              <div className="flex items-center">
                <RadioTower className="mr-2 h-4 w-4 text-muted-foreground" />
                <strong>Accuracy:</strong> <span className="ml-1">{result.accuracy} meters</span>
              </div>
              {result.address && (
                <div className="flex items-start">
                  <Home className="mr-2 h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <strong>Address:</strong> <span className="ml-1 break-all">{result.address}</span>
                </div>
              )}
              <div className="flex items-center">
                <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <strong>Google Maps:</strong>
                <a
                  href={result.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-accent hover:underline break-all"
                >
                  View on Map
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

