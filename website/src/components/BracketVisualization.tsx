import { useMemo } from 'react'
import type { BracketMatch } from 'double-elimination'

interface Props {
  winnersMatches: BracketMatch[]
  losersMatches: BracketMatch[]
  participantCount: number
}

const BracketVisualization = ({
  winnersMatches,
  losersMatches,
  participantCount,
}: Props) => {
  const { winnersByRound, losersByRound, maxWinnersRound, maxLosersRound } =
    useMemo(() => {
      const winnersByRound: Record<number, BracketMatch[]> = {}
      const losersByRound: Record<number, BracketMatch[]> = {}

      winnersMatches.forEach((m) => {
        if (!winnersByRound[m.round]) winnersByRound[m.round] = []
        winnersByRound[m.round].push(m)
      })

      losersMatches.forEach((m) => {
        if (!losersByRound[m.round]) losersByRound[m.round] = []
        losersByRound[m.round].push(m)
      })

      Object.values(winnersByRound).forEach((arr) =>
        arr.sort((a, b) => a.bracketPosition - b.bracketPosition)
      )
      Object.values(losersByRound).forEach((arr) =>
        arr.sort((a, b) => a.bracketPosition - b.bracketPosition)
      )

      const maxWinnersRound = Math.max(
        ...Object.keys(winnersByRound).map(Number),
        0
      )
      const maxLosersRound = Math.max(
        ...Object.keys(losersByRound).map(Number),
        0
      )

      return { winnersByRound, losersByRound, maxWinnersRound, maxLosersRound }
    }, [winnersMatches, losersMatches])

  // For larger tournaments, show a simplified summary view
  const showSimplified = participantCount > 8

  const getRoundName = (
    round: number,
    totalRounds: number,
    isWinners: boolean
  ) => {
    if (isWinners) {
      if (round === totalRounds) return 'Finals'
      if (round === totalRounds - 1) return 'Semis'
      if (round === totalRounds - 2) return 'Quarters'
      return `Round ${round}`
    } else {
      if (round === totalRounds) return 'LB Finals'
      return `LB R${round}`
    }
  }

  if (showSimplified) {
    return (
      <div className='grid md:grid-cols-2' style={{ gap: '1rem' }}>
        <div className='bg-card border border-border rounded-xl overflow-hidden'>
          <div className='border-b border-border' style={{ padding: '1rem' }}>
            <h4
              className='text-base font-semibold flex items-center'
              style={{ gap: '0.5rem' }}
            >
              <span className='w-2.5 h-2.5 rounded-full bg-primary' />
              Winners Bracket
            </h4>
          </div>
          <div style={{ padding: '1rem' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {Object.entries(winnersByRound).map(([round, matches]) => (
                <div
                  key={round}
                  className='flex items-center justify-between bg-background/50 rounded-lg'
                  style={{ padding: '0.75rem 1rem' }}
                >
                  <span className='text-sm font-medium'>
                    {getRoundName(Number(round), maxWinnersRound, true)}
                  </span>
                  <span className='text-sm text-muted'>
                    {matches.length}{' '}
                    {matches.length === 1 ? 'match' : 'matches'}
                  </span>
                </div>
              ))}
            </div>
            <div
              className='text-xs text-muted text-center border-t border-border'
              style={{ marginTop: '1rem', paddingTop: '1rem' }}
            >
              {winnersMatches.length} total matches • {maxWinnersRound} rounds
            </div>
          </div>
        </div>

        <div className='bg-card border border-border rounded-xl overflow-hidden'>
          <div className='border-b border-border' style={{ padding: '1rem' }}>
            <h4
              className='text-base font-semibold flex items-center'
              style={{ gap: '0.5rem' }}
            >
              <span className='w-2.5 h-2.5 rounded-full bg-tertiary' />
              Losers Bracket
            </h4>
          </div>
          <div style={{ padding: '1rem' }}>
            {losersMatches.length > 0 ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {Object.entries(losersByRound).map(([round, matches]) => (
                    <div
                      key={round}
                      className='flex items-center justify-between bg-background/50 rounded-lg'
                      style={{ padding: '0.75rem 1rem' }}
                    >
                      <span className='text-sm font-medium'>
                        {getRoundName(Number(round), maxLosersRound, false)}
                      </span>
                      <span className='text-sm text-muted'>
                        {matches.length}{' '}
                        {matches.length === 1 ? 'match' : 'matches'}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  className='text-xs text-muted text-center border-t border-border'
                  style={{ marginTop: '1rem', paddingTop: '1rem' }}
                >
                  {losersMatches.length} total matches • {maxLosersRound} rounds
                </div>
              </>
            ) : (
              <div
                className='flex items-center justify-center text-muted text-sm'
                style={{ height: '8rem' }}
              >
                No losers bracket in single elimination
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Visual bracket for smaller tournaments (≤16 participants)
  const MATCH_WIDTH = 100
  const MATCH_HEIGHT = 44
  const MATCH_GAP_X = 32
  const MATCH_GAP_Y = 16

  const getPlayerLabel = (id: string | null): string => {
    if (!id) return 'TBD'
    const num = id.replace('player-', '')
    return `#${num}`
  }

  const renderMatch = (match: BracketMatch, yOffset: number) => (
    <g key={match.id}>
      <rect
        x={0}
        y={yOffset}
        width={MATCH_WIDTH}
        height={MATCH_HEIGHT}
        rx={4}
        fill='#1a1a25'
        stroke='#2a2a3a'
        strokeWidth={1}
      />
      <text
        x={MATCH_WIDTH / 2}
        y={yOffset + 16}
        textAnchor='middle'
        fill={match.registration1Id ? '#ffffff' : '#6a6a7a'}
        fontSize={9}
        fontFamily='Outfit, sans-serif'
      >
        {getPlayerLabel(match.registration1Id)}
      </text>
      <line
        x1={8}
        y1={yOffset + MATCH_HEIGHT / 2}
        x2={MATCH_WIDTH - 8}
        y2={yOffset + MATCH_HEIGHT / 2}
        stroke='#2a2a3a'
        strokeWidth={1}
      />
      <text
        x={MATCH_WIDTH / 2}
        y={yOffset + 32}
        textAnchor='middle'
        fill={match.registration2Id ? '#ffffff' : '#6a6a7a'}
        fontSize={9}
        fontFamily='Outfit, sans-serif'
      >
        {getPlayerLabel(match.registration2Id)}
      </text>
    </g>
  )

  const renderRound = (
    matches: BracketMatch[],
    roundIndex: number,
    baseY: number
  ) => {
    const roundSpacing = Math.pow(2, roundIndex - 1)

    return (
      <g
        key={`round-${roundIndex}`}
        transform={`translate(${
          (roundIndex - 1) * (MATCH_WIDTH + MATCH_GAP_X)
        }, 0)`}
      >
        {matches.map((match, i) => {
          const yOffset =
            baseY +
            i * (MATCH_HEIGHT + MATCH_GAP_Y * roundSpacing) +
            ((roundSpacing - 1) * (MATCH_HEIGHT + MATCH_GAP_Y)) / 2
          return renderMatch(match, yOffset)
        })}
      </g>
    )
  }

  const winnersWidth = maxWinnersRound * (MATCH_WIDTH + MATCH_GAP_X)
  const losersWidth = maxLosersRound * (MATCH_WIDTH + MATCH_GAP_X)
  const totalWidth = Math.max(winnersWidth, losersWidth, 200)

  const firstRoundWinners = winnersByRound[1]?.length || 0
  const firstRoundLosers = losersByRound[1]?.length || 0
  const winnersHeight = Math.max(
    firstRoundWinners * (MATCH_HEIGHT + MATCH_GAP_Y),
    150
  )
  const losersHeight = Math.max(
    firstRoundLosers * (MATCH_HEIGHT + MATCH_GAP_Y),
    150
  )

  return (
    <div className='grid md:grid-cols-2' style={{ gap: '1rem' }}>
      <div className='bg-card border border-border rounded-xl overflow-hidden'>
        <div className='border-b border-border' style={{ padding: '1rem' }}>
          <h4
            className='text-base font-semibold flex items-center'
            style={{ gap: '0.5rem' }}
          >
            <span className='w-2.5 h-2.5 rounded-full bg-primary' />
            Winners Bracket
          </h4>
        </div>
        <div style={{ padding: '1rem' }} className='overflow-x-auto'>
          <svg
            width={totalWidth + 20}
            height={winnersHeight + 20}
            style={{ minWidth: '100%', display: 'block' }}
          >
            {Object.entries(winnersByRound).map(([round, matches]) =>
              renderRound(matches, Number(round), 10)
            )}
          </svg>
        </div>
      </div>

      <div className='bg-card border border-border rounded-xl overflow-hidden'>
        <div className='border-b border-border' style={{ padding: '1rem' }}>
          <h4
            className='text-base font-semibold flex items-center'
            style={{ gap: '0.5rem' }}
          >
            <span className='w-2.5 h-2.5 rounded-full bg-tertiary' />
            Losers Bracket
          </h4>
        </div>
        <div style={{ padding: '1rem' }} className='overflow-x-auto'>
          {losersMatches.length > 0 ? (
            <svg
              width={totalWidth + 20}
              height={losersHeight + 20}
              style={{ minWidth: '100%', display: 'block' }}
            >
              {Object.entries(losersByRound).map(([round, matches]) =>
                renderRound(matches, Number(round), 10)
              )}
            </svg>
          ) : (
            <div
              className='flex items-center justify-center text-muted text-sm'
              style={{ height: '8rem' }}
            >
              No losers bracket in single elimination
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BracketVisualization
