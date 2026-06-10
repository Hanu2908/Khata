// supabase/functions/notify-owner/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Database environment configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Query token details, including owner id and person name
    const { data: shareToken, error: tokenError } = await supabase
      .from('share_tokens')
      .select(`
        user_id,
        person_id,
        persons (name)
      `)
      .eq('token', token)
      .maybeSingle()

    if (tokenError || !shareToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing share token' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get owner email from auth users using service role client
    const { data: ownerUser, error: userError } = await supabase.auth.admin.getUserById(
      shareToken.user_id
    )

    if (userError || !ownerUser || !ownerUser.user) {
      return new Response(
        JSON.stringify({ error: 'Owner user not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const ownerEmail = ownerUser.user.email
    const friendName = (shareToken.persons as any)?.name || 'Someone'

    // Attempt sending email (using built-in SMTP log simulation or external APIs if configured)
    console.log(`[Notification] Sending alert to ledger owner (${ownerEmail}): "${friendName} has flagged an issue with their shared Yaari Khaatha ledger."`)

    // Note: In production, configure Resend/SendGrid and invoke mail API here:
    // await sendEmail({ to: ownerEmail, subject: "Ledger Alert", body: ... })

    return new Response(
      JSON.stringify({ success: true, message: 'Notification processed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
