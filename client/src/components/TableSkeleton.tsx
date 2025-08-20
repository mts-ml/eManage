export const TableSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4 rounded-t-2xl">
        <div className="h-6 bg-emerald-500 rounded w-32 mx-auto"></div>
      </div>
      
      {/* Table rows */}
      <div className="bg-white rounded-b-2xl overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-b border-gray-100 last:border-b-0">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
