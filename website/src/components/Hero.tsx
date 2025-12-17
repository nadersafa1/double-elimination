import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const Hero = () => {
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6"
      style={{ paddingTop: '6rem', paddingBottom: '6rem' }}
    >
      {/* Background gradient mesh */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[600px] h-80 sm:h-[600px] bg-tertiary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-4xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center"
          style={{ gap: '0.5rem', marginBottom: '2rem' }}
        >
          <Badge variant="outline" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }} className="border-primary/50 text-primary">
            v1.2.2
          </Badge>
          <Badge variant="outline" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }} className="border-success/50 text-success">
            Zero Dependencies
          </Badge>
          <Badge variant="outline" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }} className="border-secondary/50 text-secondary">
            TypeScript
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight"
          style={{ marginBottom: '1.5rem' }}
        >
          <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
            Tournament Brackets
          </span>
          <br />
          <span className="text-foreground">Made Simple</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-xl md:text-2xl text-muted max-w-2xl px-2"
          style={{ marginBottom: '2.5rem' }}
        >
          Generate single & double elimination brackets with automatic seeding, 
          bye handling, and full TypeScript support.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center w-full"
          style={{ gap: '1rem', marginBottom: '3rem' }}
        >
          <div 
            className="bg-card border border-border rounded-lg font-mono text-xs sm:text-sm overflow-x-auto max-w-full"
            style={{ padding: '0.75rem 1rem' }}
          >
            <span className="text-muted">$</span>{' '}
            <span className="text-foreground">npm install</span>{' '}
            <span className="text-primary whitespace-nowrap">double-elimination</span>
          </div>
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
            style={{ padding: '0.75rem 2rem' }}
          >
            <a
              href="https://github.com/nadersafa1/double-elimination"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center"
          style={{ gap: '1rem' }}
        >
          <a
            href="https://www.npmjs.com/package/double-elimination"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src="https://img.shields.io/npm/v/double-elimination.svg?style=flat-square"
              alt="npm version"
              style={{ height: '1.25rem' }}
            />
          </a>
          <a
            href="https://www.npmjs.com/package/double-elimination"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src="https://img.shields.io/npm/dw/double-elimination.svg?style=flat-square"
              alt="npm downloads"
              style={{ height: '1.25rem' }}
            />
          </a>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
