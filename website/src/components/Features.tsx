import { motion } from 'framer-motion'

const features = [
  {
    icon: '🏆',
    title: 'SE + DE Support',
    description:
      'Full single elimination, double elimination, or anything in between with the flexible losersStartRoundsBeforeFinal option.',
  },
  {
    icon: '⚡',
    title: 'Zero Dependencies',
    description:
      'Lightweight and fast. No external runtime dependencies means smaller bundle sizes and fewer security concerns.',
  },
  {
    icon: '🔷',
    title: 'TypeScript First',
    description:
      'Built with TypeScript from the ground up. Full type definitions included for excellent IDE support and type safety.',
  },
  {
    icon: '🎯',
    title: 'Smart Seeding',
    description:
      'Standard tournament seeding ensures top seeds only meet in later rounds. Seeds 1 and 2 can only meet in finals.',
  },
  {
    icon: '✨',
    title: 'Automatic Byes',
    description:
      'Handles any participant count, not just powers of 2. Byes are automatically calculated and pre-resolved.',
  },
  {
    icon: '🔄',
    title: 'Rematch Prevention',
    description:
      'Intelligent loser routing prevents early rematches in the losers bracket through strategic cross-bracket matchups.',
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
