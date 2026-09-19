import { useMemo } from 'react'
import {
  calculateStandings,
  type MatchResult,
  type Participant,
  type TournamentMatch,
} from 'double-elimination'

interface Props {
  matches: TournamentMatch[]
  participants: Participant[]
  /** Fill the table with plausible made-up results. */
  showSampleResults: boolean
}

/**
 * Deterministic pseudo-random scoreline, so the demo is stable across renders.
 *
 * Mixes the bits rather than taking a single step of a linear generator, which
 * on consecutive inputs would walk a short cycle and never produce a draw.
 */
const sampleScore = (seed: number) => {
  let mixed = Math.imul(seed + 1, 2654435761)
  mixed ^= mixed >>> 15
  mixed = Math.imul(mixed, 2246822519)
  mixed ^= mixed >>> 13
  return Math.abs(mixed) % 4
}

const RoundRobinVisualization = ({
  matches,
  participants,
  showSampleResults,
}: Props) => {
  const groups = useMemo(
    () => [...new Set(matches.map((m) => m.group))],
    [matches]
  )

  const results = useMemo<MatchResult[]>(() => {
    if (!showSampleResults) return []
    return matches.map((match, index) => ({
      matchId: match.id,
      score1: sampleScore(index * 2),
      score2: sampleScore(index * 2 + 1),
    }))
  }, [matches, showSampleResults])

  const standings = useMemo(
    () => calculateStandings({ matches, results, participants }),
    [matches, results, participants]
  )

  const roundsOf = (group: number | null) => {
    const rounds = new Map<number, TournamentMatch[]>()
    for (const match of matches.filter((m) => m.group === group)) {
      rounds.set(match.round, [...(rounds.get(match.round) ?? []), match])
    }
    for (const [, inRound] of rounds) {
      inRound.sort((a, b) => a.bracketPosition - b.bracketPosition)
    }
    return [...rounds.entries()].sort((a, b) => a[0] - b[0])
  }

  const shortName = (id: string | null) =>
    (id ?? '').replace('player-', 'P')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {groups.map((group) => {
        const rounds = roundsOf(group)
        const groupStandings = standings.filter((row) => row.group === group)

        return (
          <div
            key={String(group)}
            className='grid lg:grid-cols-2'
            style={{ gap: '1rem' }}
          >
            <div className='bg-card border border-border rounded-xl overflow-hidden'>
              <div
                className='border-b border-border flex items-center justify-between'
                style={{ padding: '1rem' }}
              >
                <h4
                  className='text-base font-semibold flex items-center'
                  style={{ gap: '0.5rem' }}
                >
                  <span className='w-2.5 h-2.5 rounded-full bg-primary' />
                  {group === null ? 'Fixtures' : `Group ${group + 1} fixtures`}
                </h4>
                <span className='text-xs text-muted'>
                  {rounds.length} rounds
                </span>
              </div>

              <div
                style={{
                  padding: '1rem',
                  maxHeight: '22rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {rounds.map(([round, inRound]) => (
                  <div key={round}>
                    <div
                      className='text-xs font-medium text-muted uppercase tracking-wide'
                      style={{ marginBottom: '0.375rem' }}
                    >
                      Round {round}
                      {inRound[0].leg > 1 ? ` · leg ${inRound[0].leg}` : ''}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      {inRound.map((match) => (
                        <div
                          key={match.id}
                          className='flex items-center justify-between bg-background/50 rounded-lg text-sm'
                          style={{ padding: '0.5rem 0.75rem' }}
                        >
                          <span className='font-medium'>
                            {shortName(match.registration1Id)}
                          </span>
                          <span className='text-muted text-xs'>v</span>
                          <span className='font-medium'>
                            {shortName(match.registration2Id)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-card border border-border rounded-xl overflow-hidden'>
              <div
                className='border-b border-border flex items-center justify-between'
                style={{ padding: '1rem' }}
              >
                <h4
                  className='text-base font-semibold flex items-center'
                  style={{ gap: '0.5rem' }}
                >
                  <span className='w-2.5 h-2.5 rounded-full bg-tertiary' />
                  {group === null ? 'Standings' : `Group ${group + 1} table`}
                </h4>
                <span className='text-xs text-muted'>
                  {showSampleResults ? 'sample results' : 'no results yet'}
                </span>
              </div>

              <div style={{ padding: '1rem', maxHeight: '22rem', overflowY: 'auto' }}>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='text-muted text-xs'>
                      <th className='text-left font-medium' style={{ padding: '0.25rem' }}>
                        #
                      </th>
                      <th className='text-left font-medium' style={{ padding: '0.25rem' }}>
                        Player
                      </th>
                      <th className='text-right font-medium' style={{ padding: '0.25rem' }}>
                        P
                      </th>
                      <th className='text-right font-medium' style={{ padding: '0.25rem' }}>
                        W
                      </th>
                      <th className='text-right font-medium' style={{ padding: '0.25rem' }}>
                        D
                      </th>
                      <th className='text-right font-medium' style={{ padding: '0.25rem' }}>
                        L
                      </th>
                      <th className='text-right font-medium' style={{ padding: '0.25rem' }}>
                        SD
                      </th>
                      <th className='text-right font-medium' style={{ padding: '0.25rem' }}>
                        Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupStandings.map((row) => (
                      <tr
                        key={row.registrationId}
                        className='border-t border-border/50'
                      >
                        <td className='text-muted' style={{ padding: '0.375rem 0.25rem' }}>
                          {row.rank}
                        </td>
                        <td className='font-medium' style={{ padding: '0.375rem 0.25rem' }}>
                          {shortName(row.registrationId)}
                        </td>
                        <td className='text-right text-muted' style={{ padding: '0.375rem 0.25rem' }}>
                          {row.played}
                        </td>
                        <td className='text-right' style={{ padding: '0.375rem 0.25rem' }}>
                          {row.won}
                        </td>
                        <td className='text-right' style={{ padding: '0.375rem 0.25rem' }}>
                          {row.drawn}
                        </td>
                        <td className='text-right' style={{ padding: '0.375rem 0.25rem' }}>
                          {row.lost}
                        </td>
                        <td className='text-right text-muted' style={{ padding: '0.375rem 0.25rem' }}>
                          {row.scoreDifference > 0 ? '+' : ''}
                          {row.scoreDifference}
                        </td>
                        <td
                          className='text-right font-bold text-primary'
                          style={{ padding: '0.375rem 0.25rem' }}
                        >
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RoundRobinVisualization
