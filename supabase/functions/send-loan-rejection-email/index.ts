import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  borrowRequestId: string;
  borrowerEmail: string;
  borrowerName: string;
  bookTitle: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      borrowRequestId, 
      borrowerEmail, 
      borrowerName, 
      bookTitle
    }: EmailRequest = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create email content
    const emailSubject = 'Loan Request Update - Book Hive';
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">📚</span>
          </div>
          <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 600;">Loan Request Update</h1>
        </div>
        
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 20px;">Hello ${borrowerName},</h2>
          <p style="color: #6b7280; margin: 0 0 16px 0; line-height: 1.6;">
            Thank you for your interest in borrowing <strong>${bookTitle}</strong> from our library.
          </p>
          <p style="color: #6b7280; margin: 0 0 16px 0; line-height: 1.6;">
            We regret to inform you that your request could not be approved at this time. This may be due to high demand, unavailability, or other factors.
          </p>
        </div>
        
        <div style="background: #dbeafe; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h4 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">💡 What You Can Do</h4>
          <ul style="color: #1e40af; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Check back later - the book might become available soon</li>
            <li>Contact our library staff for more information</li>
            <li>Browse our catalog for similar books</li>
          </ul>
        </div>
        
        <div style="text-align: center; padding: 24px 0; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0 0 8px 0;">Thank you for using Book Hive!</p>
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            If you have any questions, please contact our library staff.
          </p>
        </div>
      </div>
    `;

    // Send email using Resend
    console.log('Sending loan rejection email:', { 
      to: borrowerEmail, 
      subject: emailSubject,
      borrowRequestId 
    });
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const emailResult = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Book Hive <onboarding@resend.dev>',
        to: [borrowerEmail],
        subject: emailSubject,
        html: emailHtml
      })
    });
    
    const emailData = await emailResult.json();
    
    if (!emailResult.ok) {
      console.error('Failed to send email:', emailData);
      throw new Error(`Email sending failed: ${emailData.message || 'Unknown error'}`);
    }

    // Log the email activity
    await supabase.from('activity_log').insert({
      actor: 'system',
      action: 'Loan rejection email sent',
      entity_type: 'borrow_request',
      entity_id: borrowRequestId,
      details: {
        to: borrowerEmail,
        subject: emailSubject,
        book_title: bookTitle,
        email_id: emailData.id,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailData.id,
        message: 'Loan rejection email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in send-loan-rejection-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send loan rejection email' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
