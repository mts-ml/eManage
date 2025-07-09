import { NavLink } from "react-router-dom"
import { useContext } from "react"

import { LogoutButton } from "./LogoutButton"
import AuthContext from "../Context/AuthContext"


export const Header: React.FC = () => {
    const { auth } = useContext(AuthContext)

    const navLinkClass = "relative after:content-[''] after:absolute after:left-0 after:bottom-[-7px] after:h-[1px] after:w-full after:bg-green-400 after:opacity-100 after:scale-x-100 after:transition-all after:duration-300 after:ease-in-out text-green-400 font-bold"


    return (
        <header className="bg-green-900 text-white shadow-md">
            <div className="max-w-[1400px] mx-auto px-4 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-green-200">
                    <NavLink to="/" className="hover:text-green-400">
                        Panda Alimentos
                    </NavLink>
                </h1>

                <nav>
                    <ul className="relative flex gap-4 items-center">
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

                        {auth.email && (
                            <li>
                                <LogoutButton />
                            </li>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    )
}
