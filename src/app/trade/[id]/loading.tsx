export default function Loading() {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
  
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Trade Card Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-3">
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-full h-20 bg-gray-100 rounded animate-pulse"></div>
                <div className="flex space-x-4">
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
  
          {/* Comments Section Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="w-40 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-full h-16 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }