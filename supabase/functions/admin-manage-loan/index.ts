import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoanActionRequest {
  loanId: string;
  action: 'return' | 'renew';
  adminEmail?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { loanId, action, adminEmail } = await req.json() as LoanActionRequest;

    console.log(`[Loan Management] Processing ${action} for loan ${loanId}`);

    // Fetch the loan
    const { data: loan, error: fetchError } = await supabase
      .from('loans')
      .select('*, copy_id')
      .eq('id', loanId)
      .single();

    if (fetchError || !loan) {
      throw new Error(`Failed to fetch loan: ${fetchError?.message}`);
    }

    if (action === 'return') {
      // Update loan status to returned
      const { error: updateError } = await supabase
        .from('loans')
        .update({
          status: 'returned',
          returned_date: new Date().toISOString().split('T')[0],
          returned_to: adminEmail || 'admin',
        })
        .eq('id', loanId);

      if (updateError) {
        throw new Error(`Failed to update loan: ${updateError.message}`);
      }

      // Update copy status back to available
      const { error: copyError } = await supabase
        .from('copies')
        .update({ status: 'available' })
        .eq('id', loan.copy_id);

      if (copyError) {
        throw new Error(`Failed to update copy status: ${copyError.message}`);
      }

      // Log activity
      await supabase.from('activity_log').insert({
        actor: adminEmail || 'admin',
        action: 'book_returned',
        entity_type: 'loan',
        entity_id: loanId,
        details: {
          borrower: loan.borrower_name,
          copy_id: loan.copy_id,
        },
      });

      console.log(`[Loan Management] Successfully returned loan ${loanId}`);
      
    } else if (action === 'renew') {
      // Calculate new due date (extend by original duration)
      const currentDueDate = new Date(loan.due_date);
      const issuedDate = new Date(loan.issued_date);
      const originalDuration = Math.ceil((currentDueDate.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + originalDuration);

      // Update loan with new due date and increment renewal count
      const { error: updateError } = await supabase
        .from('loans')
        .update({
          due_date: newDueDate.toISOString().split('T')[0],
          renewal_count: loan.renewal_count + 1,
        })
        .eq('id', loanId);

      if (updateError) {
        throw new Error(`Failed to renew loan: ${updateError.message}`);
      }

      // Log activity
      await supabase.from('activity_log').insert({
        actor: adminEmail || 'admin',
        action: 'loan_renewed',
        entity_type: 'loan',
        entity_id: loanId,
        details: {
          borrower: loan.borrower_name,
          new_due_date: newDueDate.toISOString().split('T')[0],
          renewal_count: loan.renewal_count + 1,
        },
      });

      console.log(`[Loan Management] Successfully renewed loan ${loanId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Loan ${action === 'return' ? 'returned' : 'renewed'} successfully`,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[Loan Management] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
