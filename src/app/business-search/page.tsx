
"use client";

import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Search, Briefcase, FileText, Loader2, Info, FileSpreadsheet, FileType } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { searchBusinessesAction } from '@/app/actions';
import type { BusinessInfo, BusinessSearchOutput } from '@/ai/flows/business-search-flow';

export default function BusinessSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BusinessInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);
      toast({
        title: "Files Selected",
        description: `${newFiles.length} file(s) added to the list. (Note: Upload and processing not implemented in this prototype).`,
      });
      // Reset file input to allow selecting the same file again if needed
      event.target.value = '';
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Please enter a search term.");
      toast({ variant: "destructive", title: "Missing Search Term", description: "Please enter a term to search for." });
      return;
    }
    setIsLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const response: BusinessSearchOutput = await searchBusinessesAction(searchTerm);
      if (response.error) {
        setError(response.error);
        setSearchResults([]);
        toast({ variant: "destructive", title: "Search Error", description: response.error });
      } else {
        setSearchResults(response.matches);
        if (response.matches.length === 0) {
          toast({ title: "No Results", description: `No businesses found matching "${searchTerm}". (Searched mock data)` });
        } else {
          toast({ title: "Search Complete", description: `Found ${response.matches.length} mock business(es).` });
        }
      }
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errMessage);
      setSearchResults([]);
      toast({ variant: "destructive", title: "Operation Failed", description: errMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return <FileType className="h-5 w-5 text-red-500" />;
    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <Briefcase className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">Business Document Search</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Upload (mock) documents and search for business insights.
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-12">
        <Card className="shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <Upload className="w-6 h-6 mr-2" />
              Step 1: (Mock) Upload Documents
            </CardTitle>
            <CardDescription className="font-code text-sm">
              Select PDF or Excel files. (Note: File content processing and storage are not implemented in this prototype.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              multiple
              accept=".pdf,.xls,.xlsx"
              onChange={handleFileChange}
              className="font-code bg-input/50 focus:bg-input border-border focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              disabled={isLoading}
            />
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-code text-muted-foreground">Selected files (mock upload):</p>
                <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto bg-muted/20 p-3 rounded-md border">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="text-xs font-code text-foreground/80 flex items-center">
                       {getFileIcon(file.name)}
                       <span className="ml-2 truncate">{file.name}</span>
                       <span className="ml-auto text-muted-foreground/70 text-2xs">({(file.size / 1024).toFixed(1)} KB)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Alert variant="default" className="bg-amber-500/10 border-amber-500/30">
              <Info className="h-5 w-5 text-amber-600" />
              <AlertTitle className="font-semibold text-amber-700">Prototype Notice</AlertTitle>
              <AlertDescription className="text-xs text-amber-600">
                File uploading is for demonstration only. The content of these files is NOT processed, stored, or used in the search for this prototype. The search will query a small, predefined mock dataset.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <Search className="w-6 h-6 mr-2" />
              Step 2: Search Businesses (Mock Data)
            </CardTitle>
            <CardDescription className="font-code text-sm">
              Enter terms to search the mock business dataset.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="search"
                placeholder="e.g., tech solutions, financial services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="font-code h-11 text-base"
                disabled={isLoading}
              />
              <Button onClick={handleSearch} disabled={isLoading || !searchTerm.trim()} className="h-11 font-code px-6">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md border border-primary/30">
            <div role="status" className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg text-primary font-code font-medium">
                [SEARCHING_MOCK_DATA...]
              </p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="mt-6 shadow-md">
            <Briefcase className="h-5 w-5" />
            <AlertTitle>Search Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {searchResults && !isLoading && (
          <div className="space-y-6 mt-8">
            <h2 className="text-2xl font-headline text-center text-primary">
              {searchResults.length > 0 ? "Search Results (from Mock Data)" : "No Matching Mock Businesses Found"}
            </h2>
            {searchResults.length > 0 ? (
              searchResults.map((biz) => (
                <Card key={biz.id} className="shadow-md hover:shadow-lg transition-shadow bg-card/80">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg text-accent">{biz.name}</CardTitle>
                    <CardDescription className="font-code text-xs">{biz.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-body text-foreground/90">{biz.summary}</p>
                    {biz.keywords && biz.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {biz.keywords.map(kw => <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>)}
                      </div>
                    )}
                  </CardContent>
                  {biz.contact && (
                     <CardFooter className="text-xs font-code text-muted-foreground border-t pt-3 mt-3 space-x-4">
                        {biz.contact.phone && <p>Phone: {biz.contact.phone}</p>}
                        {biz.contact.email && <p>Email: {biz.contact.email}</p>}
                        {biz.contact.address && <p>Address: {biz.contact.address}</p>}
                    </CardFooter>
                  )}
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground font-code">
                Try refining your search term or explore the mock dataset structure.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
