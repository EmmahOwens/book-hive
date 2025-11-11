import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BOOKS_TO_IMPORT = [
  { title: "A Brief History of Time", authors: ["Stephen Hawking"], isbn: "978-0553380163", publisher: "Bantam", publication_year: 1988, description: "A landmark volume in science writing by one of the great minds of our time." },
  { title: "The Selfish Gene", authors: ["Richard Dawkins"], isbn: "978-0198788607", publisher: "Oxford University Press", publication_year: 1976, description: "A gene-centered view of evolution." },
  { title: "Cosmos", authors: ["Carl Sagan"], isbn: "978-0345539434", publisher: "Random House", publication_year: 1980, description: "A personal voyage through the cosmos." },
  { title: "The Origin of Species", authors: ["Charles Darwin"], isbn: "978-0451529060", publisher: "Signet Classics", publication_year: 1859, description: "The foundation of evolutionary biology." },
  { title: "Silent Spring", authors: ["Rachel Carson"], isbn: "978-0618249060", publisher: "Houghton Mifflin", publication_year: 1962, description: "Environmental science classic." },
  { title: "The Double Helix", authors: ["James D. Watson"], isbn: "978-0743216302", publisher: "Touchstone", publication_year: 1968, description: "A personal account of the discovery of DNA structure." },
  { title: "Sapiens: A Brief History of Humankind", authors: ["Yuval Noah Harari"], isbn: "978-0062316097", publisher: "Harper", publication_year: 2015, description: "The history of the human species." },
  { title: "The Elegant Universe", authors: ["Brian Greene"], isbn: "978-0393338102", publisher: "W. W. Norton", publication_year: 1999, description: "Superstrings, hidden dimensions, and the quest for ultimate theory." },
  { title: "The Structure of Scientific Revolutions", authors: ["Thomas S. Kuhn"], isbn: "978-0226458083", publisher: "University of Chicago Press", publication_year: 1962, description: "How scientific paradigms shift." },
  { title: "Guns, Germs, and Steel", authors: ["Jared Diamond"], isbn: "978-0393317558", publisher: "W. W. Norton", publication_year: 1997, description: "The fates of human societies." },
  { title: "The Immortal Life of Henrietta Lacks", authors: ["Rebecca Skloot"], isbn: "978-1400052189", publisher: "Broadway Books", publication_year: 2010, description: "Science, ethics, and the story of HeLa cells." },
  { title: "What If?", authors: ["Randall Munroe"], isbn: "978-0544272996", publisher: "Houghton Mifflin Harcourt", publication_year: 2014, description: "Serious scientific answers to absurd hypothetical questions." },
  { title: "The Gene: An Intimate History", authors: ["Siddhartha Mukherjee"], isbn: "978-1476733524", publisher: "Scribner", publication_year: 2016, description: "The story of genetics and its impact on our lives." },
  { title: "Astrophysics for People in a Hurry", authors: ["Neil deGrasse Tyson"], isbn: "978-0393609394", publisher: "W. W. Norton", publication_year: 2017, description: "The universe explained in accessible terms." },
  { title: "The Code Breaker", authors: ["Walter Isaacson"], isbn: "978-1982115852", publisher: "Simon & Schuster", publication_year: 2021, description: "Jennifer Doudna, gene editing, and the future of humanity." },
  { title: "Thinking, Fast and Slow", authors: ["Daniel Kahneman"], isbn: "978-0374533557", publisher: "Farrar, Straus and Giroux", publication_year: 2011, description: "The psychology of judgment and decision-making." },
  { title: "The Emperor of All Maladies", authors: ["Siddhartha Mukherjee"], isbn: "978-1439170915", publisher: "Scribner", publication_year: 2010, description: "A biography of cancer." },
  { title: "The Sixth Extinction", authors: ["Elizabeth Kolbert"], isbn: "978-0805092998", publisher: "Henry Holt", publication_year: 2014, description: "An unnatural history of species extinction." },
  { title: "Surely You're Joking, Mr. Feynman!", authors: ["Richard P. Feynman"], isbn: "978-0393316049", publisher: "W. W. Norton", publication_year: 1985, description: "Adventures of a curious physicist." },
  { title: "The Man Who Knew Infinity", authors: ["Robert Kanigel"], isbn: "978-1476763491", publisher: "Washington Square Press", publication_year: 1991, description: "A life of the genius Ramanujan." },
  { title: "The Hidden Life of Trees", authors: ["Peter Wohlleben"], isbn: "978-1771642484", publisher: "Greystone Books", publication_year: 2016, description: "What trees feel and how they communicate." },
  { title: "Lab Girl", authors: ["Hope Jahren"], isbn: "978-1101873724", publisher: "Vintage", publication_year: 2016, description: "A memoir about work, love, and the lab." },
  { title: "The Order of Time", authors: ["Carlo Rovelli"], isbn: "978-0735216112", publisher: "Riverhead Books", publication_year: 2017, description: "Physics of time and our perception of it." },
  { title: "Seven Brief Lessons on Physics", authors: ["Carlo Rovelli"], isbn: "978-0399184413", publisher: "Riverhead Books", publication_year: 2014, description: "A poetic introduction to modern physics." },
  { title: "The Brain That Changes Itself", authors: ["Norman Doidge"], isbn: "978-0143113102", publisher: "Penguin Books", publication_year: 2007, description: "Stories of personal triumph from neuroplasticity." },
  { title: "Why We Sleep", authors: ["Matthew Walker"], isbn: "978-1501144318", publisher: "Scribner", publication_year: 2017, description: "Unlocking the power of sleep and dreams." },
  { title: "The Body: A Guide for Occupants", authors: ["Bill Bryson"], isbn: "978-0385539302", publisher: "Doubleday", publication_year: 2019, description: "A tour of the human body." },
  { title: "The Demon-Haunted World", authors: ["Carl Sagan"], isbn: "978-0345409461", publisher: "Ballantine Books", publication_year: 1995, description: "Science as a candle in the dark." },
  { title: "The Information", authors: ["James Gleick"], isbn: "978-1400096237", publisher: "Pantheon", publication_year: 2011, description: "A history, a theory, a flood." },
  { title: "Genome", authors: ["Matt Ridley"], isbn: "978-0060932909", publisher: "Harper Perennial", publication_year: 1999, description: "The autobiography of a species in 23 chapters." }
];

export default function BulkImport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('bulk-import-books', {
        body: { books: BOOKS_TO_IMPORT }
      });

      if (error) throw error;

      setResult(data);
      toast.success(`Successfully imported ${data.imported} out of ${data.total} books!`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import books');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Bulk Import Books</h1>
      
      <div className="space-y-4">
        <p className="text-muted-foreground">
          This will import {BOOKS_TO_IMPORT.length} science and related books into the inventory.
        </p>
        
        <Button 
          onClick={handleImport} 
          disabled={importing}
          size="lg"
        >
          {importing ? "Importing..." : "Import Books"}
        </Button>

        {result && (
          <div className="mt-6 p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Import Results</h2>
            <p>Successfully imported: {result.imported} / {result.total}</p>
            
            {result.results && (
              <div className="mt-4 max-h-96 overflow-y-auto">
                <h3 className="font-medium mb-2">Details:</h3>
                <ul className="space-y-1 text-sm">
                  {result.results.map((r: any, i: number) => (
                    <li key={i} className={r.success ? "text-green-600" : "text-red-600"}>
                      {r.title}: {r.success ? `✓ Added with ${r.copies} copies` : `✗ ${r.error}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
