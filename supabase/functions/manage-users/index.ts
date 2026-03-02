import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is manager or admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller role
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const callerRoleList = (callerRoles || []).map((r: any) => r.role);
    const callerIsAdmin = callerRoleList.includes("admin");
    const callerIsManager = callerRoleList.includes("manager");

    if (!callerIsAdmin && !callerIsManager) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    // Helper: check if target is admin (managers can't touch admins)
    async function isTargetAdmin(userId: string): Promise<boolean> {
      const { data } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin");
      return (data || []).length > 0;
    }

    switch (action) {
      case "createUser": {
        const { email, password, fullName, phone, role } = params;
        
        // Only admins can create admin users
        if (role === "admin" && !callerIsAdmin) {
          return new Response(JSON.stringify({ error: "Only admins can assign the admin role" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update profile with phone and approval
        await supabaseAdmin
          .from("profiles")
          .update({ phone_number: phone || null, is_approved: true, full_name: fullName })
          .eq("user_id", newUser.user.id);

        // Assign role
        if (role) {
          await supabaseAdmin
            .from("user_roles")
            .upsert({ user_id: newUser.user.id, role }, { onConflict: "user_id,role" });
        }

        return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "deleteUser": {
        const { userId } = params;
        
        // Managers can't delete admins
        if (!callerIsAdmin && await isTargetAdmin(userId)) {
          return new Response(JSON.stringify({ error: "Managers cannot delete admin users" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Can't delete yourself
        if (userId === caller.id) {
          return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) {
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "resetPassword": {
        const { email } = params;
        
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email,
        });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, link: data.properties?.action_link }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "approveUser": {
        const { userId, approved } = params;

        await supabaseAdmin
          .from("profiles")
          .update({ is_approved: approved })
          .eq("user_id", userId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "updateRole": {
        const { userId, role } = params;
        
        // Only admins can assign admin role
        if (role === "admin" && !callerIsAdmin) {
          return new Response(JSON.stringify({ error: "Only admins can assign the admin role" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Managers can't change admin's role
        if (!callerIsAdmin && await isTargetAdmin(userId)) {
          return new Response(JSON.stringify({ error: "Managers cannot modify admin users" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete existing roles, insert new one
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
        await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
