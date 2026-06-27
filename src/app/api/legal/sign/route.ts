import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { emitActivity } from "@/lib/activity"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { documentId, workspaceId, signatureData } = await req.json()
  if (!documentId || !workspaceId || !signatureData?.trim()) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
  }

  const { data: doc, error: fetchError } = await supabase
    .from("legal_documents")
    .select("id, title, status, workspace_id")
    .eq("id", documentId)
    .eq("workspace_id", workspaceId)
    .single()

  if (fetchError || !doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
  if (doc.status === "signed") return NextResponse.json({ error: "Ya fue firmado" }, { status: 409 })

  const { error } = await supabase
    .from("legal_documents")
    .update({
      status: "signed",
      signed_by: user.id,
      signed_at: new Date().toISOString(),
      signature_data: signatureData.trim(),
    })
    .eq("id", documentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await emitActivity({
    workspace_id: workspaceId,
    user_id: user.id,
    action: "document.signed",
    entity_type: "document",
    entity_id: documentId,
    metadata: { title: doc.title },
  })

  return NextResponse.json({ success: true })
}
