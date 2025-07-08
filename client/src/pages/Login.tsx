import { useContext, useState } from 'react'
import { axiosInstance } from '../api/axios'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

import type { CustomJwtPayload } from '../types/types.js'
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
            console.log(response)

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
                    setErrors(prev => ({ ...prev, general: "Serviço indisponível. Tente novamente mais tarde." }))
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
        <main className="h-[calc(100vh-72px)] bg-gray-100 flex items-center justify-center px-4">
            <div className="p-8 rounded-2xl bg-gray-700 shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold text-center mb-6 text-green-400">
                    Panda Alimentos
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4 text-white">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium">
                            E-mail
                        </label>

                        <input
                            type="text"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            aria-describedby='emailError'
                            className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                        />

                        <div
                            id='emailError'
                            aria-live='polite'
                        >
                            {errors.email && (
                                <p className="text-red-600 font-medium text-sm mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium">
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
                            className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />

                        <div
                            id='passwordError'
                            aria-live='polite'
                        >
                            {errors.password && (
                                <p className="text-red-600 font-medium text-sm mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!isReadyToSubmit}
                        className="w-full cursor-pointer bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition disabled:bg-gray-600 disabled:text-gray-400
                        disabled:cursor-not-allowed"
                    >
                        Entrar
                    </button>

                    {errors.geral && (
                        <p className="text-red-600 font-medium text-sm">{errors.geral}</p>
                    )}

                    {isLoggedIn && (
                        <p className="text-green-400 font-medium text-sm">
                            Login efetuado com sucesso!
                        </p>
                    )}
                </form>
            </div>
        </main>
    )
}
