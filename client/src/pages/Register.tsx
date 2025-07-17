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
        <main className="h-[calc(100vh-72px)] bg-gray-100 flex items-center justify-center px-4">
            <div className="p-8 rounded-2xl bg-gray-700 shadow-md max-w-sm">
                <h1 className="text-2xl font-bold text-center mb-6 text-green-400">
                    Cadastro - Panda Alimentos
                </h1>

                {/* NOME */}
                <form onSubmit={handleSubmit} className="space-y-4 text-white">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium">
                            Nome
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            aria-describedby='nameError'
                            className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                        />

                        {errors.name && (
                            <div
                                aria-live='polite'
                                id='nameError'
                                className="bg-red-900 border border-red-600 text-red-100 rounded-md p-2 mt-2 text-sm font-semibold"
                            >
                                <p>
                                    {errors.name}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* EMAIL */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium">
                            E-mail
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            aria-describedby='emailError'
                            className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                        />

                        {errors.email && (
                            <div
                                aria-live='polite'
                                id='emailError'
                                className="bg-red-900 border border-red-600 text-red-100 rounded-md p-2 mt-2 text-sm font-semibold"
                            >
                                <p>
                                    • {errors.email}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* SENHA */}
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

                        {errors.password && (
                            <div
                                aria-live='polite'
                                id='passwordError'
                                className="bg-red-900 border border-red-600 text-red-100 rounded-md p-3 mt-2 space-y-1 max-h-40 overflow-auto text-sm font-semibold"
                            >
                                {errors.password.map((msg, index) => (
                                    <p key={index} className="leading-tight">
                                        • {msg}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!isReadyToSubmit}
                        className="w-full cursor-pointer bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition disabled:bg-gray-600 disabled:text-gray-400
                        disabled:cursor-not-allowed"
                    >
                        Registrar
                    </button>

                    {apiMessage && (
                        <p className='text-green-400 font-medium text-center'>
                            {apiMessage}
                        </p>
                    )}

                    {errors.general && (
                        <p className='text-red-400 font-medium text-center'>
                            {errors.general}
                        </p>
                    )}
                </form>
            </div>
        </main >
    )
}
