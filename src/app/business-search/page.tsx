
"use client";

import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Search, Briefcase, FileText, Loader2, Info, FileSpreadsheet, FileType, Database } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { searchBusinessesAction } from '@/app/actions';
import type { BusinessInfo, BusinessSearchOutput } from '@/ai/flows/business-search-flow';
import { Badge } from '@/components/ui/badge'; // Added Badge import


export default function BusinessSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BusinessInfo[] | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingUpload, setIsLoadingUpload] = useState(false); // Separate loading for upload
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Simulate calling a processing function (which currently does nothing persistent)
      setIsLoadingUpload(true);
      for (const file of newFiles) {
        // In a real app, you'd send 'file' to a backend endpoint.
        // For now, we'll just show a toast based on a conceptual function.
        // const { processAndIndexDocument } = await import('@/ai/flows/business-search-flow'); // Dynamically import if needed
        // const procResponse = await processAndIndexDocument(file, file.name); // This would be an action call
        
        // Simulating the response from the conceptual (not fully implemented) processing function
        toast({
          title: "Document Upload Initiated (Conceptual)",
          description: `Processing for '${file.name}' would start here. Full backend integration for storage and indexing is required for this to be operative.`,
          variant: "default",
          duration: 7000,
        });
      }
      setIsLoadingUpload(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Please enter a search term.");
      toast({ variant: "destructive", title: "Missing Search Term", description: "Please enter a term to search for." });
      return;
    }
    setIsLoadingSearch(true);
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
          toast({ title: "No Results", description: response.message || `No businesses found matching "${searchTerm}".` });
        } else {
          toast({ title: "Search Complete", description: `Found ${response.matches.length} business(es) in the current data store.` });
        }
      }
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errMessage);
      setSearchResults([]);
      toast({ variant: "destructive", title: "Operation Failed", description: errMessage });
    } finally {
      setIsLoadingSearch(false);
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
          Upload documents to build a searchable knowledge base for business insights.
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-12">
        <Card className="shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <Upload className="w-6 h-6 mr-2" />
              Step 1: Upload & Index Documents
            </CardTitle>
            <CardDescription className="font-code text-sm">
              Select PDF or Excel files. Uploaded documents need backend processing to be searchable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
                <Input
                type="file"
                multiple
                accept=".pdf,.xls,.xlsx"
                onChange={handleFileChange}
                className="font-code bg-input/50 focus:bg-input border-border focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 flex-grow"
                disabled={isLoadingUpload || isLoadingSearch}
                />
                {isLoadingUpload && <Button variant="outline" disabled className="h-10"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</Button>}
            </div>
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-code text-muted-foreground">Selected files (for conceptual upload & processing):</p>
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
              <Database className="h-5 w-5 text-amber-600" />
              <AlertTitle className="font-semibold text-amber-700">Backend Implementation Required</AlertTitle>
              <AlertDescription className="text-xs text-amber-600">
                For these uploaded files to be truly searchable, a backend system is needed to:
                1. Securely store the files. 2. Extract content from PDFs/Excel. 3. Index the content in a searchable database.
                The current flow (`business-search-flow.ts`) is structured to work with such a system but does not implement it.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <Search className="w-6 h-6 mr-2" />
              Step 2: Search Indexed Business Data
            </CardTitle>
            <CardDescription className="font-code text-sm">
              Enter terms to search the (currently empty or manually populated) business data store.
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
                disabled={isLoadingSearch || isLoadingUpload}
              />
              <Button onClick={handleSearch} disabled={isLoadingSearch || isLoadingUpload || !searchTerm.trim()} className="h-11 font-code px-6">
                {isLoadingSearch ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoadingSearch && (
          <div className="mt-8 text-center py-10 bg-card/50 rounded-lg shadow-md border border-primary/30">
            <div role="status" className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-lg text-primary font-code font-medium">
                [SEARCHING_INDEXED_DATA...]
              </p>
            </div>
          </div>
        )}

        {error && !isLoadingSearch && (
          <Alert variant="destructive" className="mt-6 shadow-md">
            <Briefcase className="h-5 w-5" />
            <AlertTitle>Search Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {searchResults && !isLoadingSearch && (
          <div className="space-y-6 mt-8">
            <h2 className="text-2xl font-headline text-center text-primary">
              {searchResults.length > 0 ? "Search Results" : "No Matching Businesses Found in Current Index"}
            </h2>
            {searchResults.length > 0 ? (
              searchResults.map((biz) => (
                <Card key={biz.id} className="shadow-md hover:shadow-lg transition-shadow bg-card/80">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="font-headline text-lg text-accent">{biz.name}</CardTitle>
                            <CardDescription className="font-code text-xs">{biz.category}</CardDescription>
                        </div>
                        {biz.sourceDocument && <Badge variant="outline" className="text-xs whitespace-nowrap">From: {biz.sourceDocument}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-body text-foreground/90">{biz.summary}</p>
                    {biz.extractedTextSnippets && biz.extractedTextSnippets.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">Relevant Snippets:</p>
                        {biz.extractedTextSnippets.map((snippet, i) => (
                          <blockquote key={i} className="text-xs font-code border-l-2 border-primary/50 pl-2 italic text-foreground/70">
                            "{snippet}"
                          </blockquote>
                        ))}
                      </div>
                    )}
                    {biz.keywords && biz.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {biz.keywords.map(kw => <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>)}
                      </div>
                    )}
                  </CardContent>
                  {biz.contact && (Object.values(biz.contact).some(c => c)) && (
                     <CardFooter className="text-xs font-code text-muted-foreground border-t pt-3 mt-3 space-x-4 flex-wrap gap-y-1">
                        {biz.contact.phone && <p>Phone: {biz.contact.phone}</p>}
                        {biz.contact.email && <p>Email: {biz.contact.email}</p>}
                        {biz.contact.address && <p>Address: {biz.contact.address}</p>}
                    </CardFooter>
                  )}
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground font-code">
                {searchResults && searchResults.length === 0 && searchTerm ? `No results found for "${searchTerm}". Try uploading more documents or refining your search.` : 'Upload documents and build your index to start searching.'}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

