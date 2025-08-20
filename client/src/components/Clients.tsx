import { useContext, useState, useRef, useEffect } from "react"
import { FaTrash, FaEdit, FaSearch } from 'react-icons/fa'

import type { Client, ClientErrors, ClientFromBackend } from "../types/types"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import axios from "axios"
import ClientContext from "../Context/ClientContext"
import {
    capitalizeWords,
    isValidCPF,
    isValidCNPJ,
    formatPhoneForDisplay
} from "../utils/utils"
import { logError } from "../utils/logger"


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
    const [formErrors, setFormErrors] = useState<ClientErrors>({})
    const [showForm, setShowForm] = useState(false)
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)
    const [editingClientId, setEditingClientId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const { clients, setClients } = useContext(ClientContext)
    const axiosPrivate = useAxiosPrivate()
    const formRef = useRef<HTMLElement>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 20

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axiosPrivate.get('/clients')
                if (response.status !== 204) {
                    const normalizedClients = response.data.map((client: ClientFromBackend) => ({
                        ...client,
                        id: client._id
                    }))
                    setClients(normalizedClients)
                }
            } catch (error) {
                logError("Clients", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [axiosPrivate, setClients])

    // Filtrar clientes baseado no termo de busca (nome ou CPF/CNPJ)
    const filteredClients = clients.filter(client => {
        if (!searchTerm.trim()) return true

        const searchLower = searchTerm.toLowerCase().trim()
        const clientNameLower = client.name.toLowerCase()

        // Busca por nome (exata ou parcial)
        const nameMatch = clientNameLower.includes(searchLower)

        // Busca por CPF/CNPJ (apenas números)
        const searchNumbers = searchTerm.replace(/\D/g, '')
        const cpfCnpjMatch = searchNumbers && client.cpfCnpj.replace(/\D/g, '').includes(searchNumbers)

        return nameMatch || cpfCnpjMatch
    })

    const totalItems = filteredClients.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const startIndex = (currentPage - 1) * pageSize
    const currentItems = filteredClients.slice(startIndex, startIndex + pageSize)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    useEffect(() => {
        setCurrentPage(prev => {
            const pages = Math.max(1, Math.ceil(totalItems / pageSize))
            return Math.min(prev, pages)
        })
    }, [totalItems])


    function formValidation(form: Client): ClientErrors {
        const errors: ClientErrors = {}

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
        
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                })
            }
        }, 100)
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

        // Filtra apenas os campos válidos do tipo Client, removendo campos do MongoDB
        const normalizedClient: Client = {
            name: form.name,
            email: form.email,
            phone: form.phone.replace(/\D/g, ''),
            cpfCnpj: form.cpfCnpj.replace(/\D/g, ''),
            address: form.address,
            district: form.district,
            city: form.city,
            notes: form.notes
        }

        try {
            // Editar usuário
            if (editingClientId) {
                const response = await axiosPrivate.put<ClientFromBackend>(`/clients/${editingClientId}`, normalizedClient)

                const updatedClient = { ...response.data, id: response.data._id }
                setClients(prev => prev.map(client =>
                    client.id === editingClientId ? updatedClient : client)
                )
            } else {
                // Criar novo usuário
                const response = await axiosPrivate.post<ClientFromBackend>('/clients', normalizedClient)

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
        <main className="p-8 max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2 text-center">
                👥 Cadastro de Clientes
            </h1>

            <p className="text-gray-600 font-medium text-center mb-8">Gerencie seus clientes de forma eficiente</p>

            <button
                type="button"
                onClick={() => {
                    setForm(defaultClient)
                    setEditingClientId(null)
                    setShowForm(true)
                    setFormErrors({})
                    
                    setTimeout(() => {
                        if (formRef.current) {
                            formRef.current.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start',
                                inline: 'nearest'
                            })
                        }
                    }, 100)
                }}
                className="block mx-auto mb-8 bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105"
            >
                ➕ Novo Cliente
            </button>

            {showForm && (
                <section 
                    ref={formRef}
                    className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-white/90 backdrop-blur-sm shadow-xl mb-8 animate-fadeIn"
                >
                    <h2 className="text-2xl font-bold text-emerald-800 text-center mb-6 animate-slideInFromTop">
                        {editingClientId ? "✏️ Editar Cliente" : "➕ Novo Cliente"}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {clientFields.map(({ key, label, placeholder }) => {
                                const fieldName = key as keyof Client

                                return (
                                    <div key={key}>
                                        <label htmlFor={key} className="block text-sm font-semibold text-gray-700 mb-2">
                                            {label} <span className="text-red-500">*</span>
                                        </label>

                                        <input
                                            type="text"
                                            name={key}
                                            id={key}
                                            placeholder={placeholder}
                                            value={form[fieldName]}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                                        />

                                        {formErrors[fieldName] && (
                                            <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                                <span className="mr-1">⚠️</span>
                                                {formErrors[key as keyof Client]}
                                            </p>
                                        )}
                                    </div>
                                )
                            })}

                            <div className="md:col-span-2">
                                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Observações
                                </label>
                                <textarea
                                    name="notes"
                                    id="notes"
                                    value={form.notes || ""}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Adicione observações sobre o cliente..."
                                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-6 justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setForm(defaultClient)
                                    setShowForm(false)
                                    setEditingClientId(null)
                                    setFormErrors({})
                                }}
                                className="px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer font-semibold transition-all duration-300 hover:scale-105 hover:border-gray-400"
                            >
                                ❌ Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={!isReadyToSubmit}
                                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${isReadyToSubmit ? "bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105" : "bg-gray-400 text-gray-200 cursor-not-allowed"}`}
                            >
                                {editingClientId ? "💾 Atualizar" : "💾 Salvar"} Cliente
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-600 font-medium text-center flex items-center justify-center">
                                    <span className="mr-2">❌</span>
                                    {errorMessage}
                                </p>
                            </div>
                        )}
                    </form>
                </section>
            )}

            {/* Input de Busca */}
            <section className="mb-6">
                <div className="flex justify-center">
                    <div className="relative max-w-md w-full">
                        <label htmlFor="searchInput"
                            className="block pl-3 text-sm font-semibold text-gray-700 mb-2"
                        >
                            Buscar Cliente
                        </label>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="h-5 w-5 text-gray-400" />
                            </div>

                            <input
                                id="searchInput"
                                type="text"
                                placeholder="Buscar por nome ou CPF/CNPJ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                                className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                            />
                        </div>
                    </div>
                </div>

                {searchTerm && (
                    <p className="text-center text-sm text-gray-600 mt-2">
                        {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
                    </p>
                )}
            </section>

            {clients.length > 0 && (
                <>
                    <h2 className="text-2xl font-bold text-emerald-800 text-center mb-6">
                        📋 Lista de Clientes
                    </h2>

                    <section className="overflow-auto border-2 border-emerald-200/50 rounded-2xl shadow-xl mb-10 max-h-[70vh] bg-white/90 backdrop-blur-sm">
                        {isLoading ? (
                            <TableSkeleton />
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-sm font-semibold text-center">Nome</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-center">E-mail</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-center">Telefone</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-center">Documento</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-center">Ações</th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-100">
                                    {currentItems.map(client => (
                                        <tr key={client.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-center">{client.name}</td>

                                            <td className="px-6 py-4 text-sm break-words text-emerald-700 text-center">{client.email}</td>

                                            <td className="px-6 py-4 text-sm whitespace-nowrap font-medium text-center">{formatPhoneForDisplay(client.phone)}</td>

                                            <td className="px-6 py-4 text-sm whitespace-nowrap font-mono text-center">
                                                {client.cpfCnpj.length === 11
                                                    ? client.cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                                                    : client.cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}
                                            </td>

                                            <td className="px-6 py-4 text-sm flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(client)}
                                                    className="text-emerald-600 cursor-pointer hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50/50 transition-all duration-200"
                                                    aria-label="Editar cliente."
                                                    title="Editar cliente"
                                                >
                                                    <FaEdit size={18} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(client.id!)}
                                                    className="text-red-600 cursor-pointer hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                                    aria-label="Excluir cliente"
                                                    title="Excluir cliente"
                                                >
                                                    <FaTrash size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>

                    <section className="flex items-center justify-between gap-4 mt-4">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 ${currentPage === 1 ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed" : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"}`}
                        >
                            ← Anterior
                        </button>

                        <p className="text-sm text-gray-600">
                            Página {currentPage} de {totalPages} — mostrando {totalItems ? (startIndex + 1) : 0}–{startIndex + currentItems.length} de {totalItems}
                        </p>

                        <button
                            type="button"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border-2 ${currentPage === totalPages ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed" : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"}`}
                        >
                            Próxima →
                        </button>
                    </section>
                </>
            )}
        </main>
    )
}
