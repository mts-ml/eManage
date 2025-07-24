import { useContext, useState } from "react"
import { FaTrash, FaEdit } from 'react-icons/fa'

import type { Client } from "../types/types"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import axios from "axios"
import ClientsContext from "../Context/ClientsContext"
import {
    capitalizeWords,
    isValidCPF,
    isValidCNPJ,
    formatPhoneForDisplay
} from "../utils/utils"


export const Clients: React.FC = () => {
    const defaultClient: Client = {
        name: "",
        email: "",
        phone: "",
        cpfCnpj: "",
        address: "",
        district: "",
        city: "",
        notes: ""
    }

    const [form, setForm] = useState<Client>(defaultClient)
    const [formErrors, setFormErrors] = useState<Partial<Client>>({})
    const [showForm, setShowForm] = useState(false)
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)
    const [editingClientId, setEditingClientId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const { clients, setClients } = useContext(ClientsContext)
    const axiosPrivate = useAxiosPrivate()


    function formValidation(form: Client): Partial<Client> {
        const errors: Partial<Client> = {}

        if (!form.name.trim()) {
            errors.name = "Campo obrigatório"
        } else if (form.name.trim().length < 3) {
            errors.name = "Nome deve ter pelo menos 3 caracteres"
        }

        if (!form.email.trim()) {
            errors.email = "Campo obrigatório"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            errors.email = "Email inválido"
        }

        const phoneDigits = form.phone.replace(/\D/g, '')
        if (!form.phone.trim()) {
            errors.phone = "Campo obrigatório"
        } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            errors.phone = "Telefone inválido"
        }

        if (!form.cpfCnpj.trim()) {
            errors.cpfCnpj = "Campo obrigatório"
        } else {
            const cleaned = form.cpfCnpj.replace(/\D/g, '')
            if (cleaned.length === 11) {
                if (!isValidCPF(cleaned)) errors.cpfCnpj = "CPF inválido"
            } else if (cleaned.length === 14) {
                if (!isValidCNPJ(cleaned)) errors.cpfCnpj = "CNPJ inválido"
            } else {
                errors.cpfCnpj = "Documento inválido"
            }
        }

        if (!form.address.trim()) {
            errors.address = "Campo obrigatório"
        } else if (form.address.trim().length < 5) {
            errors.address = "Endereço muito curto"
        }

        if (!form.district.trim()) errors.district = "Campo obrigatório"
        if (!form.city.trim()) errors.city = "Campo obrigatório"

        return errors
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.currentTarget as {
            name: keyof Client,
            value: string
        }

        let formattedValue = value

        if (name === 'phone') {
            const cleaned = value.replace(/\D/g, '')
            formattedValue = cleaned
                .replace(/^(.{0,2})(.{0,5})(.{0,4}).*/, (_, a, b, c) => `${a ? `(${a}` : ''}${b ? `) ${b}` : ''}${c ? `-${c}` : ''}`)
        }

        if (name === 'cpfCnpj') {
            const cleaned = value.replace(/\D/g, '')
            if (cleaned.length <= 11) {
                formattedValue = cleaned
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            } else {
                formattedValue = cleaned
                    .replace(/(\d{2})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d{4})(\d{2})$/, '$1/$2-$3')
            }
        }

        const updatedForm = {
            ...form,
            [name]: formattedValue
        }
        setForm(updatedForm)

        setErrorMessage(null)

        const validateFields = formValidation(updatedForm)
        setFormErrors(prev => ({ ...prev, [name]: validateFields[name] }))

        const requiredFields = { ...updatedForm }
        delete requiredFields.notes

        const allFieldsFilled = Object.values(requiredFields).every(val => String(val).trim() !== "")
        const noErrors = Object.values(validateFields).every(error => !error || error === '')
        setIsReadyToSubmit(allFieldsFilled && noErrors)
    }

    function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.currentTarget

        if (['name', 'address', 'district', 'city'].includes(name)) {
            setForm(prev => ({
                ...prev,
                [name]: capitalizeWords(value)
            }))
        }
    }


    function handleEdit(client: Client) {
        setForm({ ...client })
        setEditingClientId(client.id!)
        setShowForm(true)

        const errors = formValidation(client)
        setFormErrors(errors)
    }

    async function handleDelete(id: string) {
        if (confirm("Tem certeza que deseja excluir este cliente?")) {
            await axiosPrivate.delete(`clients/${id}`)
            setClients(prev => prev.filter(client => client.id !== id))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!isReadyToSubmit) return

        const normalizedClient: Client = {
            ...form,
            phone: form.phone.replace(/\D/g, ''),
            cpfCnpj: form.cpfCnpj.replace(/\D/g, '')
        }

        try {
            // Editar usuário
            if (editingClientId) {
                const response = await axiosPrivate.put(`/clients/${editingClientId}`, normalizedClient)

                const updatedClient = { ...response.data, id: response.data._id }
                setClients(prev => prev.map(client =>
                    client.id === editingClientId ? updatedClient : client)
                )
            } else {
                // Criar novo usuário
                const response = await axiosPrivate.post('/clients', normalizedClient)

                const newClient = { ...response.data, id: response.data._id }

                setClients(prev => [...prev, newClient])
            }

            // Limpa os campos
            setForm(defaultClient)
            setShowForm(false)
            setEditingClientId(null)
            setFormErrors({})
            setErrorMessage(null)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data
                if (error.response?.status === 409 && data) {
                    const { field, message } = data
                    setErrorMessage(message)

                    if (field) {
                        setFormErrors(prev => ({ ...prev, [field]: message }))
                    }
                } else {
                    setErrorMessage("Erro inesperado. Tente novamente.")
                }
            } else {
                setErrorMessage("Erro inesperado. Tente novamente.")
            }
        }

    }

    const clientFields = [
        { key: "name", label: "Nome Completo", placeholder: "Digite o nome completo" },
        { key: "email", label: "E-mail", placeholder: "exemplo@email.com" },
        { key: "phone", label: "Telefone", placeholder: "(11) 98765-4321" },
        { key: "cpfCnpj", label: "CPF/CNPJ", placeholder: "000.000.000-00 ou 00.000.000/0000-00" },
        { key: "address", label: "Endereço", placeholder: "Rua Exemplo, 123" },
        { key: "district", label: "Bairro", placeholder: "Centro" },
        { key: "city", label: "Cidade", placeholder: "São Paulo" }
    ]


    return (
        <main className="p-6 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Cadastro de Clientes</h2>

            <div className="text-center mb-6">
                <button
                    onClick={() => {
                        setForm(defaultClient)
                        setEditingClientId(null)
                        setShowForm(true)
                        setFormErrors({})
                    }}
                    className="bg-emerald-600 cursor-pointer text-white px-4 py-2 rounded-md hover:bg-emerald-700"
                >
                    Novo Cliente
                </button>
            </div>

            {clients.length > 0 && (
                <div className="overflow-auto border rounded-lg shadow-sm mb-10">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-emerald-600 text-white">
                            <tr>
                                <th className="px-4 py-3 text-sm">Nome</th>
                                <th className="px-4 py-3 text-sm">E-mail</th>
                                <th className="px-4 py-3 text-sm">Telefone</th>
                                <th className="px-4 py-3 text-sm">Documento</th>
                                <th className="px-4 py-3 text-sm">Endereço</th>
                                <th className="px-4 py-3 text-sm">Bairro</th>
                                <th className="px-4 py-3 text-sm">Cidade</th>
                                <th className="px-4 py-3 text-sm">Observações</th>
                                <th className="px-4 py-3 text-sm">Ações</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-100">
                            {clients.map(client => (
                                <tr key={client.id}>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">{client.name}</td>
                                    <td className="px-4 py-2 text-sm break-words">{client.email}</td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">{formatPhoneForDisplay(client.phone)}</td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                                        {client.cpfCnpj.length === 11
                                            ? client.cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                                            : client.cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}
                                    </td>
                                    <td className="px-4 py-2 text-sm">{client.address}</td>
                                    <td className="px-4 py-2 text-sm">{client.district}</td>
                                    <td className="px-4 py-2 text-sm">{client.city}</td>
                                    <td className="px-4 py-2 text-sm max-w-[160px] truncate" title={client.notes}>{client.notes || "-"}</td>
                                    <td className="px-4 py-2 text-sm space-x-1">
                                        <button
                                            onClick={() => handleEdit(client)}
                                            className="text-emerald-600 cursor-pointer hover:underline"
                                            aria-label="Editar cliente."
                                        >
                                            <FaEdit size={18} />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(client.id!)} className="text-red-700 cursor-pointer hover:underline"
                                            aria-label="Excluir cliente"
                                        >
                                            <FaTrash size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-gray-50 shadow-sm">
                    <h3 className="text-xl cursor-pointer font-semibold mb-4">
                        {editingClientId ? "Editar Cliente" : "Novo Cliente"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {clientFields.map(({ key, label, placeholder }) => {
                            const fieldName = key as keyof Client

                            return (
                                <div key={key}>
                                    <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
                                        {label} *
                                    </label>

                                    <input
                                        type="text"
                                        name={key}
                                        id={key}
                                        placeholder={placeholder}
                                        value={form[fieldName]}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 px-2"
                                    />

                                    {formErrors[fieldName] && (
                                        <div className="text-red-600 text-sm mt-1">
                                            {formErrors[key as keyof Client]}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        <div className="md:col-span-2">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                Observações
                            </label>
                            <textarea
                                name="notes"
                                id="notes"
                                value={form.notes || ""}
                                onChange={handleChange}
                                rows={3}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center items-center">
                        <button
                            type="button"
                            onClick={() => {
                                setForm(defaultClient)
                                setShowForm(false)
                                setEditingClientId(null)
                                setFormErrors({})
                            }}
                            className="px-4 py-2 cursor-pointer border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={!isReadyToSubmit}
                            className={`px-4 py-2 rounded-md transition ${isReadyToSubmit ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer" : "bg-gray-400 text-gray-200 cursor-not-allowed"}`}
                        >
                            {editingClientId ? "Atualizar" : "Salvar"} Cliente
                        </button>
                    </div>

                    {errorMessage && (
                        <div className="mb-4 p-3 mt-4 bg-red-100 text-red-700 rounded">
                            {errorMessage}
                        </div>
                    )}
                </form>
            )}
        </main>
    )
}
