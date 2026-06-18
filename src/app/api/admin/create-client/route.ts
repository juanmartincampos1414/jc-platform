import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Uses service role — server only, never exposed to client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { name, slug, adminEmail, adminName, services, networks, fee, adsBudget } = await req.json()

    if (!name || !adminEmail || !adminName || !services?.length) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // 1. Create workspace
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from("workspaces")
      .insert({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        active_services: services,
        active_networks: networks || [],
        monthly_fee: fee ? parseFloat(fee) : null,
        ads_budget_monthly: adsBudget ? parseFloat(adsBudget) : null,
      })
      .select()
      .single()

    if (wsError) {
      if (wsError.code === "23505") {
        return NextResponse.json({ error: "Ya existe un workspace con ese nombre. Usá un nombre diferente." }, { status: 409 })
      }
      return NextResponse.json({ error: wsError.message }, { status: 500 })
    }

    // 2. Invite user via email (Supabase sends the invite automatically)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      adminEmail,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "https://aigency.jcmarketing.digital") || "https://aigency.jcmarketing.digital"}/workspace/${workspace.id}`,
        data: { full_name: adminName, workspace_id: workspace.id }
      }
    )

    if (inviteError) {
      // If user already exists, find them and link
      if (inviteError.message?.includes("already been registered")) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === adminEmail)

        if (existingUser) {
          await supabaseAdmin.from("workspace_users").insert({
            workspace_id: workspace.id,
            user_id: existingUser.id,
            role: "client_admin",
            full_name: adminName,
          })
          return NextResponse.json({ success: true, workspace, message: "Usuario existente vinculado al workspace" })
        }
      }
      // Rollback workspace if invite fails
      await supabaseAdmin.from("workspaces").delete().eq("id", workspace.id)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    // 3. Link user to workspace as client_admin
    await supabaseAdmin.from("workspace_users").insert({
      workspace_id: workspace.id,
      user_id: inviteData.user.id,
      role: "client_admin",
      full_name: adminName,
    })

    return NextResponse.json({
      success: true,
      workspace,
      message: `Workspace creado e invitación enviada a ${adminEmail}`
    })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
