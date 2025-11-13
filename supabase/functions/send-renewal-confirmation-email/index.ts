import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  borrowerName: string;
  borrowerEmail: string;
  bookTitle: string;
  oldDueDate: string;
  newDueDate: string;
  renewalCount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { borrowerName, borrowerEmail, bookTitle, oldDueDate, newDueDate, renewalCount }: EmailRequest = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Sending renewal confirmation email to:', borrowerEmail);

    const emailSubject = `Loan Renewed - ${bookTitle}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
            .highlight { background: #ffeaa7; padding: 3px 8px; border-radius: 3px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .renewal-icon { font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="renewal-icon">🔄</div>
              <h1>Loan Renewal Confirmed</h1>
            </div>
            <div class="content">
              <p>Dear ${borrowerName},</p>
              <p>Great news! Your loan has been successfully renewed.</p>
              
              <div class="info-box">
                <h3>📖 Renewal Details</h3>
                <p><strong>Book Title:</strong> ${bookTitle}</p>
                <p><strong>Previous Due Date:</strong> ${oldDueDate}</p>
                <p><strong>New Due Date:</strong> <span class="highlight">${newDueDate}</span></p>
                <p><strong>Total Renewals:</strong> ${renewalCount}</p>
              </div>
              
              <p>Please remember to return the book by the new due date to avoid any late fees.</p>
              <p>We hope you continue to enjoy reading this book!</p>
              
              <div class="footer">
                <p>Thank you for using our library!</p>
                <p>This is an automated message, please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOSTNAME') ?? '',
        port: Number(Deno.env.get('SMTP_PORT')) || 587,
        tls: true,
        auth: {
          username: Deno.env.get('SMTP_USERNAME') ?? '',
          password: Deno.env.get('SMTP_PASSWORD') ?? '',
        },
      },
    });

    await client.send({
      from: Deno.env.get('SMTP_FROM_EMAIL') ?? 'noreply@library.com',
      to: borrowerEmail,
      subject: emailSubject,
      content: 'Loan renewal confirmation',
      html: emailHtml,
    });

    await client.close();

    console.log('Renewal confirmation email sent successfully to:', borrowerEmail);

    await supabase.from('activity_log').insert({
      actor: 'system',
      action: 'Email sent',
      details: {
        to: borrowerEmail,
        subject: emailSubject,
        type: 'renewal_confirmation',
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Renewal confirmation email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error sending renewal confirmation email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send renewal confirmation email' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
