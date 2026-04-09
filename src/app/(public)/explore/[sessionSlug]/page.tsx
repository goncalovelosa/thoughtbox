import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ExplorerHero } from '@/components/explorer/explorer-hero'
import { ExplorerTimeline } from '@/components/explorer/explorer-timeline'
import { ExplorerCTA } from '@/components/explorer/explorer-cta'
import { KeyMomentsNav } from '@/components/explorer/key-moments-nav'

import type { RawThoughtRecord } from '@/lib/session/view-models'
import agenticReasoningData from '@/data/sessions/agentic-reasoning-research.json'

type ExplorerSessionData = typeof agenticReasoningData & {
  thoughts: RawThoughtRecord[]
}

const sessions: Record<string, ExplorerSessionData> = {
  'agentic-reasoning-research': agenticReasoningData as ExplorerSessionData,
}

export function generateStaticParams() {
  return Object.keys(sessions).map((slug) => ({ sessionSlug: slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionSlug: string }>
}): Promise<Metadata> {
  const { sessionSlug } = await params
  const data = sessions[sessionSlug]
  if (!data) return {}

  return {
    title: `${data.session.title} — Thoughtbox Session Explorer`,
    description: `Browse ${data.session.thoughtCount} thoughts from a ${formatDurationShort(data.session.createdAt, data.session.completedAt)} AI research session. See belief snapshots, decision frames, and a knowledge graph built in real time.`,
    openGraph: {
      title: `${data.session.thoughtCount} thoughts. One AI research session.`,
      description:
        'Watch an AI agent reason through agentic reasoning research, forming beliefs and building a knowledge graph.',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

function formatDurationShort(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes}-minute`
  const hours = Math.floor(minutes / 60)
  const remainingMin = minutes % 60
  return remainingMin > 0 ? `${hours}h ${remainingMin}m` : `${hours}-hour`
}

export default async function ExplorerPage({
  params,
}: {
  params: Promise<{ sessionSlug: string }>
}) {
  const { sessionSlug } = await params
  const data = sessions[sessionSlug]

  if (!data) notFound()

  const durationMs =
    new Date(data.session.completedAt).getTime() -
    new Date(data.session.createdAt).getTime()

  const typeCounts = data.thoughts.reduce(
    (acc, t) => {
      const type = t.thoughtType || 'reasoning'
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <main className="min-h-screen">
      <ExplorerHero
        title={data.session.title}
        tags={data.session.tags}
        thoughtCount={data.session.thoughtCount}
        durationMs={durationMs}
        entityCount={data.knowledgeGraph.entities.length}
        relationCount={data.knowledgeGraph.relations.length}
        typeCounts={typeCounts}
      />

      <KeyMomentsNav keyMoments={data.keyMoments} />

      <ExplorerTimeline
        thoughts={data.thoughts}
        keyMoments={data.keyMoments}
        sessionCreatedAt={data.session.createdAt}
      />

      <ExplorerCTA thoughtCount={data.session.thoughtCount} />
    </main>
  )
}
