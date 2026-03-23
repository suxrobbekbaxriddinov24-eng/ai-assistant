export function AudioWave({ active = false, color = '#3b82f6', bars = 5 }) {
  return (
    <div className="flex items-center gap-0.5 h-8" aria-label={active ? 'Audio playing' : 'Silent'}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full transition-all"
          style={{
            backgroundColor: active ? color : '#374151',
            height: active ? `${Math.random() * 60 + 20}%` : '20%',
            animation: active ? `wave ${0.8 + i * 0.1}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0% { height: 20%; }
          100% { height: ${70 + Math.random() * 20}%; }
        }
      `}</style>
    </div>
  )
}
