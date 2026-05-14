import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const documents = await db.document.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(documents)
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json({ error: 'Error al obtener documentos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, type, content, tags } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'Título y tipo son requeridos' }, { status: 400 })
    }

    const document = await db.document.create({
      data: { title, type, content, tags },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Create document error:', error)
    return NextResponse.json({ error: 'Error al crear documento' }, { status: 500 })
  }
}
