import ReactMarkdown from 'react-markdown'

export function StreamingText({ text }) {
  if (!text) return null
  return (
    <div className="flex justify-start mb-4">
      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0 mt-1">
        AI
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 bg-gray-800 text-gray-100">
        <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
        <span className="inline-block w-1.5 h-4 bg-blue-400 ml-0.5 animate-pulse rounded-sm" />
      </div>
    </div>
  )
}
