import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return jsonResponse({ error: "Unauthorized" }, 401);

    // Check caller role
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const callerRoleList = (callerRoles || []).map((r: any) => r.role);
    const callerIsAdmin = callerRoleList.includes("admin");
    const callerIsManager = callerRoleList.includes("manager");

    if (!callerIsAdmin && !callerIsManager) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const { action, ...params } = await req.json();

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
        const { email, password, fullName, phone, role, departments } = params;

        if (role === "admin" && !callerIsAdmin) {
          return jsonResponse({ error: "Only admins can assign the admin role" }, 403);
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        if (createError) return jsonResponse({ error: createError.message }, 400);

        await supabaseAdmin
          .from("profiles")
          .update({ phone_number: phone || null, is_approved: true, full_name: fullName })
          .eq("user_id", newUser.user.id);

        if (role) {
          await supabaseAdmin
            .from("user_roles")
            .upsert({ user_id: newUser.user.id, role }, { onConflict: "user_id,role" });
        }

        // Assign departments
        if (departments && Array.isArray(departments)) {
          for (const dept of departments) {
            await supabaseAdmin.from("user_departments").upsert(
              { user_id: newUser.user.id, department: dept.department, department_role: dept.department_role || "staff" },
              { onConflict: "user_id,department" }
            );
          }
        }

        return jsonResponse({ success: true, userId: newUser.user.id });
      }

      case "deleteUser": {
        const { userId } = params;
        if (!callerIsAdmin && await isTargetAdmin(userId)) {
          return jsonResponse({ error: "Managers cannot delete admin users" }, 403);
        }
        if (userId === caller.id) {
          return jsonResponse({ error: "Cannot delete your own account" }, 400);
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) return jsonResponse({ error: deleteError.message }, 400);
        return jsonResponse({ success: true });
      }

      case "resetPassword": {
        const { email } = params;
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email });
        if (error) return jsonResponse({ error: error.message }, 400);
        return jsonResponse({ success: true, link: data.properties?.action_link });
      }

      case "approveUser": {
        const { userId, approved } = params;
        await supabaseAdmin.from("profiles").update({ is_approved: approved }).eq("user_id", userId);
        return jsonResponse({ success: true });
      }

      case "updateRole": {
        const { userId, role } = params;
        if (role === "admin" && !callerIsAdmin) {
          return jsonResponse({ error: "Only admins can assign the admin role" }, 403);
        }
        if (!callerIsAdmin && await isTargetAdmin(userId)) {
          return jsonResponse({ error: "Managers cannot modify admin users" }, 403);
        }
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
        await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
        return jsonResponse({ success: true });
      }

      case "assignDepartment": {
        const { userId, department, departmentRole } = params;
        if (!callerIsAdmin && await isTargetAdmin(userId)) {
          return jsonResponse({ error: "Managers cannot modify admin users" }, 403);
        }
        await supabaseAdmin.from("user_departments").upsert(
          { user_id: userId, department, department_role: departmentRole || "staff" },
          { onConflict: "user_id,department" }
        );
        return jsonResponse({ success: true });
      }

      case "removeDepartment": {
        const { userId, department } = params;
        if (!callerIsAdmin && await isTargetAdmin(userId)) {
          return jsonResponse({ error: "Managers cannot modify admin users" }, 403);
        }
        await supabaseAdmin.from("user_departments").delete().eq("user_id", userId).eq("department", department);
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
