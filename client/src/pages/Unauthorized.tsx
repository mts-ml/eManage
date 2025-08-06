import { Link } from "react-router-dom"


export const Unauthorized: React.FC = () => {


    return (
        <main className="max-h-[calc(100vh-72px)] flex flex-col items-center justify-center h-screen p-6 text-rose-50 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700">
            <h1 className="text-4xl font-extrabold mb-4 text-center tracking-wide text-emerald-400">
                Acesso não autorizado
            </h1>
            <p className="text-center mb-8 text-rose-50 max-w-md">
                Você não tem permissão para acessar essa página ou realizar essa ação.
            </p>
            <Link
                to="/"
                className="block rounded-md px-6 py-2 font-medium bg-emerald-400 text-neutral-900 text-center hover:text-white transition-colors hover:bg-emerald-500"
            >
                Voltar a página de login
            </Link>
        </main>
    )
}
