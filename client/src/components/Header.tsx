import { NavLink } from "react-router-dom"
import { useContext } from "react"

import { LogoutButton } from "./LogoutButton"
import AuthContext from "../Context/AuthContext"


export const Header: React.FC = () => {
    const { auth } = useContext(AuthContext)

    const navLinkClass = "relative after:content-[''] after:absolute after:left-0 after:bottom-[-7px] after:h-[1px] after:w-full after:bg-green-400 after:opacity-100 after:scale-x-100 after:transition-all after:duration-300 after:ease-in-out text-green-400 font-bold"


    return (
        <header className="relative bg-green-900 text-white shadow-md">
            <div className="max-w-[1400px] mx-auto px-4 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-green-200">
                    <NavLink to="/main" className="hover:text-green-400">
                        Panda Alimentos
                    </NavLink>
                </h1>

                <nav>
                    {auth.accessToken && (
                        <h2 className="absolute left-1/2 top-1/2 transform -translate-1/2 ">
                            Bem vindo(a): {auth.name}
                        </h2>
                    )}

                    <ul className="relative flex gap-4 items-center">
                        {!auth.accessToken && (
                            <>
                                <li>
                                    <NavLink
                                        to="/"
                                        className={({ isActive }) => `hover:text-green-300 transition-colors duration-300 ease-in-out ${isActive ? navLinkClass : ""}`}
                                    >
                                        Login
                                    </NavLink>
                                </li>

                                <li>
                                    <NavLink
                                        to="register"
                                        className={({ isActive }) => `hover:text-green-300 transition-colors duration-300 ease-in-out ${isActive ? navLinkClass : ""}`}
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
                                        className={({ isActive }) => `hover:text-green-300 transition-colors duration-300 ease-in-out ${isActive ? navLinkClass : ""}`}
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
