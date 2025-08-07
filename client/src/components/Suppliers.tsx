import { useContext, useState } from "react"
import { FaTrash, FaEdit, FaSearch } from 'react-icons/fa'

import type { Supplier, SupplierErrors, SupplierFromBackend } from "../types/types"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import axios from "axios"
import {
    capitalizeWords,
    isValidCPF,
    isValidCNPJ,
    formatPhoneForDisplay
} from "../utils/utils"
import SupplierContext from "../Context/SupplierContext"


export const Suppliers: React.FC = () => {
    const defaultSupplier: Supplier = {
        name: "",
        email: "",
        phone: "",
        cpfCnpj: "",
        address: "",
        district: "",
        city: "",
        notes: ""
    }

    const [form, setForm] = useState<Supplier>(defaultSupplier)
    const [formErrors, setFormErrors] = useState<SupplierErrors>({})
    const [showForm, setShowForm] = useState(false)
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)
    const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const { suppliers, setSuppliers } = useContext(SupplierContext)
    const axiosPrivate = useAxiosPrivate()

    // Filtrar fornecedores baseado no termo de busca (nome ou CPF/CNPJ)
    const filteredSuppliers = suppliers.filter(supplier => {
        if (!searchTerm.trim()) return true

        const searchLower = searchTerm.toLowerCase().trim()
        const supplierNameLower = supplier.name.toLowerCase()

        // Busca por nome (exata ou parcial)
        const nameMatch = supplierNameLower.includes(searchLower)

        // Busca por CPF/CNPJ (apenas números)
        const searchNumbers = searchTerm.replace(/\D/g, '')
        const cpfCnpjMatch = searchNumbers && supplier.cpfCnpj.replace(/\D/g, '').includes(searchNumbers)

        return nameMatch || cpfCnpjMatch
    })


    function formValidation(form: Supplier): SupplierErrors {
        const errors: SupplierErrors = {}

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
            name: keyof Supplier,
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


    function handleEdit(supplier: Supplier) {
        setForm({ ...supplier })
        setEditingSupplierId(supplier.id!)
        setShowForm(true)
    }

    async function handleDelete(id: string) {
        if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
            await axiosPrivate.delete(`suppliers/${id}`)
            setSuppliers(prev => prev.filter(supplier => supplier.id !== id))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!isReadyToSubmit) return

        const normalizedSupplier: Supplier = {
            ...form,
            phone: form.phone.replace(/\D/g, ''),
            cpfCnpj: form.cpfCnpj.replace(/\D/g, '')
        }

        try {
            // Editar fornecedor
            if (editingSupplierId) {
                const response = await axiosPrivate.put<SupplierFromBackend>(`/suppliers/${editingSupplierId}`, normalizedSupplier)

                const updatedSupplier = { ...response.data, id: response.data._id }
                setSuppliers(prev => prev.map(supplier =>
                    supplier.id === editingSupplierId ? updatedSupplier : supplier)
                )
            } else {
                // Criar novo usuário
                const response = await axiosPrivate.post<SupplierFromBackend>('/suppliers', normalizedSupplier)

                const newSupplier = { ...response.data, id: response.data._id }

                setSuppliers(prev => [...prev, newSupplier])
            }

            // Limpa os campos
            setForm(defaultSupplier)
            setShowForm(false)
            setEditingSupplierId(null)
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

    const supplierFields = [
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
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
                    🚚 Cadastro de Fornecedores
                </h1>

                <p className="text-gray-600 font-medium">Gerencie seus fornecedores de forma eficiente</p>
            </header>

            <button
                type="button"
                onClick={() => {
                    setForm(defaultSupplier)
                    setEditingSupplierId(null)
                    setShowForm(true)
                    setFormErrors({})
                }}
                className="block mx-auto text-center mb-8 bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
                ➕ Novo Fornecedor
            </button>

            {showForm && (
                <section className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-white/90 backdrop-blur-sm shadow-xl mb-8">
                    <header className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-emerald-800">
                            {editingSupplierId ? "✏️ Editar Fornecedor" : "➕ Novo Fornecedor"}
                        </h2>
                    </header>

                    <form onSubmit={handleSubmit}>
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {supplierFields.map(({ key, label, placeholder }) => {
                                const fieldName = key as keyof Supplier

                                return (
                                    <article key={key}>
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
                                                {formErrors[key as keyof Supplier]}
                                            </p>
                                        )}
                                    </article>
                                )
                            })}

                            <article className="md:col-span-2">
                                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Observações
                                </label>
                                <textarea
                                    name="notes"
                                    id="notes"
                                    value={form.notes || ""}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Adicione observações sobre o fornecedor..."
                                    className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none"
                                />
                            </article>
                        </section>

                        <section className="flex gap-6 justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setForm(defaultSupplier)
                                    setShowForm(false)
                                    setEditingSupplierId(null)
                                    setFormErrors({})
                                }}
                                className="px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer font-semibold transition-all duration-300"
                            >
                                ❌ Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={!isReadyToSubmit}
                                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${isReadyToSubmit ? "bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" : "bg-gray-400 text-gray-200 cursor-not-allowed"}`}
                            >
                                {editingSupplierId ? "💾 Atualizar" : "💾 Salvar"} Fornecedor
                            </button>
                        </section>

                        {errorMessage && (
                            <section className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-600 font-medium text-center flex items-center justify-center">
                                    <span className="mr-2">❌</span>
                                    {errorMessage}
                                </p>
                            </section>
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
                            Buscar Fornecedor
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
                        {filteredSuppliers.length} fornecedor{filteredSuppliers.length !== 1 ? 'es' : ''} encontrado{filteredSuppliers.length !== 1 ? 's' : ''}
                    </p>
                )}
            </section>

            {suppliers.length > 0 && (
                <>
                    <header className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-emerald-800">
                            📋 Lista de Fornecedores
                        </h2>
                    </header>

                    <section className="overflow-auto border-2 border-emerald-200/50 rounded-2xl shadow-xl mb-10 max-h-[70vh] bg-white/90 backdrop-blur-sm">
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
                                {filteredSuppliers.map(supplier => (
                                    <tr key={supplier.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-center">{supplier.name}</td>

                                        <td className="px-6 py-4 text-sm break-words text-emerald-700 text-center">{supplier.email}</td>

                                        <td className="px-6 py-4 text-sm whitespace-nowrap font-medium text-center">
                                            {formatPhoneForDisplay(supplier.phone)}
                                        </td>

                                        <td className="px-6 py-4 text-sm whitespace-nowrap font-mono text-center">
                                            {supplier.cpfCnpj.length === 11
                                                ? supplier.cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                                                : supplier.cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}
                                        </td>

                                        <td className="px-6 py-4 text-sm flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(supplier)}
                                                className="text-emerald-600 cursor-pointer hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50/50 transition-all duration-200"
                                                aria-label="Editar fornecedor."
                                            >
                                                <FaEdit size={18} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(supplier.id!)}
                                                className="text-red-600 cursor-pointer hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                                aria-label="Excluir fornecedor"
                                            >
                                                <FaTrash size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </>
            )}
        </main>
    )
}
