import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openDeadlineFloor } from '@/lib/time'

export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const mode = searchParams.get('mode')
  const sponsored = searchParams.get('sponsored')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') ?? 'newest'

  // status !== CLOSED alone isn't enough — a listing whose deadline has
  // simply passed stays OPEN in the DB until something notices, but
  // shouldn't be served as if it still were. Kept under AND (rather than
  // a top-level OR) so it composes safely with the search OR-group below.
  const where: any = {
    status: { not: 'CLOSED' },
    AND: [{ OR: [{ deadline: null }, { deadline: { gte: openDeadlineFloor() } }] }],
  }
  if (type) where.type = type
  if (mode) where.workMode = mode
  if (sponsored === 'true') where.sponsored = true
  if (search) {
    where.AND.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
        { location: { contains: search, mode: 'insensitive' } },
      ],
    })
  }

  const orderBy: any =
    sort === 'deadline' ? { deadline: 'asc' } :
    sort === 'salary'   ? { salaryMin: 'desc' } :
    sort === 'az'       ? { title: 'asc' } :
    { createdAt: 'desc' }

  const opportunities = await prisma.opportunity.findMany({
    where,
    orderBy,
    include: { company: true, tags: { include: { tag: true } } },
  })

  return NextResponse.json(opportunities, { headers: CORS })
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const opp = await prisma.opportunity.create({
      data: {
        ...data,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
        tags: undefined,
      },
    })
    return NextResponse.json({ opportunity: opp }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
