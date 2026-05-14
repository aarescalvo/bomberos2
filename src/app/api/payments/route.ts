import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const payments = await db.payment.findMany({ orderBy: { date: 'desc' } })
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, concept, amount, date, payer, method, receipt, notes } = body

    if (!concept || !amount || !date) {
      return NextResponse.json({ error: 'Concepto, monto y fecha son requeridos' }, { status: 400 })
    }

    const payment = await db.payment.create({
      data: { type: type || 'OTRO', concept, amount, date: new Date(date), payer, method, receipt, notes },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 })
  }
}
