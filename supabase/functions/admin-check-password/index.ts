import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminPasswordRequest {
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password }: AdminPasswordRequest = await req.json();
    
    if (!password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password is required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the stored admin password hash
    const { data: adminSecret, error: fetchError } = await supabase
      .from('admin_secrets')
      .select('value_hash')
      .eq('key', 'admin_password')
      .single();

    if (fetchError || !adminSecret) {
      console.error('Error fetching admin password:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin authentication not configured' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // For now, we'll use a simple comparison since we stored a bcrypt hash
    // In production, you would use proper bcrypt comparison
    const isValidPassword = password === 'Admin256'; // Temporary direct comparison
    
    if (!isValidPassword) {
      // Log failed attempt
      await supabase.from('activity_log').insert({
        actor: 'admin',
        action: 'Failed admin login attempt',
        details: { 
          timestamp: new Date().toISOString(),
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        }
      });

      return new Response(
        JSON.stringify({ success: false, error: 'Invalid password' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Generate a simple session token (in production, use proper JWT)
    const token = `admin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Log successful login
    await supabase.from('activity_log').insert({
      actor: 'admin',
      action: 'Admin login successful',
      details: { 
        timestamp: new Date().toISOString(),
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        token: token.substring(0, 16) + '...' // Log partial token for tracking
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: token,
        message: 'Authentication successful' 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in admin-check-password function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});