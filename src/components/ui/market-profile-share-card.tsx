import { Card } from "@/components/ui/card"

export function MarketProfileCard() {
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Gradient background container */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-6 rounded-2xl">
        {/* Header with Markium branding */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white rounded transform rotate-45"></div>
          </div>
          <h1 className="text-white text-2xl font-bold">Markium</h1>
        </div>

        {/* Main card content */}
        <Card className="bg-white rounded-xl p-6 shadow-lg relative overflow-hidden">
          {/* Question section */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">Will Base launch a token in 2025?</h2>
          </div>

          {/* Bet option and average */}
          <div className="flex items-center justify-between mb-8">
            <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold text-lg">No</div>
            <div className="text-gray-500 font-medium">Avg 82¢</div>
          </div>

          {/* Dashed divider with centered Markium logo watermark */}
          <div className="relative my-6">
            <div className="border-t border-dashed border-gray-200"></div>
            <img
              src="/markium-logo.jpg"
              alt=""
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2  w-24 select-none pointer-events-none"
            />
          </div>

          {/* Betting amounts */}
          <div className="flex justify-between items-end">
            <div>
              <div className="text-gray-500 text-sm mb-1">Bet</div>
              <div className="text-2xl font-bold text-gray-900">$369.94</div>
            </div>
            <div className="text-right">
              <div className="text-gray-500 text-sm mb-1">To win</div>
              <div className="text-2xl font-bold text-green-500">$449.99</div>
            </div>
          </div>
        </Card>

        {/* Decorative bottom edge */}
        <div className="flex justify-center mt-4">
          <div className="flex gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-3 h-3 bg-white/30 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
