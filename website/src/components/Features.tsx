import { motion } from 'framer-motion'

const features = [
  {
    icon: '🏆',
    title: 'Three Formats',
    description:
      'Double elimination, single elimination and round robin — all returning the same match shape, so one renderer serves every format.',
  },
  {
    icon: '🥇',
    title: 'Grand Final & Reset',
    description:
      'Opt into a real double elimination finish: the winners final loser drops to the losers final, and a bracket reset when the comeback lands.',
  },
  {
    icon: '📊',
    title: 'Standings & Tiebreakers',
    description:
      'League tables from your results, with a configurable points system and head-to-head, score difference, score for, wins and seed tiebreakers.',
  },
  {
    icon: '🎯',
    title: 'Smart Seeding',
    description:
      'Standard tournament seeding ensures top seeds only meet in later rounds. Seeds 1 and 2 can only meet in finals.',
  },
  {
    icon: '✨',
    title: 'Byes Done Right',
    description:
      'Any participant count, not just powers of 2. Walkovers are pre-resolved through the whole bracket, so nothing ever stalls on a missing opponent.',
  },
  {
    icon: '🔄',
    title: 'Rematch Prevention',
    description:
      'Rotating loser routing keeps players away from opponents they already beat, pushing the first possible rematch deep into the losers bracket.',
  },
  {
    icon: '🗓️',
    title: 'Leagues & Groups',
    description:
      'Circle-method fixtures with balanced sides, home-and-away legs, and snake-seeded group stages that feed straight into a playoff bracket.',
  },
  {
    icon: '⚡',
    title: 'Zero Dependencies',
    description:
      'Lightweight and fast. ESM and CommonJS builds, no runtime dependencies, smaller bundles and fewer security concerns.',
  },
  {
    icon: '🔷',
    title: 'TypeScript First',
    description:
      'Built with TypeScript from the ground up. Full type definitions included for excellent IDE support and type safety.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const Features = () => {
  return (
    <section 
      id="features"
      className="flex justify-center px-4 sm:px-6"
      style={{ paddingTop: '5rem', paddingBottom: '5rem' }}
    >
      <div className="w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
          style={{ marginBottom: '3rem' }}
        >
          <h2 
            className="text-2xl sm:text-4xl md:text-5xl font-bold"
            style={{ marginBottom: '1rem' }}
          >
            Everything You Need for{' '}
            <span className="text-primary">Tournament Brackets</span>
          </h2>
          <p className="text-base sm:text-xl text-muted max-w-2xl mx-auto">
            A complete solution for generating tournament structures programmatically
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: '1rem' }}
        >
          {features.map((feature) => (
            <motion.div 
              key={feature.title} 
              variants={itemVariants}
              className="bg-card border border-border rounded-xl hover:border-primary/50 transition-colors h-full"
              style={{ padding: '1.5rem' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{feature.icon}</div>
              <h3 
                className="text-lg font-semibold"
                style={{ marginBottom: '0.5rem' }}
              >
                {feature.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Features
