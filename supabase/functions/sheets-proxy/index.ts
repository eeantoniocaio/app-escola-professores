import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Setup CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get auth headers
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Initialize Supabase client with user's JWT to verify auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify user is logged in
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Read target configuration from server-side environment variables
    const targetApiUrl = Deno.env.get('ATTENDANCE_API_URL')
    const secretToken = Deno.env.get('ATTENDANCE_API_SECRET_TOKEN')

    if (!targetApiUrl || !secretToken) {
      return new Response(JSON.stringify({ error: 'Server configuration error (missing env keys)' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const urlObj = new URL(req.url)

    // 4. Handle GET (Fetching attendance data)
    if (req.method === 'GET') {
      const action = urlObj.searchParams.get('action')
      const sheetName = urlObj.searchParams.get('sheetName')
      const date = urlObj.searchParams.get('date')

      if (!action || !sheetName || !date) {
        return new Response(JSON.stringify({ error: 'Missing query parameters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Reconstruct target request URL with secret token
      const targetUrl = `${targetApiUrl}?token=${secretToken}&action=${action}&sheetName=${encodeURIComponent(sheetName)}&date=${date}`
      
      const response = await fetch(targetUrl)
      const data = await response.json()
      
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Handle POST (Saving attendance data)
    if (req.method === 'POST') {
      const body = await req.json()
      
      // Inject secret token into payload
      const payload = {
        ...body,
        token: secretToken
      }

      const response = await fetch(targetApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify(payload)
      })

      // Audit logging for Google Sheets write operations
      try {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        if (serviceRoleKey && supabaseUrl) {
          const systemSupabase = createClient(supabaseUrl, serviceRoleKey)
          await systemSupabase.from('logs_auditoria').insert([{
            usuario_id: user.id,
            usuario_email: user.email,
            tabela: 'google_sheets_attendance',
            operacao: body.action || 'POST',
            registro_id: `${body.sheetName || 'unknown'}_${body.date || 'unknown'}`,
            valores_novos: body
          }])
        }
      } catch (auditErr) {
        console.error('Failed to log Sheets audit:', auditErr)
      }

      // Note: Apps Script might redirect or return text/json
      let responseData;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        const text = await response.text()
        try {
          responseData = JSON.parse(text)
        } catch {
          responseData = { status: 'success', message: text || 'Request processed' }
        }
      }

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error in sheets-proxy:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
