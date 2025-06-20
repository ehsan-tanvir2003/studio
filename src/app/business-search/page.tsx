
"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Search, Briefcase, FileText, Loader2, Info, FileSpreadsheet, FileType, Database, Settings, KeyRound, FolderInput } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { searchBusinessesAction } from '@/app/actions';
import type { BusinessInfo, BusinessSearchOutput } from '@/ai/flows/business-search-flow';
import { Badge } from '@/components/ui/badge';

const ADMIN_PIN = "56622";

export default function BusinessSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BusinessInfo[] | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingUpload, setIsLoadingUpload] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const [pinInput, setPinInput] = useState('');
  const [isAdminSectionVisible, setIsAdminSectionVisible] = useState(false);
  const [driveFolderIdInput, setDriveFolderIdInput] = useState('');
  // In a real app, this would be fetched from a backend config
  const [currentDriveFolderId, setCurrentDriveFolderId] = useState(process.env.NEXT_PUBLIC_GOOGLE_DRIVE_BUSINESS_DATA_FOLDER_ID || 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE');


  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      setIsLoadingUpload(true);
      toast({
        title: "Document Upload Simulation",
        description: `Files like '${newFiles.map(f => f.name).join(', ')}' selected. In a full system, these would be uploaded, processed, and indexed from Google Drive.`,
        variant: "default",
        duration: 7000,
      });
      setIsLoadingUpload(false);
      event.target.value = ''; 
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
        if (response.matches.length === 0 && !response.message?.includes("No business data has been indexed yet")) {
          toast({ title: "No Results", description: response.message || `No businesses found matching "${searchTerm}" in the current (mock/empty) index.` });
        } else {
          toast({ title: "Search Complete", description: response.message || `Found ${response.matches.length} business(es).` });
        }
        if (response.message?.includes("No business data has been indexed yet")) {
             toast({
                title: "Data Store Empty",
                description: "The business data store is currently empty or not connected. Uploaded documents require backend processing and Google Drive integration to be searchable.",
                variant: "default",
                duration: 8000
            });
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

  const handlePinSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAdminSectionVisible(true);
      toast({ title: "Admin Access Granted", description: "You can now manage the Google Drive Folder ID." });
    } else {
      toast({ variant: "destructive", title: "Incorrect PIN", description: "The PIN you entered is incorrect." });
    }
    setPinInput('');
  };

  const handleSaveFolderId = () => {
    // In a real application, this would call a backend action to update the folder ID
    // and trigger re-indexing of the Google Drive folder.
    if (!driveFolderIdInput.trim()) {
        toast({ variant: "destructive", title: "Folder ID Empty", description: "Please enter a valid Google Drive Folder ID." });
        return;
    }
    setCurrentDriveFolderId(driveFolderIdInput); // Simulate update
    toast({ 
        title: "Folder ID (Conceptual) Update", 
        description: `New Google Drive Folder ID '${driveFolderIdInput}' would be saved. Re-indexing from this new folder would start. (Backend required for actual operation)`,
        duration: 8000
    });
    // setDriveFolderIdInput(''); // Optionally clear input
  };


  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4">
      <header className="mb-10 sm:mb-12 text-center">
        <Briefcase className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">Intelligent Business Search</h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg font-code">
          Search information from documents (PDF, XLS) stored in a designated Google Drive folder.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-12">

        <Card className="shadow-lg border-border/30">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <Upload className="w-6 h-6 mr-2" />
              Step 1: Manage Data Source (Google Drive)
            </CardTitle>
            <CardDescription className="font-code text-sm">
              Ensure your business documents (PDF, XLS, etc.) are in the configured Google Drive folder.
              The system will attempt to process and index them for search.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Alert variant="default" className="bg-blue-500/10 border-blue-500/30">
              <Database className="h-5 w-5 text-blue-600" />
              <AlertTitle className="font-semibold text-blue-700">Google Drive Integration & AI Processing</AlertTitle>
              <AlertDescription className="text-xs text-blue-600 space-y-1">
                <p>For this tool to be fully operational:</p>
                <ul className="list-disc list-inside pl-4">
                  <li>A backend system must securely connect to Google Drive using the configured Folder ID.</li>
                  <li>It needs to periodically scan for new/updated files (PDFs, Excel, etc.).</li>
                  <li>Content from these files must be extracted.</li>
                  <li>Extracted text should be chunked and converted to embeddings using an AI model (e.g., Gemini).</li>
                  <li>These embeddings and their source metadata must be stored in a vector database.</li>
                  <li>The search functionality will then query this vector database for semantic ("relevant" or "nearby") matches.</li>
                </ul>
                <p className="mt-2">The file input below is for conceptual demonstration of uploads. The current search operates on a placeholder/empty dataset.</p>
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
                <Input
                type="file"
                multiple
                accept=".pdf,.xls,.xlsx,.*"
                onChange={handleFileChange}
                className="font-code bg-input/50 focus:bg-input border-border focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 flex-grow"
                disabled={isLoadingUpload || isLoadingSearch}
                />
                {isLoadingUpload && <Button variant="outline" disabled className="h-10"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</Button>}
            </div>
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-code text-muted-foreground">Selected files (for conceptual upload):</p>
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
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-border/30">
            <CardHeader>
                <CardTitle className="font-headline text-xl text-primary flex items-center">
                <Settings className="w-6 h-6 mr-2" />
                Admin Settings (Conceptual)
                </CardTitle>
                <CardDescription className="font-code text-sm">
                Manage the Google Drive folder used as the data source. (Requires PIN)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!isAdminSectionVisible ? (
                <form onSubmit={handlePinSubmit} className="flex gap-2 items-end">
                    <div className="flex-grow">
                        <label htmlFor="admin-pin" className="text-xs font-code text-muted-foreground">Enter Admin PIN</label>
                        <Input
                            id="admin-pin"
                            type="password"
                            placeholder="PIN"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            className="font-code h-10"
                        />
                    </div>
                    <Button type="submit" className="h-10 font-code px-4">
                        <KeyRound className="mr-2 h-4 w-4" /> Unlock
                    </Button>
                </form>
                ) : (
                <div className="space-y-4 p-4 border border-dashed border-primary/50 rounded-md bg-background">
                    <p className="text-sm font-code text-green-600">Admin access unlocked.</p>
                    <div>
                        <label htmlFor="drive-folder-id" className="text-xs font-code text-muted-foreground">
                            Google Drive Folder ID for Business Documents
                        </label>
                        <div className="flex gap-2">
                            <Input
                                id="drive-folder-id"
                                type="text"
                                placeholder="Enter Google Drive Folder ID"
                                value={driveFolderIdInput}
                                onChange={(e) => setDriveFolderIdInput(e.target.value)}
                                className="font-code h-10 flex-grow"
                            />
                            <Button onClick={handleSaveFolderId} className="h-10 font-code px-4">
                                <FolderInput className="mr-2 h-4 w-4"/> Save
                            </Button>
                        </div>
                        <p className="text-xs font-code text-muted-foreground mt-1">
                            Current (Conceptual) Folder ID: <span className="text-primary">{currentDriveFolderId}</span>
                        </p>
                    </div>
                     <Alert variant="default" className="bg-amber-500/10 border-amber-500/30">
                        <Info className="h-5 w-5 text-amber-600" />
                        <AlertTitle className="font-semibold text-amber-700">Backend Required</AlertTitle>
                        <AlertDescription className="text-xs text-amber-600">
                           Changing and saving the Folder ID here is for UI demonstration. A full backend implementation is needed to make this setting persistent, connect to the new Google Drive folder, and trigger re-indexing of its contents.
                        </AlertDescription>
                    </Alert>
                    <Button onClick={() => {setIsAdminSectionVisible(false); setDriveFolderIdInput('');}} variant="outline" size="sm" className="text-xs">Lock Admin Settings</Button>
                </div>
                )}
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
              "Relevant" and "nearby" matches require AI-powered semantic search on indexed Drive content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="search"
                placeholder="e.g., tech solutions, financial services, specific project names..."
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
                {searchResults && searchResults.length === 0 && searchTerm ? `No results found for "${searchTerm}". The data store is likely empty or not yet connected to Google Drive.` : 'Upload documents via Google Drive and configure the Admin Settings to start searching.'}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

    