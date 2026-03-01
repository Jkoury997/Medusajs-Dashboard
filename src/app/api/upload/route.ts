import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const token = process.env.vercel_blob_rw_H82THW3U_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json({ error: "Blob token not configured" }, { status: 500 })
  }

  const blob = await put(`comprobantes/${Date.now()}-${file.name}`, file, {
    access: "public",
    token,
  })

  return NextResponse.json({ url: blob.url })
}
