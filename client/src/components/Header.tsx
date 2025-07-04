import { NavLink } from "react-router-dom"

export const Header: React.FC = () => {
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

                        <li>
                            <button
                                type="button"
                                className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-md text-white transition cursor-pointer"
                            >
                                Sair
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    )
}
