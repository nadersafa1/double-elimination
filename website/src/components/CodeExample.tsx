import { motion } from 'framer-motion'
import { Highlight, themes } from 'prism-react-renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const doubleEliminationCode = `import { generateDoubleElimination } from 'double-elimination'

const matches = generateDoubleElimination({
  eventId: 'championship-2024',
  participants: [
    { registrationId: 'player-1', seed: 1 },
    { registrationId: 'player-2', seed: 2 },
    // ... more participants
  ],
  idFactory: () => crypto.randomUUID(),
})`

const singleEliminationCode = `import { generateDoubleElimination } from 'double-elimination'

// Pure single elimination (no losers bracket)
const matches = generateDoubleElimination({
  eventId: 'knockout-cup',
  participants: teams.map((team, i) => ({
    registrationId: team.id,
    seed: i + 1,
  })),
  idFactory: () => crypto.randomUUID(),
  losersStartRoundsBeforeFinal: 0,
})`

const thirdPlaceCode = `import { generateDoubleElimination } from 'double-elimination'

// Single elimination with 3rd place match
const matches = generateDoubleElimination({
  eventId: 'world-cup',
  participants: countries.map((c, i) => ({
    registrationId: c.code,
    seed: i + 1,
  })),
  idFactory: () => crypto.randomUUID(),
  losersStartRoundsBeforeFinal: 1,
})`

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
            One function, multiple tournament formats. 
            Configure with a single option to switch between SE and DE.
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
                <TabsList className="bg-background h-auto" style={{ padding: '0.25rem' }}>
                  <TabsTrigger value="double" className="text-xs sm:text-sm" style={{ padding: '0.375rem 0.75rem' }}>
                    Double
                  </TabsTrigger>
                  <TabsTrigger value="single" className="text-xs sm:text-sm" style={{ padding: '0.375rem 0.75rem' }}>
                    Single
                  </TabsTrigger>
                  <TabsTrigger value="third" className="text-xs sm:text-sm" style={{ padding: '0.375rem 0.75rem' }}>
                    3rd Place
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="double" style={{ margin: 0 }}>
                <CodeBlock code={doubleEliminationCode} />
              </TabsContent>
              <TabsContent value="single" style={{ margin: 0 }}>
                <CodeBlock code={singleEliminationCode} />
              </TabsContent>
              <TabsContent value="third" style={{ margin: 0 }}>
                <CodeBlock code={thirdPlaceCode} />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CodeExample
