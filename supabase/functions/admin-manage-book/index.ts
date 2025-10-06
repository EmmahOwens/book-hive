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

    const { action, bookData, bookId } = await req.json();
    console.log('Admin manage book action:', action);

    // Verify admin token (basic check - in production you'd want proper JWT validation)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create') {
      // Insert book
      const { data: book, error: bookError } = await supabaseAdmin
        .from('books')
        .insert({
          title: bookData.title,
          authors: bookData.authors,
          description: bookData.description,
          isbn: bookData.isbn,
          publisher: bookData.publisher,
          publication_year: bookData.publication_year ? parseInt(bookData.publication_year) : null,
          edition: bookData.edition,
          language: bookData.language,
          level_id: bookData.level_id,
        })
        .select()
        .single();

      if (bookError) {
        console.error('Error creating book:', bookError);
        throw bookError;
      }

      // Insert book categories
      if (bookData.categories && bookData.categories.length > 0) {
        const categoryInserts = bookData.categories.map((categoryId: string) => ({
          book_id: book.id,
          category_id: categoryId,
        }));

        const { error: categoriesError } = await supabaseAdmin
          .from('book_categories')
          .insert(categoryInserts);

        if (categoriesError) {
          console.error('Error creating book categories:', categoriesError);
          throw categoriesError;
        }
      }

      // Add initial copy
      const { error: copyError } = await supabaseAdmin
        .from('copies')
        .insert({
          book_id: book.id,
          barcode: `BH-${Date.now()}`,
          status: 'available',
        });

      if (copyError) {
        console.error('Error creating initial copy:', copyError);
        throw copyError;
      }

      return new Response(
        JSON.stringify({ success: true, book }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      // Update book
      const { error: bookError } = await supabaseAdmin
        .from('books')
        .update({
          title: bookData.title,
          authors: bookData.authors,
          description: bookData.description,
          isbn: bookData.isbn,
          publisher: bookData.publisher,
          publication_year: bookData.publication_year ? parseInt(bookData.publication_year) : null,
          edition: bookData.edition,
          language: bookData.language,
          level_id: bookData.level_id,
        })
        .eq('id', bookId);

      if (bookError) {
        console.error('Error updating book:', bookError);
        throw bookError;
      }

      // Delete existing categories
      await supabaseAdmin
        .from('book_categories')
        .delete()
        .eq('book_id', bookId);

      // Insert new categories
      if (bookData.categories && bookData.categories.length > 0) {
        const categoryInserts = bookData.categories.map((categoryId: string) => ({
          book_id: bookId,
          category_id: categoryId,
        }));

        const { error: categoriesError } = await supabaseAdmin
          .from('book_categories')
          .insert(categoryInserts);

        if (categoriesError) {
          console.error('Error updating book categories:', categoriesError);
          throw categoriesError;
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      // Delete book categories first
      await supabaseAdmin
        .from('book_categories')
        .delete()
        .eq('book_id', bookId);

      // Delete copies
      await supabaseAdmin
        .from('copies')
        .delete()
        .eq('book_id', bookId);

      // Delete book
      const { error: bookError } = await supabaseAdmin
        .from('books')
        .delete()
        .eq('id', bookId);

      if (bookError) {
        console.error('Error deleting book:', bookError);
        throw bookError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-manage-book:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});