import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import axios from 'axios'
import { axiosInstance } from '../api/axios'


interface RegisterForm {
    name: string
    email: string
    password: string
}

type RegisterErrors = Partial<Record<keyof RegisterForm, string[]>>


export const Register: React.FC = () => {
    const defaultValues: RegisterForm = {
        name: "",
        email: "",
        password: ""
    }

    const [form, setForm] = useState<RegisterForm>(defaultValues)
    const [errors, setErrors] = useState<RegisterErrors & { general?: string }>({})
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)
    const [apiMessage, setApiMessage] = useState<string>("")
    const navigate = useNavigate()


    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.currentTarget as {
            name: keyof RegisterForm,
            value: string
        }

        const updatedForm = { ...form, [name]: value }
        setForm(updatedForm)

        const validateFields = formValidation(updatedForm)
        setErrors(prevState => ({
            ...prevState, [name]: validateFields[name]
        }))

        const allFieldsFilled = Object.values(updatedForm).every(val => val.trim() !== "")
        const noErrors = Object.values(validateFields).every(errorList => !errorList || errorList.length === 0)

        setIsReadyToSubmit(allFieldsFilled && noErrors)
    }

    function formValidation(form: RegisterForm) {
        const { name, email, password } = form
        const error: RegisterErrors = {}

        if (!name) {
            error.name = ["Campo obrigatório"]
        } else if (name.trim().split(" ").length < 2) {
            error.name = ["Inserir nome completo"]
        }

        if (!email) {
            error.email = [...(error.email || []), "Campo obrigatório"]
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                error.email = [...(error.email || []), "Endereço de email inválido"]
            }
        }

        if (!password) {
            error.password = [...(error.password || []), "Campo obrigatório"]
        }
        if (password.length < 8) {
            error.password = [...(error.password || []), "Mínimo de 8 caracteres"]
        }

        const hasNumber = /\d/.test(password)
        const hasUpperCaseLetter = /[A-Z]/.test(password)
        const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/.test(password)

        if (!hasNumber) {
            error.password = [...(error.password || []), "1 número"]
        }
        if (!hasUpperCaseLetter) {
            error.password = [...(error.password || []), "Letra maiúscula"]
        }
        if (!hasSpecialCharacter) {
            error.password = [...(error.password || []), "Caractere especial"]
        }

        return error
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        if (!isReadyToSubmit) return

        try {
            const response = await axiosInstance.post('/register', form)
            setApiMessage(response.data.message)
            console.log('Resposta da API:', response.data.message)
            setForm({
                name: "",
                email: "",
                password: ""
            })

            setTimeout(() => {
                navigate('/')
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
                            setErrors(prev => ({ ...prev, email: ["Email já cadastrado"] }))
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
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
                        🐼 Panda Alimentos
                    </h1>
                    <p className="text-gray-600 font-medium">Crie sua conta para começar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* NOME */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                            Nome Completo <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Digite seu nome completo"
                            aria-describedby='nameError'
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        />

                        {errors.name && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-600 font-medium text-sm flex items-center">
                                    <span className="mr-2">⚠️</span>
                                    {errors.name}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* EMAIL */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            E-mail <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Digite seu e-mail"
                            aria-describedby='emailError'
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        />

                        {errors.email && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-600 font-medium text-sm flex items-center">
                                    <span className="mr-2">⚠️</span>
                                    {errors.email}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* SENHA */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                            Senha <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Digite sua senha"
                            autoComplete='off'
                            aria-describedby='passwordError'
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        />

                        {errors.password && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl max-h-40 overflow-auto">
                                <p className="text-red-600 font-medium text-sm mb-2">A senha deve conter:</p>
                                <ul className="space-y-1 text-sm">
                                    {errors.password.map((msg, index) => (
                                        <li key={index} className="text-red-600 flex items-center">
                                            <span className="mr-2">•</span>
                                            {msg}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!isReadyToSubmit}
                        className="w-full cursor-pointer bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        {apiMessage ? "Registrando..." : "Criar Conta"}
                    </button>

                    {apiMessage && (
                        <div className="p-4 bg-emerald-50/50 border border-emerald-200/50 rounded-xl">
                            <p className="text-emerald-600 font-medium text-center flex items-center justify-center">
                                <span className="mr-2">✅</span>
                                {apiMessage}
                            </p>
                        </div>
                    )}

                    {errors.general && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-red-600 font-medium text-center flex items-center justify-center">
                                <span className="mr-2">❌</span>
                                {errors.general}
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </main>
    )
}
