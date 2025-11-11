import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        }
      }
    );

    const { books } = await req.json();
    console.log(`Bulk importing ${books.length} books`);

    const results = [];
    
    for (const bookData of books) {
      try {
        // Insert book
        const { data: book, error: bookError } = await supabaseAdmin
          .from('books')
          .insert({
            title: bookData.title,
            authors: bookData.authors,
            description: bookData.description,
            isbn: bookData.isbn,
            publisher: bookData.publisher,
            publication_year: bookData.publication_year,
            edition: bookData.edition,
            language: bookData.language || 'English',
          })
          .select()
          .single();

        if (bookError) {
          console.error('Error creating book:', bookError);
          results.push({ title: bookData.title, success: false, error: bookError.message });
          continue;
        }

        // Add 2-3 copies for each book
        const numCopies = Math.floor(Math.random() * 2) + 2; // 2 or 3 copies
        const copies = [];
        for (let i = 0; i < numCopies; i++) {
          copies.push({
            book_id: book.id,
            barcode: `BH-${Date.now()}-${i}`,
            status: 'available',
          });
        }

        const { error: copyError } = await supabaseAdmin
          .from('copies')
          .insert(copies);

        if (copyError) {
          console.error('Error creating copies:', copyError);
        }

        results.push({ title: bookData.title, success: true, bookId: book.id, copies: numCopies });
      } catch (error) {
        console.error('Error processing book:', error);
        results.push({ title: bookData.title, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: successCount,
        total: books.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bulk-import-books:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
