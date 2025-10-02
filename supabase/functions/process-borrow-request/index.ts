import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessRequestBody {
  requestId: string;
  action: 'approved' | 'rejected';
  adminEmail?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { requestId, action, adminEmail } = await req.json() as ProcessRequestBody;

    console.log(`[Process Request] Processing ${action} for request ${requestId}`);

    // Fetch the borrow request
    const { data: borrowRequest, error: fetchError } = await supabase
      .from('borrow_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !borrowRequest) {
      throw new Error(`Failed to fetch borrow request: ${fetchError?.message}`);
    }

    // Update borrow request status
    const { error: updateError } = await supabase
      .from('borrow_requests')
      .update({
        status: action,
        approved_at: action === 'approved' ? new Date().toISOString() : null,
        approved_by: adminEmail || 'admin',
      })
      .eq('id', requestId);

    if (updateError) {
      throw new Error(`Failed to update borrow request: ${updateError.message}`);
    }

    if (action === 'approved') {
      // Process each requested item
      const requestedItems = Array.isArray(borrowRequest.requested_items)
        ? borrowRequest.requested_items
        : JSON.parse(borrowRequest.requested_items);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + borrowRequest.desired_duration_days);

      for (const item of requestedItems) {
        // Find an available copy for this book
        const { data: availableCopy, error: copyError } = await supabase
          .from('copies')
          .select('id')
          .eq('book_id', item.id)
          .eq('status', 'available')
          .limit(1)
          .single();

        if (copyError || !availableCopy) {
          console.warn(`No available copy found for book ${item.id}`);
          continue;
        }

        // Create loan record
        const { error: loanError } = await supabase
          .from('loans')
          .insert({
            borrow_request_id: requestId,
            copy_id: availableCopy.id,
            borrower_name: borrowRequest.requester_name,
            borrower_email: borrowRequest.email,
            borrower_phone: borrowRequest.phone,
            issued_date: new Date().toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            status: 'active',
            issued_by: adminEmail || 'admin',
            notes: borrowRequest.purpose || null,
          });

        if (loanError) {
          console.error(`Failed to create loan: ${loanError.message}`);
          continue;
        }

        // Update copy status to borrowed
        const { error: copyUpdateError } = await supabase
          .from('copies')
          .update({ status: 'borrowed' })
          .eq('id', availableCopy.id);

        if (copyUpdateError) {
          console.error(`Failed to update copy status: ${copyUpdateError.message}`);
        }
      }

      // Log activity
      await supabase.from('activity_log').insert({
        actor: adminEmail || 'admin',
        action: 'borrow_request_approved',
        entity_type: 'borrow_request',
        entity_id: requestId,
        details: {
          requester_name: borrowRequest.requester_name,
          items_count: requestedItems.length,
          due_date: dueDate.toISOString(),
        },
      });

      // Send approval email
      await supabase.functions.invoke('send-loan-approval-email', {
        body: {
          borrowRequestId: requestId,
          borrowerName: borrowRequest.requester_name,
          borrowerEmail: borrowRequest.email,
          bookTitle: requestedItems.map((item: any) => item.title).join(', '),
          dueDate: dueDate.toLocaleDateString(),
          pickupLocation: borrowRequest.pickup_location,
        },
      });

      console.log(`[Process Request] Successfully approved request ${requestId}`);
    } else {
      // Log rejection activity
      await supabase.from('activity_log').insert({
        actor: adminEmail || 'admin',
        action: 'borrow_request_rejected',
        entity_type: 'borrow_request',
        entity_id: requestId,
        details: {
          requester_name: borrowRequest.requester_name,
        },
      });

      console.log(`[Process Request] Successfully rejected request ${requestId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Request ${action} successfully`,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[Process Request] Error:', error);
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
