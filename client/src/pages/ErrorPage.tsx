import { Link } from "react-router-dom"
import { Home, AlertTriangle } from "lucide-react"


export default function ErrorPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-green-50/30 to-emerald-100/30 flex items-center justify-center px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/10 to-green-100/10"></div>
            <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-green-200/20 rounded-full blur-3xl"></div>

            <section className="relative z-10 text-center max-w-md mx-auto">
                {/* Error icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center shadow-lg">
                            <AlertTriangle size={48} className="text-emerald-600" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">!</span>
                        </div>
                    </div>
                </div>

                {/* Error message */}
                <header className="mb-8">
                    <h1 className="text-6xl font-bold text-emerald-800 mb-5">Erro - 404</h1>

                    <h2 className="text-2xl font-semibold text-gray-800 mb-3">Página não encontrada</h2>

                    <p className="text-gray-600 leading-relaxed">
                        Ops! A página que você está procurando não existe ou foi movida para outro lugar.
                    </p>
                </header>

                <Link
                    to="/home"
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                    <Home size={20} className="group-hover:scale-110 transition-transform duration-200" />
                    Voltar ao início
                </Link>
            </section>
        </main>
    )
}
