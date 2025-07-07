import { useState } from "react"


interface Client {
    name: string
    email: string
    phone: string
    id?: number
}

export const ClientsRegistration: React.FC = () => {
    const defaultValues = {
        name: "", email: "", phone: ""
    }

    const [form, setForm] = useState<Omit<Client, "id">>(defaultValues)
    const [errors, setErrors] = useState(defaultValues)
    const [clients, setClients] = useState<Client[]>([])
    const [isReadyToSubmit, setIsReadyToSubmit] = useState<boolean>(false)


    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.currentTarget as {
            name: keyof Client,
            value: string
        }

        const updatedForm = { ...form, [name]: value }
        setForm(updatedForm)

        const validateFields = formValidation(updatedForm)
        setErrors(validateFields)

        const allFieldsFilled = Object.values(updatedForm).every(field => field.trim() !== "")
        const noErrors = Object.values(validateFields).every(error => error === "")
        setIsReadyToSubmit(allFieldsFilled && noErrors)
    }

    function formatPhoneForDisplay(phone: string): string {
        // Se o telefone tiver 11 dígitos (DD + 9 dígitos), formata assim
        if (phone.length === 11) {
            return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        }
        // Se tiver 10 dígitos (DD + 8 dígitos), formata assim
        if (phone.length === 10) {
            return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }
        // Caso não seja esperado, retorna o que recebeu
        return phone;
    }


    function formValidation(form: Client) {
        const { name, email, phone } = form

        const errors: Client = { name: "", email: "", phone: "" }

        if (!name) errors.name = "Campo obrigatório"

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email) {
            errors.email = "Campo obrigatório"
        } else if (!emailRegex.test(email)) {
            errors.email = "Email inválido"
        }

        const telefoneRegex = /^\d{2}9\d{8}$/
        if (!phone) {
            errors.phone = "Campo obrigatório"
        } else if (!telefoneRegex.test(phone)) {
            errors.phone = "Formato inválido (somente números com DDD)"
        }

        return errors
    }

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        if (!isReadyToSubmit) return

        const newClient: Client = { ...form, id: Date.now() }
        setClients(prev => [...prev, newClient])
        setForm({ name: "", email: "", phone: "" })
        setErrors({ name: "", email: "", phone: "" })
    }


    return (
        <main className="p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Cadastro de Clientes</h2>

            <form onSubmit={handleSubmit} className="grid gap-4 mb-6" aria-label="Formulário de cadastro de clientes">
                {/* NAME */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>

                    <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Nome"
                        value={form.name}
                        onChange={handleChange}
                        aria-describedby="errorName"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />

                    {errors.name && (
                        <div
                            id="nameError"
                            className="text-red-600 text-sm mt-1"
                            aria-live="polite"
                        >
                            {errors.name}
                        </div>
                    )}
                </div>

                {/* EMAIL */}
                <div>
                    <label
                        htmlFor="text"
                        className="block text-sm font-medium text-gray-700">
                        Email
                    </label>

                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="teste@email.com"
                        aria-describedby="emailError"
                        value={form.email}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />

                    {errors.email && (
                        <div
                            id="emailError"
                            className="text-red-600 text-sm mt-1"
                            aria-live="polite"
                        >
                            {errors.email}
                        </div>
                    )}
                </div>

                {/* PHONE */}
                <div>
                    <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700">
                        Telefone
                    </label>

                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="Apenas números, ex: 12912345678"
                        aria-describedby="phoneError"
                        value={form.phone}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />

                    {errors.phone && (
                        <div
                            id="phoneError"
                            aria-live="polite"
                            className="text-red-600 text-sm mt-1"
                        >
                            {errors.phone}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!isReadyToSubmit}
                    className="bg-emerald-600 text-white py-2 px-4 rounded-md transition hover:bg-emerald-700 disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer"
                >
                    Salvar Cliente
                </button>
            </form>

            <h3 className="text-lg font-semibold mb-2">Lista de Clientes</h3>

            <ul className="list-disc pl-6 text-gray-800 text-sm">
                {clients.map(client => (
                    <li key={client.id} className="mb-1">
                        <span className="font-semibold text-green-800">Nome:</span> {client.name} | <span className="font-semibold text-green-800">Email:</span> {client.email} | <span className="font-semibold text-green-800">Telefone:</span> {formatPhoneForDisplay(client.phone)}
                    </li>
                ))}
            </ul>
        </main>
    )
}
