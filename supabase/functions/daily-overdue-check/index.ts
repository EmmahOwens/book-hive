import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily overdue check...');
    
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find all loans that are past due and still active
    const { data: overdueLoans, error: fetchError } = await supabase
      .from('loans')
      .select(`
        id,
        copy_id,
        borrower_name,
        borrower_email,
        borrower_phone,
        due_at,
        fine_due,
        copies (
          book_id,
          books (
            title,
            authors
          )
        )
      `)
      .eq('status', 'active')
      .lt('due_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching overdue loans:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${overdueLoans?.length || 0} overdue loans`);

    let processedCount = 0;
    const finePerDay = 1.00; // $1 fine per day overdue

    for (const loan of overdueLoans || []) {
      try {
        // Calculate days overdue and fine amount
        const daysOverdue = Math.ceil(
          (new Date().getTime() - new Date(loan.due_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        const additionalFine = daysOverdue * finePerDay;
        const newTotalFine = (loan.fine_due || 0) + additionalFine;

        // Update loan status to overdue and add fine
        const { error: updateError } = await supabase
          .from('loans')
          .update({
            status: 'overdue',
            fine_due: newTotalFine
          })
          .eq('id', loan.id);

        if (updateError) {
          console.error(`Error updating loan ${loan.id}:`, updateError);
          continue;
        }

        // Queue overdue notification email
        const bookTitle = loan.copies?.books?.title || 'Unknown Book';
        const authors = loan.copies?.books?.authors?.join(', ') || 'Unknown Author';
        
        await supabase.from('notifications_queue').insert({
          type: 'email',
          to_email: loan.borrower_email,
          subject: 'Overdue Book Notice - Book Hive Library',
          content: `
            <h2>Overdue Book Notice</h2>
            <p>Dear ${loan.borrower_name},</p>
            
            <p>This is a reminder that the following book is now overdue:</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3>${bookTitle}</h3>
              <p><strong>Author(s):</strong> ${authors}</p>
              <p><strong>Due Date:</strong> ${new Date(loan.due_at).toLocaleDateString()}</p>
              <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
              <p><strong>Fine Amount:</strong> $${newTotalFine.toFixed(2)}</p>
            </div>
            
            <p>Please return the book as soon as possible to avoid additional fines.</p>
            <p>You can return books during our regular hours or use our book drop-off service.</p>
            
            <p>If you have already returned this book, please ignore this notice.</p>
            
            <p>Thank you,<br>Book Hive Library Team</p>
          `,
          payload: {
            loan_id: loan.id,
            days_overdue: daysOverdue,
            fine_amount: newTotalFine
          }
        });

        // Log the overdue processing activity
        await supabase.from('activity_log').insert({
          actor: 'system',
          action: 'Loan marked overdue',
          details: {
            loan_id: loan.id,
            borrower_name: loan.borrower_name,
            book_title: bookTitle,
            days_overdue: daysOverdue,
            fine_amount: newTotalFine,
            processed_at: new Date().toISOString()
          }
        });

        processedCount++;
        console.log(`Processed overdue loan ${loan.id} - Fine: $${newTotalFine.toFixed(2)}`);

      } catch (error) {
        console.error(`Error processing loan ${loan.id}:`, error);
      }
    }

    // Log the daily check completion
    await supabase.from('activity_log').insert({
      actor: 'system',
      action: 'Daily overdue check completed',
      details: {
        total_overdue_loans: overdueLoans?.length || 0,
        processed_count: processedCount,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`Daily overdue check completed. Processed ${processedCount} loans.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_count: processedCount,
        total_overdue: overdueLoans?.length || 0,
        message: 'Daily overdue check completed successfully' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in daily-overdue-check function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to complete overdue check' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});