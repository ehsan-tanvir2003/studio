
"use client";

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, UploadCloud, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  imageFile: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please select an image file.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are accepted."
    )
});

type RapidApiUploadFormValues = z.infer<typeof formSchema>;

interface RapidApiImageUploadFormProps {
  onSubmit: (imageDataUri: string) => Promise<void>;
  isLoading: boolean;
}

export default function RapidApiImageUploadForm({ onSubmit, isLoading }: RapidApiImageUploadFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const form = useForm<RapidApiUploadFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange"
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationResult = formSchema.shape.imageFile.safeParse(event.target.files);
      if(!validationResult.success) {
        form.setError("imageFile", { type: "manual", message: validationResult.error.errors[0].message });
        setPreviewUrl(null);
        return;
      } else {
         form.clearErrors("imageFile");
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (values: RapidApiUploadFormValues) => {
    if (!previewUrl) {
      toast({
        variant: "destructive",
        title: "No Image Selected",
        description: "Please select an image file to upload.",
      });
      return;
    }
    await onSubmit(previewUrl);
  };

  return (
    <Card className="w-full shadow-xl bg-card/80 border border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <UploadCloud className="mr-3 h-7 w-7" />
          Upload Image for Search
        </CardTitle>
        <CardDescription className="font-code text-muted-foreground/80">
          Select an image to perform a reverse image search using the configured RapidAPI service.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="imageFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-code text-muted-foreground">Image File</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                      className="font-code bg-input/50 focus:bg-input border-border focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      ref={fileInputRef}
                      onChange={(e) => {
                        field.onChange(e.target.files); 
                        handleFileChange(e); 
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="font-code text-xs text-muted-foreground/70">
                    Max 5MB. JPG, PNG, WEBP accepted.
                  </FormDescription>
                  <FormMessage className="font-code text-destructive/80" />
                </FormItem>
              )}
            />

            {previewUrl && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-code text-muted-foreground">Image Preview:</p>
                <Image 
                  src={previewUrl} 
                  alt="Image preview" 
                  width={150} 
                  height={150} 
                  className="rounded-md border border-border object-cover shadow-md"
                  data-ai-hint="uploaded image preview"
                />
              </div>
            )}
            
            <div className="flex items-start text-xs text-muted-foreground/90 mt-1 p-3 bg-muted/30 rounded-md border border-border/20">
              <AlertCircle className="mr-2 h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <span>
                This tool uses a RapidAPI service. Ensure API key (RAPIDAPI_KEY), host (RAPIDAPI_HOST), and endpoint path (in `src/app/actions.ts`) are correctly configured. The specific API's request format and response structure are handled in `src/ai/flows/rapidapi-face-search-flow.ts`.
              </span>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !form.formState.isValid || !previewUrl} 
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-code shadow-md hover:shadow-lg transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  SEARCHING WITH IMAGE...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  [Search with Image]
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
