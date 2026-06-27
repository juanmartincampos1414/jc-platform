import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 7)
}

export async function POST(req: NextRequest) {
  const { email, password, fullName } = await req.json()

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "Completá todos los campos" }, { status: 400 })
  }

  // 1. Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) {
    if (authError.message.includes("already registered")) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 400 })
    }
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const userId = authData.user.id

  // 2. Create workspace
  const workspaceName = fullName.split(" ")[0] + " Workspace"
  const { data: workspace, error: wsError } = await supabaseAdmin
    .from("workspaces")
    .insert({ name: workspaceName, slug: slugify(fullName) })
    .select("id")
    .single()

  if (wsError) {
    return NextResponse.json({ error: "Error creando workspace" }, { status: 500 })
  }

  // 3. Add user to workspace
  await supabaseAdmin.from("workspace_users").insert({
    workspace_id: workspace.id,
    user_id: userId,
    full_name: fullName,
    role: "client_admin",
  })

  return NextResponse.json({ workspaceId: workspace.id })
}
