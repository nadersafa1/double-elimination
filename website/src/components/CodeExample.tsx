import { motion } from 'framer-motion'
import { Highlight, themes } from 'prism-react-renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const doubleEliminationCode = `import { generateDoubleElimination } from 'double-elimination'

const matches = generateDoubleElimination({
  eventId: 'spring-major',
  participants: [
    { registrationId: 'player-1', seed: 1 },
    { registrationId: 'player-2', seed: 2 },
    // ... more participants
  ],
  idFactory: () => crypto.randomUUID(),
  grandFinal: 'reset', // 'none' | 'single' | 'reset'
})

// Winners bracket, losers bracket and the grand final,
// already wired together through winnerTo / loserTo.`

const singleEliminationCode = `import { generateSingleElimination } from 'double-elimination'

const matches = generateSingleElimination({
  eventId: 'knockout-cup',
  participants: teams.map((team, i) => ({
    registrationId: team.id,
    seed: i + 1,
  })),
  idFactory: () => crypto.randomUUID(),
  thirdPlaceMatch: true, // semifinal losers play for bronze
})

// 16 teams -> 15 matches, plus the third place match.
// Byes are pre-resolved, so odd counts just work.`

const roundRobinCode = `import { generateRoundRobin } from 'double-elimination'

const fixtures = generateRoundRobin({
  eventId: 'league-2026',
  participants: clubs.map((club, i) => ({
    registrationId: club.id,
    seed: i + 1,
  })),
  idFactory: () => crypto.randomUUID(),
  legs: 2,       // home and away
  groupCount: 1, // or split into snake-seeded groups
})

// Everyone plays everyone: seeded fixtures, balanced
// sides, and a rest round when the field is odd.`

const standingsCode = `import { calculateStandings } from 'double-elimination'

const table = calculateStandings({
  matches: fixtures,
  results: [
    { matchId: fixtures[0].id, score1: 2, score2: 1 },
    { matchId: fixtures[1].id, winnerId: null }, // a draw
  ],
  points: { win: 3, draw: 1, loss: 0 },
  tiebreakers: ['headToHead', 'scoreDifference', 'wins'],
})

// -> [{ rank, registrationId, played, won, drawn,
//       lost, scoreFor, scoreAgainst, points }, ...]`

interface CodeBlockProps {
  code: string
}

const CodeBlock = ({ code }: CodeBlockProps) => (
  <Highlight theme={themes.nightOwl} code={code} language="typescript">
    {({ style, tokens, getLineProps, getTokenProps }) => (
      <pre
        style={{ ...style, background: 'transparent', padding: '1rem', margin: 0 }}
        className="text-xs sm:text-sm overflow-x-auto font-mono"
      >
        {tokens.map((line, i) => (
          <div key={i} {...getLineProps({ line })}>
            <span 
              className="inline-block text-muted-foreground select-none opacity-50 text-right"
              style={{ width: '1.5rem', marginRight: '0.75rem' }}
            >
              {i + 1}
            </span>
            {line.map((token, key) => (
              <span key={key} {...getTokenProps({ token })} />
            ))}
          </div>
        ))}
      </pre>
    )}
  </Highlight>
)

const CodeExample = () => {
  return (
    <section 
      id="usage"
      className="flex justify-center px-4 sm:px-6"
      style={{ paddingTop: '5rem', paddingBottom: '5rem' }}
    >
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
          style={{ marginBottom: '2.5rem' }}
        >
          <h2 
            className="text-2xl sm:text-4xl md:text-5xl font-bold"
            style={{ marginBottom: '1rem' }}
          >
            Simple <span className="text-primary">API</span>
          </h2>
          <p className="text-base sm:text-xl text-muted max-w-2xl mx-auto">
            A generator per format, or one generateTournament call when the
            format is data. Same match shape either way.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Tabs defaultValue="double">
              <div 
                className="border-b border-border flex flex-col sm:flex-row sm:items-center justify-between"
                style={{ padding: '1rem', gap: '0.75rem' }}
              >
                <h3 className="text-base font-semibold">Usage Examples</h3>
                <TabsList className="bg-background h-auto flex-wrap" style={{ padding: '0.25rem' }}>
                  <TabsTrigger value="double" className="text-xs sm:text-sm" style={{ padding: '0.375rem 0.75rem' }}>
                    Double Elim
                  </TabsTrigger>
                  <TabsTrigger value="single" className="text-xs sm:text-sm" style={{ padding: '0.375rem 0.75rem' }}>
                    Single Elim
                  </TabsTrigger>
                  <TabsTrigger value="roundRobin" className="text-xs sm:text-sm" style={{ padding: '0.375rem 0.75rem' }}>
                    Round Robin
                  </TabsTrigger>
                  <TabsTrigger value="standings" className="text-xs sm:text-sm" style={{ padding: '0.375rem 0.75rem' }}>
                    Standings
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="double" style={{ margin: 0 }}>
                <CodeBlock code={doubleEliminationCode} />
              </TabsContent>
              <TabsContent value="single" style={{ margin: 0 }}>
                <CodeBlock code={singleEliminationCode} />
              </TabsContent>
              <TabsContent value="roundRobin" style={{ margin: 0 }}>
                <CodeBlock code={roundRobinCode} />
              </TabsContent>
              <TabsContent value="standings" style={{ margin: 0 }}>
                <CodeBlock code={standingsCode} />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CodeExample
