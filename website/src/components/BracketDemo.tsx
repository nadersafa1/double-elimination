import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { generateDoubleElimination } from 'double-elimination'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import BracketVisualization from './BracketVisualization'

type FormatType = 'double' | 'single-3rd' | 'single'

const BracketDemo = () => {
  const [participantCount, setParticipantCount] = useState(8)
  const [format, setFormat] = useState<FormatType>('double')

  const formatConfig: Record<FormatType, number | undefined> = {
    double: undefined,
    'single-3rd': 1,
    single: 0,
  }

  const matches = useMemo(() => {
    const participants = Array.from({ length: participantCount }, (_, i) => ({
      registrationId: `player-${i + 1}`,
      seed: i + 1,
    }))

    let counter = 0
    return generateDoubleElimination({
      eventId: 'demo',
      participants,
      idFactory: () => `match-${++counter}`,
      losersStartRoundsBeforeFinal: formatConfig[format],
    })
  }, [participantCount, format])

  const winnersMatches = matches.filter((m) => m.bracketType === 'winners')
  const losersMatches = matches.filter((m) => m.bracketType === 'losers')

  return (
    <section 
      id="demo"
      className="bg-card/30 flex justify-center px-4 sm:px-6"
      style={{ paddingTop: '5rem', paddingBottom: '5rem' }}
    >
      <div className="w-full max-w-6xl">
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
            <span className="text-primary">Interactive</span> Demo
          </h2>
          <p className="text-base sm:text-xl text-muted max-w-2xl mx-auto">
            See the bracket generator in action. Adjust participants and format to
            explore different tournament structures.
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
            className="bg-card border border-border rounded-xl"
            style={{ padding: '1.25rem' }}
          >
            <h3 
              className="text-base sm:text-lg font-semibold"
              style={{ marginBottom: '1.25rem' }}
            >
              Configuration
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label 
                  className="block text-sm font-medium"
                  style={{ marginBottom: '0.75rem' }}
                >
                  Participants: <span className="text-primary font-bold">{participantCount}</span>
                </label>
                <Slider
                  value={[participantCount]}
                  onValueChange={([value]) => setParticipantCount(value)}
                  min={4}
                  max={128}
                  step={1}
                  className="w-full max-w-md"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium"
                  style={{ marginBottom: '0.75rem' }}
                >
                  Tournament Format
                </label>
                <Tabs
                  value={format}
                  onValueChange={(v) => setFormat(v as FormatType)}
                >
                  <TabsList className="bg-background h-auto flex-wrap" style={{ padding: '0.25rem' }}>
                    <TabsTrigger value="double" className="text-xs sm:text-sm" style={{ padding: '0.375rem 0.75rem' }}>
                      Double Elim
                    </TabsTrigger>
                    <TabsTrigger value="single-3rd" className="text-xs sm:text-sm" style={{ padding: '0.375rem 0.75rem' }}>
                      SE + 3rd
                    </TabsTrigger>
                    <TabsTrigger value="single" className="text-xs sm:text-sm" style={{ padding: '0.375rem 0.75rem' }}>
                      Single Elim
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div 
                className="border-t border-border flex flex-wrap"
                style={{ paddingTop: '1rem', gap: '0.5rem' }}
              >
                <Badge variant="secondary" className="text-xs" style={{ padding: '0.375rem 0.75rem' }}>
                  <span className="font-bold" style={{ marginRight: '0.25rem' }}>{matches.length}</span> total
                </Badge>
                <Badge variant="outline" className="border-primary/50 text-xs" style={{ padding: '0.375rem 0.75rem' }}>
                  <span className="font-bold text-primary" style={{ marginRight: '0.25rem' }}>{winnersMatches.length}</span> winners
                </Badge>
                <Badge variant="outline" className="border-tertiary/50 text-xs" style={{ padding: '0.375rem 0.75rem' }}>
                  <span className="font-bold text-tertiary" style={{ marginRight: '0.25rem' }}>{losersMatches.length}</span> losers
                </Badge>
              </div>
            </div>
          </div>

          <BracketVisualization
            winnersMatches={winnersMatches}
            losersMatches={losersMatches}
            participantCount={participantCount}
          />
        </motion.div>
      </div>
    </section>
  )
}

export default BracketDemo
