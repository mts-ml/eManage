import { NavLink } from "react-router-dom"
import { useContext } from "react"

import { LogoutButton } from "./LogoutButton"
import AuthContext from "../Context/AuthContext"


export const Header: React.FC = () => {
    const { auth } = useContext(AuthContext)

    const navLinkClass = "relative after:content-[''] after:absolute after:left-0 after:bottom-[-7px] after:h-[2px] after:w-full after:bg-gradient-to-r after:from-emerald-400 after:to-green-400 after:opacity-100 after:scale-x-100 after:transition-all after:duration-300 after:ease-in-out text-emerald-300 font-semibold"


    return (
        <header className="relative bg-gradient-to-r from-green-800/80 via-emerald-700/80 to-green-800/80 text-white shadow-xl border-b border-emerald-600/30">
            <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 sm:py-5">
                {/* Layout para telas pequenas */}
                <section className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-green-300 text-center sm:text-left">
                        <NavLink to="/home" className="hover:from-emerald-100 hover:to-green-200 transition-all duration-300 flex items-center gap-3">
                            <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-300 to-green-400 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                <img src="/assets/images/eManage.png" alt="eManage Logo" className="w-10 h-10" />
                            </div>
                            eManage
                        </NavLink>
                    </h1>

                    <nav className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
                        {auth.accessToken && (
                            <h2 className="text-sm sm:text-base lg:text-lg text-emerald-100 font-medium text-center sm:text-left order-1 sm:order-none">
                                Bem vindo(a): {auth.name}
                            </h2>
                        )}

                        <ul className="flex gap-3 sm:gap-6 items-center order-2 sm:order-none">
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
                                <li>
                                    <LogoutButton />
                                </li>
                            )}
                        </ul>
                    </nav>
                </section>
            </section>
        </header>
    )
}
