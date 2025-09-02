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
  dueDate: string;
  pickupLocation: string;
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
      bookTitle, 
      dueDate, 
      pickupLocation 
    }: EmailRequest = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create email content
    const emailSubject = 'Loan Request Approved - Book Hive';
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">📚</span>
          </div>
          <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 600;">Loan Request Approved!</h1>
        </div>
        
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #374151; margin: 0 0 16px 0; font-size: 20px;">Hello ${borrowerName},</h2>
          <p style="color: #6b7280; margin: 0 0 16px 0; line-height: 1.6;">
            Great news! Your request to borrow <strong>${bookTitle}</strong> has been approved by our library staff.
          </p>
        </div>
        
        <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #374151; margin: 0 0 16px 0; font-size: 18px;">Loan Details</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">
              <strong style="color: #374151;">Book:</strong> ${bookTitle}
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">
              <strong style="color: #374151;">Due Date:</strong> ${dueDate}
            </li>
            <li style="padding: 8px 0; color: #6b7280;">
              <strong style="color: #374151;">Pickup Location:</strong> ${pickupLocation}
            </li>
          </ul>
        </div>
        
        <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h4 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">⚠️ Important Reminders</h4>
          <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Please bring a valid ID when picking up your book</li>
            <li>Return the book by the due date to avoid late fees</li>
            <li>Handle the book with care and report any damage immediately</li>
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

    // Simulate sending email (in production, integrate with Resend, SendGrid, etc.)
    console.log('Sending loan approval email:', { 
      to: borrowerEmail, 
      subject: emailSubject,
      borrowRequestId 
    });
    
    // For demo purposes, simulate successful sending
    const emailResult = {
      id: `email_${Date.now()}`,
      success: true,
      to: borrowerEmail,
      subject: emailSubject
    };

    // Log the email activity
    await supabase.from('activity_log').insert({
      actor: 'system',
      action: 'Loan approval email sent',
      entity_type: 'borrow_request',
      entity_id: borrowRequestId,
      details: {
        to: borrowerEmail,
        subject: emailSubject,
        book_title: bookTitle,
        email_id: emailResult.id,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResult.id,
        message: 'Loan approval email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in send-loan-approval-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send loan approval email' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});