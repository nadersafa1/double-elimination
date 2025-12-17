const Footer = () => {
  return (
    <footer 
      className="border-t border-border mt-auto flex justify-center px-4 sm:px-6"
      style={{ paddingTop: '3rem', paddingBottom: '3rem' }}
    >
      <div className="w-full max-w-6xl">
        <div 
          className="flex flex-col sm:flex-row justify-between items-center"
          style={{ gap: '1.5rem' }}
        >
          <div className="text-center sm:text-left">
            <h3 
              className="text-lg font-bold"
              style={{ marginBottom: '0.25rem' }}
            >
              double-elimination
            </h3>
            <p className="text-muted text-sm">
              Tournament bracket generation made simple
            </p>
          </div>

          <div className="flex text-sm" style={{ gap: '1.5rem' }}>
            <a
              href="https://www.npmjs.com/package/double-elimination"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-primary transition-colors"
            >
              npm
            </a>
            <a
              href="https://github.com/nadersafa1/double-elimination"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-primary transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/nadersafa1/double-elimination#api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-primary transition-colors"
            >
              Docs
            </a>
          </div>
        </div>

        <div 
          className="border-t border-border text-center text-xs sm:text-sm text-muted"
          style={{ marginTop: '1.5rem', paddingTop: '1.5rem' }}
        >
          <p>
            MIT License • Built by{' '}
            <a
              href="https://github.com/nadersafa1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Nader Safa
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
