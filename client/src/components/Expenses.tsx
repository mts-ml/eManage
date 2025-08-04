import { useContext, useState } from "react"
import axios from "axios"
import { FaTrash, FaEdit } from 'react-icons/fa'

import type { Expense, ExpenseErrors, ExpenseFromBackend } from "../types/types"
import ExpenseContext from "../Context/ExpensesContext"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


export const Expenses: React.FC = () => {
    const defaultExpense: Expense = {
        name: "",
        value: "",
        dueDate: "",
        description: "",
        status: "Em aberto",
        bank: ""
    }

    const [form, setForm] = useState<Expense>(defaultExpense)
    const [formErrors, setFormErrors] = useState<ExpenseErrors>({})
    const [showForm, setShowForm] = useState(false)
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)
    const [modifiedId, setModifiedId] = useState<string | null>(null)
    const [inlineErrors, setInlineErrors] = useState<Partial<Record<string, string>>>({})


    const { expenses, setExpenses } = useContext(ExpenseContext)
    const axiosPrivate = useAxiosPrivate()


    function validateExpense(form: Expense): ExpenseErrors {
        const errors: ExpenseErrors = {}

        if (!form.name.trim()) {
            errors.name = "Campo obrigatório"
        } else if (form.name.length < 3) {
            errors.name = "Mínimo 3 caracteres"
        }

        const value = Number(form.value)
        if (!form.value || isNaN(value) || value <= 0) {
            errors.value = "Valor inválido"
        }

        if (form.description !== undefined && form.description !== null) {
            if (typeof form.description !== "string") {
                errors.description = "Descrição deve ser uma string."
            } else if (form.description.trim() !== "" && form.description.length < 3) {
                errors.description = "Descrição precisa ter pelo menos 3 letras."
            }
        }

        if (form.status === "Pago" && (!form.bank || form.bank.trim() === "")) {
            errors.bank = "Banco é obrigatório quando o status é 'Pago'"
        }

        return errors
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value } = e.currentTarget as { name: keyof Expense, value: string }

        let updatedForm = { ...form, [name]: value }

        if (name === "status" && value === "Em aberto") {
            updatedForm = { ...updatedForm, bank: "" }
        }

        setForm(updatedForm)

        const validation = validateExpense(updatedForm)
        setFormErrors(prev => ({ ...prev, [name]: validation[name] }))

        const requiredFieldsFilled = updatedForm.name.trim() !== "" && updatedForm.value !== ""
        const noErrors = Object.values(validation).every(error => !error)
        setIsReadyToSubmit(requiredFieldsFilled && noErrors)
    }

    function handleEdit(expense: Expense) {
        setForm({ ...expense })
        setEditingExpenseId(expense.id!)
        setShowForm(true)
        setFormErrors({})
        setIsReadyToSubmit(true)
    }

    function handleStatusChange(id: string, newStatus: "Em aberto" | "Pago") {
        setExpenses(prev =>
            prev.map(expense =>
                expense.id === id
                    ? {
                        ...expense,
                        status: newStatus,
                        bank: newStatus === "Em aberto" ? "" : expense.bank
                    }
                    : expense
            )
        )
        setModifiedId(id)
        setInlineErrors(prev => ({ ...prev, [id]: "" }))
    }

    function handleBankChange(id: string, bank: string) {
        setExpenses(prev =>
            prev.map(expense => (expense.id === id ? { ...expense, bank } : expense))
        )
        setModifiedId(id)
        setInlineErrors(prev => ({ ...prev, [id]: "" }))
    }

    async function handleSave(id: string) {
        try {
            const expense = expenses.find(exp => exp.id === id)
            if (!expense) return

            // Validação inline
            if (expense.status === "Pago" && (!expense.bank || expense.bank.trim() === "")) {
                setInlineErrors(prev => ({ ...prev, [id]: "Banco é obrigatório quando o status é 'Pago'" }))
                return
            }

            const payload = {
                name: expense.name,
                value: String(expense.value),
                description: expense.description,
                dueDate: expense.dueDate || null,
                status: expense.status,
                bank: expense.bank || null
            }

            const response = await axiosPrivate.put<ExpenseFromBackend>(`/expenses/${id}`, payload)
            const updated = { ...response.data, id: response.data._id }

            setExpenses(prev => prev.map(exp => exp.id === id ? updated : exp))
            setModifiedId(null)
            setInlineErrors(prev => ({ ...prev, [id]: "" }))
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data
                if (error.response?.status === 409 && data) {
                    setInlineErrors(prev => ({ ...prev, [id]: data.message }))
                } else {
                    setInlineErrors(prev => ({ ...prev, [id]: "Erro inesperado. Tente novamente." }))
                }
            } else {
                setInlineErrors(prev => ({ ...prev, [id]: "Erro inesperado. Tente novamente." }))
            }
        }
    }

    async function handleDelete(id: string) {
        if (confirm("Deseja excluir esta despesa?")) {
            await axiosPrivate.delete(`/expenses/${id}`)
            setExpenses(prev => prev.filter(exp => exp.id !== id))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!isReadyToSubmit) return

        try {
            const { name, value, description, dueDate, status, bank } = form

            const payload = {
                name,
                value: String(value),
                description: description,
                dueDate: dueDate || null,
                status: status === "Pago" ? "Pago" : "Em aberto",
                bank: bank || null
            }

            console.log(payload)

            if (editingExpenseId) {
                const response = await axiosPrivate.put<ExpenseFromBackend>(`/expenses/${editingExpenseId}`, payload)
                const updated = { ...response.data, id: response.data._id }

                setExpenses(prev => prev.map(exp => exp.id === editingExpenseId ? updated : exp))
            } else {
                const response = await axiosPrivate.post<ExpenseFromBackend>(`/expenses`, payload)

                const newExpense = { ...response.data, id: response.data._id }
                setExpenses(prev => [...prev, newExpense])
            }

            setForm(defaultExpense)
            setShowForm(false)
            setEditingExpenseId(null)
            setFormErrors({})
            setErrorMessage(null)
            setIsReadyToSubmit(false)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data
                if (error.response?.status === 409 && data) {
                    const { field, message } = data
                    setErrorMessage(message)
                    if (field) setFormErrors(prev => ({ ...prev, [field]: message }))
                } else {
                    setErrorMessage("Erro inesperado. Tente novamente.")
                }
            } else {
                setErrorMessage("Erro inesperado. Tente novamente.")
            }
        }
    }

    const fields = [
        { key: "name", label: "Despesa", placeholder: "Ex: Aluguel", required: true },
        { key: "value", label: "Valor", placeholder: "Ex: 1500.00", required: true },
        { key: "dueDate", label: "Data de Vencimento", placeholder: "", required: false },
        { key: "status", label: "Status", placeholder: "", required: false, type: "select", options: ["Em aberto", "Pago"] },
        { key: "bank", label: "Banco", placeholder: "Ex: Banco do Brasil", required: false }
    ]

    return (
        <main className="p-8 max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
                    💰 Despesas
                </h2>

                <p className="text-gray-600 font-medium">Gerencie suas despesas de forma eficiente</p>
            </div>

            <button
                type="button"
                onClick={() => {
                    setForm(defaultExpense)
                    setEditingExpenseId(null)
                    setShowForm(true)
                    setFormErrors({})
                    setErrorMessage(null)
                    setIsReadyToSubmit(false)
                }}
                className="block mb-8 cursor-pointer bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mx-auto"
            >
                ➕ Nova Despesa
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-white/90 backdrop-blur-sm shadow-xl mb-8">
                    <h3 className="text-2xl font-bold text-center mb-6 text-emerald-800">
                        {editingExpenseId ? "✏️ Editar Despesa" : "➕ Nova Despesa"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {fields.map(({ key, label, placeholder, required, type, options }) => {
                            const isDate = key === "dueDate"
                            const isSelect = type === "select"
                            const fieldName = key as keyof Expense
                            return (
                                <div key={key}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor={key}>
                                        {label} {required && <span className="text-red-500">*</span>}
                                    </label>

                                    {isSelect ? (
                                        <select
                                            name={key}
                                            id={key}
                                            value={form[fieldName] || ""}
                                            onChange={handleChange}
                                            className={`w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm cursor-pointer ${form[fieldName] === "Pago" ? "bg-green-50 text-green-700 border-green-400" : ""}`}
                                        >
                                            {options?.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={isDate ? "date" : "text"}
                                            name={key}
                                            id={key}
                                            placeholder={placeholder}
                                            value={form[fieldName] || ""}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm cursor-text"
                                        />
                                    )}

                                    {formErrors[fieldName] && (
                                        <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                            <span className="mr-1">⚠️</span>
                                            {formErrors[fieldName]}
                                        </p>
                                    )}
                                </div>
                            )
                        })}

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="description">
                                Descrição
                            </label>

                            <textarea
                                name="description"
                                id="description"
                                value={form.description || ""}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Descreva detalhes sobre a despesa..."
                                className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none cursor-text"
                            />

                            {formErrors.description && (
                                <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                    <span className="mr-1">⚠️</span>
                                    {formErrors.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center gap-6">
                        <button
                            type="button"
                            onClick={() => {
                                setForm(defaultExpense)
                                setShowForm(false)
                                setEditingExpenseId(null)
                                setFormErrors({})
                                setIsReadyToSubmit(false)
                            }}
                            className="px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer font-semibold transition-all duration-300"
                        >
                            ❌ Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={!isReadyToSubmit}
                            className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${isReadyToSubmit
                                ? "bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                : "bg-gray-400 text-gray-200 cursor-not-allowed"
                                }`}
                        >
                            {editingExpenseId ? "💾 Atualizar" : "💾 Salvar"} Despesa
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
            )}

            {expenses.length > 0 && (
                <div className="overflow-auto border-2 border-emerald-200/50 rounded-2xl shadow-xl mb-10 max-h-[70vh] bg-white/90 backdrop-blur-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-center">Despesa</th>
                                <th className="px-4 py-3 text-xs font-semibold text-center">Descrição</th>
                                <th className="px-4 py-3 text-xs font-semibold text-center">Valor</th>
                                <th className="px-4 py-3 text-xs font-semibold text-center">Data Vencimento</th>
                                <th className="px-4 py-3 text-xs font-semibold text-center">Status</th>
                                <th className="px-4 py-3 text-xs font-semibold text-center">Banco</th>
                                <th className="px-4 py-3 text-xs font-semibold text-center">Ações</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-100">
                            {expenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-800 text-center">
                                        {exp.name}
                                    </td>

                                    <td className="px-4 py-3 text-xs text-gray-600 text-center">
                                        {exp.description || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">
                                        {Number(exp.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </td>

                                    <td className="px-4 py-3 text-xs text-center">
                                        {exp.dueDate ? new Date(exp.dueDate).toLocaleDateString("pt-BR") : "-"}
                                    </td>

                                    <td className="px-4 py-3 text-xs text-center">
                                        <select
                                            aria-label="Status da despesa"
                                            className={`border-2 rounded-lg p-1 text-xs cursor-pointer transition-all duration-200 ${exp.status === "Pago" ? "bg-green-50 text-green-700 border-green-400" : "border-gray-200"}`}
                                            value={exp.status || "Em aberto"}
                                            onChange={e => handleStatusChange(exp.id!, e.target.value as "Em aberto" | "Pago")}
                                        >
                                            <option value="Em aberto">Em aberto</option>
                                            <option value="Pago">Pago</option>
                                        </select>
                                    </td>

                                    <td className="px-4 py-3 text-xs text-center">
                                        <input
                                            type="text"
                                            value={exp.bank || ""}
                                            onChange={e => handleBankChange(exp.id!, e.target.value)}
                                            placeholder="Banco"
                                            className="border-2 border-gray-200 rounded-lg p-1 w-full text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 cursor-text"
                                        />

                                        {inlineErrors[exp.id!] && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center justify-center">
                                                <span className="mr-1">⚠️</span>
                                                {inlineErrors[exp.id!]}
                                            </p>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-xs text-center">
                                        <div className="flex gap-2 justify-center">
                                            {modifiedId === exp.id ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSave(exp.id!)}
                                                    className="bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white px-3 py-1 rounded-lg text-xs font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                                >
                                                    💾 Salvar
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(exp)}
                                                        className="text-emerald-600 cursor-pointer hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50 transition-all duration-200"
                                                        aria-label="Editar despesa"
                                                    >
                                                        <FaEdit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(exp.id!)}
                                                        className="text-red-600 cursor-pointer hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                                        aria-label="Excluir despesa"
                                                    >
                                                        <FaTrash size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    )
}
