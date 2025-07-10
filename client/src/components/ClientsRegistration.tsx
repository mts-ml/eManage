import { useState } from "react"
import { capitalizeWords, formatPhoneForDisplay, isValidCNPJ, isValidCPF } from "../utils/utils"


interface Client {
    name: string
    email: string
    phone: string
    cpfCnpj: string
    address: string
    district: string
    city: string
    notes?: string
    id?: string
}

export const ClientsRegistration: React.FC = () => {
    const defaultValues = {
        name: "",
        email: "",
        phone: "",
        cpfCnpj: "",
        address: "",
        district: "",
        notes: "",
        city: "",
    }

    const fields = [
        { id: "name", label: "Nome", placeholder: "Ex: João da Silva", type: "text" },
        { id: "email", label: "Email", placeholder: "ex: teste@email.com", type: "email" },
        { id: "phone", label: "Telefone", placeholder: "ex: 11912345678", type: "tel" },
        { id: "cpfCnpj", label: "CPF ou CNPJ", placeholder: "ex: 123.456.789-00 ou 12.345.678/0001-99", type: "text" },
        { id: "address", label: "Endereço", placeholder: "Ex: Rua das Flores, 123", type: "text" },
        { id: "district", label: "Bairro", placeholder: "Ex: Centro", type: "text" },
        { id: "city", label: "Cidade", placeholder: "Ex: São Paulo", type: "text" }
    ]


    const [form, setForm] = useState<Client>(defaultValues)
    const [errors, setErrors] = useState(defaultValues)
    const [clients, setClients] = useState<Client[]>([])
    const [isReadyToSubmit, setIsReadyToSubmit] = useState<boolean>(false)


    function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = event.currentTarget as {
            name: keyof Client,
            value: string
        }

        const updatedForm = {
            ...form,
            [name]: ['name', 'address', 'city', 'district'].includes(name) ? capitalizeWords(value) : value
        }
        setForm(updatedForm)

        const validateFields = formValidation(updatedForm)
        setErrors(validateFields)

        const allFieldsFilled = Object.values(updatedForm).every(field => field.trim() !== "")
        const noErrors = Object.values(validateFields).every(error => error === "")
        setIsReadyToSubmit(allFieldsFilled && noErrors)
    }


    function formValidation(form: Client) {
        const { name, email, phone, cpfCnpj, address, district, city } = form

        const errors: Client = defaultValues

        if (!name) errors.name = "Campo obrigatório"

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email) {
            errors.email = "Campo obrigatório"
        } else if (!emailRegex.test(email)) {
            errors.email = "Email inválido"
        }

        const phoneRegex = /^\d{2}9\d{8}$/
        if (!phone) {
            errors.phone = "Campo obrigatório"
        } else if (!phoneRegex.test(phone)) {
            errors.phone = "Formato inválido (somente números com DDD)"
        }

        if (!address) errors.address = "Campo obrigatório"
        if (!district) errors.district = "Campo obrigatório"
        if (!city) errors.city = "Campo obrigatório"

        if (!cpfCnpj) {
            errors.cpfCnpj = "Campo obrigatório"
        } else {
            // Remove tudo que não é número para fazer a contagem
            const cleanedInput = cpfCnpj.replace(/\D/g, "")

            if (cleanedInput.length === 11) {
                if (!isValidCPF(cleanedInput)) {
                    errors.cpfCnpj = "CPF inválido"
                }
            } else if (cleanedInput.length === 14) {
                if (!isValidCNPJ(cleanedInput)) {
                    errors.cpfCnpj = "CNPJ inválido"
                }
            } else {
                errors.cpfCnpj = "CPF ou CNPJ inválido"
            }
        }

        return errors as typeof defaultValues
    }

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        if (!isReadyToSubmit) return

        const newClient: Client = { ...form, id: String(Date.now()) }
        setClients(prev => [...prev, newClient])
        setForm(defaultValues)
        setErrors(defaultValues)
        setIsReadyToSubmit(false)
    }


    return (
        <main className="p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Cadastro de Clientes</h2>

            <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
                {fields.map(({ id, label, placeholder, type }) => (
                    <div key={id}>
                        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                            {label}
                        </label>
                        <input
                            id={id}
                            name={id}
                            type={type}
                            placeholder={placeholder}
                            value={form[id as keyof Client]}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {errors[id as keyof typeof errors] && (
                            <p className="text-red-600 text-sm mt-1">{errors[id as keyof typeof errors]}</p>
                        )}
                    </div>
                ))}

                {/* Observações */}
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Observações
                    </label>

                    <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        placeholder="Observações adicionais..."
                        value={form.notes}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!isReadyToSubmit}
                    className="bg-emerald-600 text-white py-2 px-4 rounded-md transition hover:bg-emerald-700 disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed"
                >
                    Salvar Cliente
                </button>
            </form>

            <h3 className="text-lg font-semibold mb-4">Lista de Clientes</h3>

            <ul className="space-y-4 text-gray-800 text-sm">
                {clients.map(client => (
                    <li key={client.id} className="border p-3 rounded-md bg-white shadow-sm">
                        <p><strong className="text-emerald-700">Nome:</strong> {client.name}</p>
                        <p><strong className="text-emerald-700">Email:</strong> {client.email}</p>
                        <p><strong className="text-emerald-700">Telefone:</strong> {formatPhoneForDisplay(client.phone)}</p>
                        <p><strong className="text-emerald-700">CPF/CNPJ:</strong> {client.cpfCnpj}</p>
                        <p><strong className="text-emerald-700">Endereço:</strong> {client.address}, {client.district}, {client.city}</p>
                        {client.notes && <p><strong className="text-emerald-700">Observações:</strong> {client.notes}</p>}
                    </li>
                ))}
            </ul>
        </main>
    )
}
