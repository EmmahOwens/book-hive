import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  queueId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text, queueId }: EmailRequest = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Email simulation - logs email without external service
    console.log('=== EMAIL NOTIFICATION ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML Content:', html || 'N/A');
    console.log('Text Content:', text || 'N/A');
    console.log('Queue ID:', queueId || 'None');
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================');

    // Simulate successful email delivery
    const emailResult = {
      id: `email_${Date.now()}`,
      success: true,
      message: 'Email logged successfully (simulation mode)'
    };

    // Update notification queue if this was queued
    if (queueId) {
      await supabase
        .from('notifications_queue')
        .update({
          status: 'sent',
          processed_at: new Date().toISOString()
        })
        .eq('id', queueId);
    }

    // Log the email activity
    await supabase.from('activity_log').insert({
      actor: 'system',
      action: 'Email sent',
      details: {
        to: to,
        subject: subject,
        email_id: emailResult.id,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResult.id,
        message: 'Email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in send-email function:', error);
    
    // If this was a queued email, mark as failed
    const body = await req.json();
    if (body.queueId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('notifications_queue')
        .update({
          status: 'failed',
          attempts: 1, // In production, increment existing attempts
          processed_at: new Date().toISOString()
        })
        .eq('id', body.queueId);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send email' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});