import { NavLink } from "react-router-dom"
import { useContext } from "react"

import { LogoutButton } from "./LogoutButton"
import AuthContext from "../Context/AuthContext"


export const Header: React.FC = () => {
    const { auth } = useContext(AuthContext)

    const navLinkClass = "relative after:content-[''] after:absolute after:left-0 after:bottom-[-7px] after:h-[2px] after:w-full after:bg-gradient-to-r after:from-emerald-400 after:to-green-400 after:opacity-100 after:scale-x-100 after:transition-all after:duration-300 after:ease-in-out text-emerald-300 font-semibold"


    return (
        <header className="relative bg-gradient-to-r from-green-900 via-emerald-800 to-green-900 text-white shadow-xl border-b border-emerald-700/30">
            <div className="max-w-[1400px] mx-auto px-6 py-5 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-green-300">
                    <NavLink to="/main" className="hover:from-emerald-100 hover:to-green-200 transition-all duration-300">
                        🐼 Panda Alimentos
                    </NavLink>
                </h1>

                <nav>
                    {auth.accessToken && (
                        <h2 className="absolute left-1/2 top-1/2 transform -translate-1/2 text-emerald-100 font-medium text-lg">
                            Bem vindo(a): {auth.name}
                        </h2>
                    )}

                    <ul className="relative flex gap-6 items-center">
                        {!auth.accessToken && (
                            <>
                                <li>
                                    <NavLink
                                        to="/"
                                        className={({ isActive }) => `hover:text-emerald-200 transition-all duration-300 ease-in-out font-medium ${isActive ? navLinkClass : "text-emerald-100"}`}
                                    >
                                        Login
                                    </NavLink>
                                </li>

                                <li>
                                    <NavLink
                                        to="register"
                                        className={({ isActive }) => `hover:text-emerald-200 transition-all duration-300 ease-in-out font-medium ${isActive ? navLinkClass : "text-emerald-100"}`}
                                    >
                                        Registrar
                                    </NavLink>
                                </li>
                            </>
                        )}

                        {auth.email && (
                            <>
                                <li>
                                    <NavLink
                                        to="main"
                                        className={({ isActive }) => `hover:text-emerald-200 transition-all duration-300 ease-in-out font-medium ${isActive ? navLinkClass : "text-emerald-100"}`}
                                    >
                                        Menu
                                    </NavLink>
                                </li>

                                <li>
                                    <LogoutButton />
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    )
}
