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
  returnDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { borrowerName, borrowerEmail, bookTitle, returnDate }: EmailRequest = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Sending return confirmation email to:', borrowerEmail);

    const emailSubject = `Book Return Confirmed - ${bookTitle}`;
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
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .success-icon { font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Book Return Confirmed</h1>
            </div>
            <div class="content">
              <p>Dear ${borrowerName},</p>
              <p>Thank you for returning the book to our library!</p>
              
              <div class="info-box">
                <h3>📖 Return Details</h3>
                <p><strong>Book Title:</strong> ${bookTitle}</p>
                <p><strong>Return Date:</strong> ${returnDate}</p>
              </div>
              
              <p>Your loan has been successfully closed. We hope you enjoyed reading this book!</p>
              <p>Feel free to visit us again to borrow more books from our collection.</p>
              
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
      content: 'Book return confirmation',
      html: emailHtml,
    });

    await client.close();

    console.log('Return confirmation email sent successfully to:', borrowerEmail);

    await supabase.from('activity_log').insert({
      actor: 'system',
      action: 'Email sent',
      details: {
        to: borrowerEmail,
        subject: emailSubject,
        type: 'return_confirmation',
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Return confirmation email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error sending return confirmation email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send return confirmation email' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
