import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

import axios from 'axios'
import type { CustomJwtPayload } from '../types/types.js'
import { axiosInstance } from '../api/axios'
import AuthContext from '../Context/AuthContext.js'


type LoginForm = {
    email: string
    password: string
}

type LoginErrors = {
    email: string | null
    password: string | null
    geral: string | null
}


export const Login: React.FC = () => {
    const defaultValues = {
        email: "",
        password: ""
    }
    const [form, setForm] = useState<LoginForm>(defaultValues)
    const [errors, setErrors] = useState<LoginErrors>({
        email: null,
        password: null,
        geral: null
    })
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
    const navigate = useNavigate()
    const { setAuth } = useContext(AuthContext)


    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.currentTarget as {
            name: keyof LoginForm,
            value: string
        }

        const updatedForm = { ...form, [name]: value }
        setForm(updatedForm)

        const validateFields = formValidation(updatedForm)
        setErrors(validateFields)

        const allFieldsFilled = Object.values(updatedForm).every(value => value.trim() !== "")
        const noError = Object.values(validateFields).every(error => !error || error.length === 0)
        setIsReadyToSubmit(allFieldsFilled && noError)

        setIsLoggedIn(false)
    }

    function formValidation(form: LoginForm) {
        const { email, password } = form

        const error: LoginErrors = {
            email: null,
            password: null,
            geral: null
        }

        if (!email || !password) {
            error.geral = "Email e senha são campos obrigatórios."
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email.trim())) {
                error.email = "Formato de email inválido."
            }
            if (password.length < 8) {
                error.password = "A senha deve ter no mínimo 8 caracteres."
            }
        }

        return error
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        if (!isReadyToSubmit) return

        try {
            const response = await axiosInstance.post('/login', form, { withCredentials: true })

            // Getting access token, decoding it and saving info on global state
            const accessToken = response.data.accessToken
            const decodedToken: CustomJwtPayload = jwtDecode(accessToken)
            const { name, email, roles } = decodedToken.UserInfo
            setAuth({ name, email, roles, accessToken })
            
            setIsLoggedIn(true)
            setForm(defaultValues)
            setErrors({
                email: null,
                password: null,
                geral: null
            })

            setTimeout(() => {
                navigate('main')
            }, 1500)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (!error.response) {
                    // Falha de rede, API fora do ar, timeout, etc.
                    console.error("Erro de rede ou servidor indisponível:", error.message)
                    setErrors(prev => ({ ...prev, geral: "Serviço indisponível. Tente novamente mais tarde." }))
                } else {
                    // API respondeu com erro
                    const status = error.response.status
                    const data = error.response.data

                    console.error(`Erro da API (status ${status}):`, data)

                    switch (status) {
                        case 400:
                            setErrors(prev => ({ ...prev, geral: "Dados inválidos. Verifique os campos." }))
                            break
                        case 401:
                            setErrors(prev => ({ ...prev, geral: "Credenciais inválidas." }))
                            break
                        case 403:
                            setErrors(prev => ({ ...prev, geral: "Acesso negado." }))
                            break
                        case 409:
                            setErrors(prev => ({ ...prev, email: "Email já cadastrado" }))
                            break
                        case 500:
                            setErrors(prev => ({ ...prev, geral: "Erro interno do servidor. Tente mais tarde." }))
                            break
                        default:
                            setErrors(prev => ({ ...prev, geral: "Erro inesperado." }))
                    }
                }
            } else {
                // Erro desconhecido, que não veio do axios
                console.error("Erro desconhecido:", error)
                setErrors(prev => ({ ...prev, geral: "Erro inesperado. Tente novamente." }))
            }
        }
    }


    return (
        <main className="h-[calc(100vh-72px)] bg-gradient-to-br from-emerald-50/30 via-green-50/30 to-emerald-100/30 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/10 to-green-100/10"></div>
            <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-green-200/20 rounded-full blur-3xl"></div>
            
            <div className="relative p-6 sm:p-8 lg:p-10 rounded-3xl bg-white/90 backdrop-blur-sm shadow-2xl border border-emerald-200/50 w-full max-w-md mx-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2 text-center">
                    🐼 Panda Alimentos
                </h1>
                <p className="text-gray-600 font-medium text-center mb-8">Faça login para continuar</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            E-mail
                        </label>

                        <input
                            type="text"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            aria-describedby='emailError'
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                            placeholder="Digite seu e-mail"
                        />

                        <div
                            id='emailError'
                            aria-live='polite'
                        >
                            {errors.email && (
                                <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                    <span className="mr-1">⚠️</span>
                                    {errors.email}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                            Senha
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete='off'
                            aria-describedby='passwordError'
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                            placeholder="Digite sua senha"
                        />

                        <div
                            id='passwordError'
                            aria-live='polite'
                        >
                            {errors.password && (
                                <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                    <span className="mr-1">⚠️</span>
                                    {errors.password}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!isReadyToSubmit}
                        className="w-full cursor-pointer bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        {isLoggedIn ? "Entrando..." : "Entrar"}
                    </button>

                    {errors.geral && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-red-600 font-medium text-sm flex items-center">
                                <span className="mr-2">❌</span>
                                {errors.geral}
                            </p>
                        </div>
                    )}

                    {isLoggedIn && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <p className="text-emerald-600 font-medium text-sm flex items-center">
                                <span className="mr-2">✅</span>
                                Login efetuado com sucesso!
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </main>
    )
}
 