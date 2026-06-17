export default function PageLoader() {
  const circ = 2 * Math.PI * 34
  const arc = circ / 3

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-8">

        {/* Spinner + logo */}
        <div className="relative flex items-center justify-center w-20 h-20">
          {/* Track ring */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80" fill="none">
            <circle
              cx="40" cy="40" r="34"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gray-200 dark:text-gray-700"
            />
          </svg>

          {/* Spinning arc */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            viewBox="0 0 80 80"
            fill="none"
            style={{ animationDuration: '1.1s', animationTimingFunction: 'linear' }}
          >
            <defs>
              <linearGradient id="spin-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <circle
              cx="40" cy="40" r="34"
              stroke="url(#spin-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${arc} ${circ - arc}`}
            />
          </svg>

          {/* Logo */}
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
        </div>

        {/* Name + dots */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
            KanbanApp
          </span>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 animate-bounce"
                style={{ animationDelay: `${i * 160}ms`, animationDuration: '0.9s' }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
