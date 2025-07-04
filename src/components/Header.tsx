export default function Header(){
    return (
        <header className="bg-white border-b boreder-gray-200 stick top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    { /*Left side logo and nav */ }
                    <div className="flex items-center space-x-8">
                        <h1 className="text-2xl font-bold text-gray=900">Top Trader</h1>
                        <nav className="hidden md:flex space-x-6">
                            <a href="#" className="text-blue-600 font-medium">Gains Wall</a>
                            <a href="#" className="text-gray-600 hover:text-gray-900">Global Leaderboard</a>
                            <a href="#" className="text-gray600 hover:text-gray-900">Friends Leaderboard</a>
                        </nav>
                    </div>

                    { /* Right side - Search + profile */ }
                    <div className="flex items-center space-x-4">
                        <div className="relative hidden md:block">
                            <input 
                                type="text"
                                placeholder="Search for traders..."
                                className="bg-gray-100 rounded-full px-4 py-2 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />    
                        </div>
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                            A
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}