import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { generateTournament, type TournamentOptions } from 'double-elimination'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import BracketVisualization from './BracketVisualization'
import RoundRobinVisualization from './RoundRobinVisualization'

type DemoFormat =
  | 'double'
  | 'double-gf'
  | 'single'
  | 'single-3rd'
  | 'round-robin'

const FORMAT_LABELS: Record<DemoFormat, string> = {
  double: 'Double Elim',
  'double-gf': 'DE + Grand Final',
  single: 'Single Elim',
  'single-3rd': 'SE + 3rd',
  'round-robin': 'Round Robin',
}

const FORMAT_BLURBS: Record<DemoFormat, string> = {
  double: 'Winners final decides 1st/2nd, losers final decides 3rd/4th.',
  'double-gf':
    'The winners final loser drops to the losers final, then both bracket winners meet — with a bracket reset if the comeback lands.',
  single: 'One loss and you are out.',
  'single-3rd': 'Knockout, with the two semifinal losers playing for bronze.',
  'round-robin':
    'Everyone plays everyone, then the table sorts it out. Try legs and groups.',
}

const BracketDemo = () => {
  const [participantCount, setParticipantCount] = useState(8)
  const [format, setFormat] = useState<DemoFormat>('double')
  const [legs, setLegs] = useState(1)
  const [groupCount, setGroupCount] = useState(1)

  const isRoundRobin = format === 'round-robin'
  // A full round robin grows quadratically, so keep the demo responsive.
  const maxParticipants = isRoundRobin ? 24 : 128
  const cappedCount = Math.min(participantCount, maxParticipants)
  const maxGroups = Math.max(1, Math.floor(cappedCount / 2))
  const cappedGroups = Math.min(groupCount, maxGroups)

  const participants = useMemo(
    () =>
      Array.from({ length: cappedCount }, (_, i) => ({
        registrationId: `player-${i + 1}`,
        seed: i + 1,
      })),
    [cappedCount]
  )

  const matches = useMemo(() => {
    let counter = 0
    const base = {
      eventId: 'demo',
      participants,
      idFactory: () => `match-${++counter}`,
    }

    const options: TournamentOptions =
      format === 'round-robin'
        ? { format: 'round-robin', ...base, legs, groupCount: cappedGroups }
        : format === 'single'
          ? { format: 'single-elimination', ...base }
          : format === 'single-3rd'
            ? { format: 'single-elimination', ...base, thirdPlaceMatch: true }
            : {
                format: 'double-elimination',
                ...base,
                grandFinal: format === 'double-gf' ? 'reset' : 'none',
              }

    return generateTournament(options)
  }, [participants, format, legs, cappedGroups])

  const winnersMatches = matches.filter((m) => m.bracketType === 'winners')
  const losersMatches = matches.filter((m) => m.bracketType === 'losers')
  const grandFinalMatches = matches.filter((m) => m.bracketType === 'grandFinal')

  // Rounds are numbered from 1 within each bracket and each group, so the
  // highest round number is how long the longest of them runs.
  const rounds = Math.max(...matches.map((m) => m.round), 0)

  // In a group stage the field is split, so nobody plays everyone.
  const gamesEach = useMemo(() => {
    const appearances = new Map<string, number>()
    for (const match of matches) {
      for (const id of [match.registration1Id, match.registration2Id]) {
        if (id) appearances.set(id, (appearances.get(id) ?? 0) + 1)
      }
    }
    return Math.max(...appearances.values(), 0)
  }, [matches])

  return (
    <section
      id='demo'
      className='bg-card/30 flex justify-center px-4 sm:px-6'
      style={{ paddingTop: '5rem', paddingBottom: '5rem' }}
    >
      <div className='w-full max-w-6xl'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className='text-center'
          style={{ marginBottom: '2.5rem' }}
        >
          <h2
            className='text-2xl sm:text-4xl md:text-5xl font-bold'
            style={{ marginBottom: '1rem' }}
          >
            <span className='text-primary'>Interactive</span> Demo
          </h2>
          <p className='text-base sm:text-xl text-muted max-w-2xl mx-auto'>
            Every format the package generates, live. Adjust the field and the
            format to see what comes out.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div
            className='bg-card border border-border rounded-xl'
            style={{ padding: '1.25rem' }}
          >
            <h3
              className='text-base sm:text-lg font-semibold'
              style={{ marginBottom: '1.25rem' }}
            >
              Configuration
            </h3>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              <div>
                <label
                  className='block text-sm font-medium'
                  style={{ marginBottom: '0.75rem' }}
                >
                  Participants:{' '}
                  <span className='text-primary font-bold'>{cappedCount}</span>
                </label>
                <Slider
                  value={[cappedCount]}
                  onValueChange={([value]) => setParticipantCount(value)}
                  min={4}
                  max={maxParticipants}
                  step={1}
                  className='w-full max-w-md'
                />
              </div>

              <div>
                <label
                  className='block text-sm font-medium'
                  style={{ marginBottom: '0.75rem' }}
                >
                  Tournament Format
                </label>
                <Tabs
                  value={format}
                  onValueChange={(v) => setFormat(v as DemoFormat)}
                >
                  <TabsList
                    className='bg-background h-auto flex-wrap'
                    style={{ padding: '0.25rem' }}
                  >
                    {(Object.keys(FORMAT_LABELS) as DemoFormat[]).map((key) => (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className='text-xs sm:text-sm'
                        style={{ padding: '0.375rem 0.75rem' }}
                      >
                        {FORMAT_LABELS[key]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <p className='text-xs text-muted' style={{ marginTop: '0.75rem' }}>
                  {FORMAT_BLURBS[format]}
                </p>
              </div>

              {isRoundRobin && (
                <div className='grid sm:grid-cols-2' style={{ gap: '1.5rem' }}>
                  <div>
                    <label
                      className='block text-sm font-medium'
                      style={{ marginBottom: '0.75rem' }}
                    >
                      Legs:{' '}
                      <span className='text-primary font-bold'>{legs}</span>
                      <span className='text-muted font-normal'>
                        {legs > 1 ? ' — sides swap each leg' : ''}
                      </span>
                    </label>
                    <Slider
                      value={[legs]}
                      onValueChange={([value]) => setLegs(value)}
                      min={1}
                      max={3}
                      step={1}
                      className='w-full max-w-xs'
                    />
                  </div>
                  <div>
                    <label
                      className='block text-sm font-medium'
                      style={{ marginBottom: '0.75rem' }}
                    >
                      Groups:{' '}
                      <span className='text-primary font-bold'>
                        {cappedGroups}
                      </span>
                      <span className='text-muted font-normal'>
                        {cappedGroups > 1 ? ' — snake seeded' : ''}
                      </span>
                    </label>
                    <Slider
                      value={[cappedGroups]}
                      onValueChange={([value]) => setGroupCount(value)}
                      min={1}
                      max={Math.min(maxGroups, 8)}
                      step={1}
                      className='w-full max-w-xs'
                    />
                  </div>
                </div>
              )}

              <div
                className='border-t border-border flex flex-wrap'
                style={{ paddingTop: '1rem', gap: '0.5rem' }}
              >
                <Badge
                  variant='secondary'
                  className='text-xs'
                  style={{ padding: '0.375rem 0.75rem' }}
                >
                  <span className='font-bold' style={{ marginRight: '0.25rem' }}>
                    {matches.length}
                  </span>{' '}
                  matches
                </Badge>
                <Badge
                  variant='outline'
                  className='border-border text-xs'
                  style={{ padding: '0.375rem 0.75rem' }}
                >
                  <span className='font-bold' style={{ marginRight: '0.25rem' }}>
                    {rounds}
                  </span>{' '}
                  rounds
                </Badge>
                {isRoundRobin ? (
                  <Badge
                    variant='outline'
                    className='border-primary/50 text-xs'
                    style={{ padding: '0.375rem 0.75rem' }}
                  >
                    <span
                      className='font-bold text-primary'
                      style={{ marginRight: '0.25rem' }}
                    >
                      {gamesEach}
                    </span>{' '}
                    games each
                  </Badge>
                ) : (
                  <>
                    <Badge
                      variant='outline'
                      className='border-primary/50 text-xs'
                      style={{ padding: '0.375rem 0.75rem' }}
                    >
                      <span
                        className='font-bold text-primary'
                        style={{ marginRight: '0.25rem' }}
                      >
                        {winnersMatches.length}
                      </span>{' '}
                      winners
                    </Badge>
                    {losersMatches.length > 0 && (
                      <Badge
                        variant='outline'
                        className='border-tertiary/50 text-xs'
                        style={{ padding: '0.375rem 0.75rem' }}
                      >
                        <span
                          className='font-bold text-tertiary'
                          style={{ marginRight: '0.25rem' }}
                        >
                          {losersMatches.length}
                        </span>{' '}
                        {format === 'single-3rd' ? 'third place' : 'losers'}
                      </Badge>
                    )}
                    {grandFinalMatches.length > 0 && (
                      <Badge
                        variant='outline'
                        className='border-secondary/50 text-xs'
                        style={{ padding: '0.375rem 0.75rem' }}
                      >
                        <span
                          className='font-bold text-secondary'
                          style={{ marginRight: '0.25rem' }}
                        >
                          {grandFinalMatches.length}
                        </span>{' '}
                        grand final
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {isRoundRobin ? (
            <RoundRobinVisualization
              matches={matches}
              participants={participants}
              showSampleResults
            />
          ) : (
            <BracketVisualization
              winnersMatches={winnersMatches}
              losersMatches={losersMatches}
              grandFinalMatches={grandFinalMatches}
              participantCount={cappedCount}
            />
          )}
        </motion.div>
      </div>
    </section>
  )
}

export default BracketDemo
