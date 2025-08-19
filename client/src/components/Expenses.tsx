import { useContext, useState, useEffect } from "react"
import axios from "axios"
import { FaTrash, FaEdit } from 'react-icons/fa'

import type { Expense, ExpenseErrors, ExpenseFromBackend } from "../types/types"
import ExpenseContext from "../Context/ExpensesContext"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


type SortField = 'name' | 'value' | 'dueDate' | 'status' | 'expenseNumber'
type SortOrder = 'asc' | 'desc'

interface SortConfig {
    field: SortField
    order: SortOrder
}


export const Expenses: React.FC = () => {
    const defaultExpense: Expense = {
        name: "",
        value: "",
        dueDate: "",
        description: "",
        status: "Pendente",
        bank: "",
        expenseNumber: ""
    }

    const [form, setForm] = useState<Expense>(defaultExpense)
    const [formErrors, setFormErrors] = useState<ExpenseErrors>({})
    const [showForm, setShowForm] = useState(false)
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)
    const [modifiedId, setModifiedId] = useState<string | null>(null)
    const [inlineErrors, setInlineErrors] = useState<Partial<Record<string, string>>>({})
    const [repeatMonths, setRepeatMonths] = useState<number>(1)
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 20
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'expenseNumber', order: 'desc' })

    const { expenses, setExpenses, lastExpense, getLastExpense } = useContext(ExpenseContext)
    const axiosPrivate = useAxiosPrivate()

    // Função para ordenar as despesas
    const sortExpenses = (data: Expense[], config: SortConfig): Expense[] => {
        return [...data].sort((a, b) => {
            let aValue: string | number | Date
            let bValue: string | number | Date

            switch (config.field) {
                case 'name':
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
                    break
                case 'value':
                    aValue = Number(a.value)
                    bValue = Number(b.value)
                    break
                case 'dueDate':
                    aValue = a.dueDate ? new Date(a.dueDate) : new Date(0)
                    bValue = b.dueDate ? new Date(b.dueDate) : new Date(0)
                    break
                case 'status':
                    aValue = (a.status || 'Pendente').toLowerCase()
                    bValue = (b.status || 'Pendente').toLowerCase()
                    break
                case 'expenseNumber':
                    aValue = parseInt(a.expenseNumber)
                    bValue = parseInt(b.expenseNumber)
                    break
                default:
                    return 0
            }

            if (aValue < bValue) {
                return config.order === 'asc' ? -1 : 1
            }
            if (aValue > bValue) {
                return config.order === 'asc' ? 1 : -1
            }
            return 0
        })
    }

    // Função para lidar com o clique no cabeçalho da coluna
    const handleSort = (field: SortField) => {
        setSortConfig(prev => ({
            field,
            order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
        }))
    }

    // Função para obter o ícone de ordenação
    const getSortIcon = (field: SortField) => {
        if (sortConfig.field !== field) {
            return '⇅'
        }
        return sortConfig.order === 'asc' ? '⇧' : '⇩'
    }

    // Despesas ordenadas
    const sortedExpenses = sortExpenses(expenses, sortConfig)

    useEffect(() => {
        getLastExpense()
    }, [])

    useEffect(() => {
        setCurrentPage(prev => {
            const pages = Math.max(1, Math.ceil(sortedExpenses.length / pageSize))
            
            return Math.min(prev, pages)
        })
    }, [sortedExpenses.length])

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

        if (name === "status" && value === "Pendente") {
            updatedForm = { ...updatedForm, bank: "" }
        }

        setForm(updatedForm)

        const validation = validateExpense(updatedForm)
        setFormErrors(prev => ({ ...prev, [name]: validation[name] }))

        const requiredFieldsFilled = updatedForm.name.trim() !== "" && updatedForm.value !== ""
        const noErrors = Object.values(validation).every(error => !error)
        const repeatValidation = repeatMonths === 1 || (repeatMonths > 1 && !!updatedForm.dueDate)
        setIsReadyToSubmit(requiredFieldsFilled && noErrors && repeatValidation)
    }

    function handleRepeatMonthsChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value
        const numValue = parseInt(value)

        if (value === "") {
            setRepeatMonths(0)
        } else if (!isNaN(numValue)) {
            if (numValue > 60) {
                setRepeatMonths(60)
            } else if (numValue <= 0) {
                setRepeatMonths(numValue)
            } else {
                setRepeatMonths(numValue)
            }
        }

        const validation = validateExpense(form)
        const requiredFieldsFilled = form.name.trim() !== "" && form.value !== ""
        const noErrors = Object.values(validation).every(error => !error)
        const currentValue = value === "" ? 1 : (isNaN(numValue) ? 1 : numValue)
        const repeatValidation = currentValue === 1 || (currentValue > 1 && !!form.dueDate)
        const validRepeatValue = currentValue > 0

        setIsReadyToSubmit(requiredFieldsFilled && noErrors && repeatValidation && validRepeatValue)
    }

    function getNextMonthDate(currentDate: string, monthsToAdd: number): string {
        const date = new Date(currentDate)
        date.setMonth(date.getMonth() + monthsToAdd)

        // Garantir que a data seja formatada corretamente
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
    }

    function handleEdit(expense: Expense) {
        setForm({ ...expense })
        setEditingExpenseId(expense.id!)
        setShowForm(true)
        setFormErrors({})
        setIsReadyToSubmit(true)
    }

    function handleStatusChange(id: string, newStatus: "Pendente" | "Pago") {
        setExpenses(prev =>
            prev.map(expense =>
                expense.id === id
                    ? {
                        ...expense,
                        status: newStatus,
                        bank: newStatus === "Pendente" ? "" : expense.bank
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
        const expenseToDelete = expenses.find(exp => exp.id === id)
        if (!expenseToDelete) return

        const confirmed = window.confirm(
            `Tem certeza que deseja excluir a despesa #${expenseToDelete.expenseNumber} - "${expenseToDelete.name}"?\n\nEsta ação não pode ser desfeita.`
        )

        if (confirmed) {
            await axiosPrivate.delete(`/expenses/${id}`)
            setExpenses(prev => prev.filter(exp => exp.id !== id))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!isReadyToSubmit) return

        // Validação final do campo de repetição
        if (repeatMonths <= 0) {
            setErrorMessage("A quantidade de meses deve ser maior que 0")
            return
        }

        try {
            const { name, value, description, dueDate, status, bank } = form

            const basePayload = {
                name,
                value: String(value),
                description: description,
                status: status === "Pago" ? "Pago" : "Pendente",
                bank: bank || null
            }

            if (editingExpenseId) {
                // Edição de despesa existente
                const payload = {
                    ...basePayload,
                    dueDate: dueDate || null
                }

                const response = await axiosPrivate.put<ExpenseFromBackend>(`/expenses/${editingExpenseId}`, payload)
                const updated = { ...response.data, id: response.data._id }

                setExpenses(prev => prev.map(exp => exp.id === editingExpenseId ? updated : exp))
            } else {
                // Criação de nova(s) despesa(s)
                const createdExpenses: Expense[] = []

                for (let i = 0; i < repeatMonths; i++) {
                    const payload = {
                        ...basePayload,
                        dueDate: dueDate ? getNextMonthDate(dueDate, i) : null
                    }

                    const response = await axiosPrivate.post<ExpenseFromBackend>(`/expenses`, payload)
                    const newExpense = { ...response.data, id: response.data._id }
                    createdExpenses.push(newExpense)
                }

                setExpenses(prev => [...prev, ...createdExpenses])
            }

            setForm(defaultExpense)
            setShowForm(false)
            setEditingExpenseId(null)
            setFormErrors({})
            setErrorMessage(null)
            setIsReadyToSubmit(false)
            setRepeatMonths(1)

            // Recarregar a última despesa para atualizar o próximo número
            if (!editingExpenseId) {
                getLastExpense()
            }
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

    // Cálculos de paginação para despesas ordenadas
    const totalItems = sortedExpenses.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const startIndex = (currentPage - 1) * pageSize
    const currentItems = sortedExpenses.slice(startIndex, startIndex + pageSize)

    const fields = [
        { key: "name", label: "Despesa", placeholder: "Ex: Aluguel", required: true },
        { key: "value", label: "Valor", placeholder: "Ex: 1500.00", required: true },
        { key: "dueDate", label: "Data de Vencimento", placeholder: "", required: false },
        { key: "status", label: "Status", placeholder: "", required: false, type: "select", options: ["Pendente", "Pago"] },
        { key: "bank", label: "Banco", placeholder: "Ex: Banco do Brasil", required: false }
    ]

    return (
        <main className="p-8 max-w-6xl mx-auto">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
                    💰 Despesas
                </h1>

                <p className="text-gray-600 font-medium">Gerencie suas despesas de forma eficiente</p>
            </header>

            <button
                type="button"
                onClick={() => {
                    setForm(defaultExpense)
                    setEditingExpenseId(null)
                    setShowForm(true)
                    setFormErrors({})
                    setErrorMessage(null)
                    setIsReadyToSubmit(false)
                    setRepeatMonths(1)
                    getLastExpense()
                }}
                className="block mb-8 cursor-pointer bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mx-auto"
            >
                ➕ Nova Despesa
            </button>

            {showForm && (
                <section className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-white/90 backdrop-blur-sm shadow-xl mb-8">
                    <header className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-emerald-800">
                            {editingExpenseId ? "✏️ Editar Despesa" : "➕ Nova Despesa"}
                        </h2>
                        {editingExpenseId ? (
                            <p className="text-lg text-emerald-700 mt-2">
                                Editando Despesa #{expenses.find(exp => exp.id === editingExpenseId)?.expenseNumber}
                            </p>
                        ) : (
                            <p className="text-lg text-emerald-700 mt-2">
                                Despesa Nº {lastExpense ? (parseInt(lastExpense.expenseNumber) + 1).toString() : '1'}
                            </p>
                        )}
                    </header>

                    <form onSubmit={handleSubmit}>
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {fields.map(({ key, label, placeholder, required, type, options }) => {
                                const isDate = key === "dueDate"
                                const isSelect = type === "select"
                                const fieldName = key as keyof Expense
                                return (
                                    <article key={key}>
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
                                    </article>
                                )
                            })}

                            {!editingExpenseId && (
                                <article>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="repeatMonths">
                                        Repetir por (meses) <span className="text-emerald-600">🔄</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="repeatMonths"
                                        value={repeatMonths}
                                        onChange={handleRepeatMonthsChange}
                                        className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm cursor-text"
                                        placeholder="Ex: 12"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {repeatMonths > 1 ? `Criará ${repeatMonths} despesas com datas incrementadas mensalmente` : "Criará 1 despesa"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Digite um valor maior que 0 (máximo 60 meses)
                                    </p>
                                    {repeatMonths > 1 && !form.dueDate && (
                                        <p className="text-xs text-amber-600 mt-1 flex items-center">
                                            <span className="mr-1">⚠️</span>
                                            Data de vencimento é necessária para repetir despesas
                                        </p>
                                    )}
                                </article>
                            )}

                            <article className="md:col-span-2">
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
                            </article>
                        </section>

                        <section className="flex justify-center gap-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setForm(defaultExpense)
                                    setShowForm(false)
                                    setEditingExpenseId(null)
                                    setFormErrors({})
                                    setErrorMessage(null)
                                    setIsReadyToSubmit(false)
                                    setRepeatMonths(1)
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
                                {editingExpenseId ? "💾 Atualizar" : "💾 Salvar"} Despesa
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

            {expenses.length > 0 && (
                <>
                    <header className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-emerald-800">
                            📋 Lista de Despesas
                        </h2>
                    </header>

                    <section className="overflow-auto border-2 border-emerald-200/50 rounded-2xl shadow-xl mb-10 max-h-[70vh] bg-white/90 backdrop-blur-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-10">
                                <tr>
                                    <th 
                                        className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                        onClick={() => handleSort('expenseNumber')}
                                        title="Clique para ordenar por número da despesa"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Número
                                            <span className="text-xs">{getSortIcon('expenseNumber')}</span>
                                        </div>
                                    </th>
                                    <th 
                                        className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                        onClick={() => handleSort('name')}
                                        title="Clique para ordenar por nome da despesa"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Despesa
                                            <span className="text-xs">{getSortIcon('name')}</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-center">Descrição</th>
                                    <th 
                                        className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                        onClick={() => handleSort('value')}
                                        title="Clique para ordenar por valor"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Valor
                                            <span className="text-xs">{getSortIcon('value')}</span>
                                        </div>
                                    </th>
                                    <th 
                                        className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                        onClick={() => handleSort('dueDate')}
                                        title="Clique para ordenar por data de vencimento"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Data Vencimento
                                            <span className="text-xs">{getSortIcon('dueDate')}</span>
                                        </div>
                                    </th>
                                    <th 
                                        className="px-4 py-3 text-xs font-semibold text-center cursor-pointer hover:bg-emerald-700 transition-colors duration-200 select-none"
                                        onClick={() => handleSort('status')}
                                        title="Clique para ordenar por status"
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            Status
                                            <span className="text-xs">{getSortIcon('status')}</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-center">Banco</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-center">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-100">
                                {currentItems.map(exp => (
                                    <tr key={exp.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                                        <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">
                                            #{exp.expenseNumber}
                                        </td>

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
                                            {exp.dueDate ? exp.dueDate.split('-').reverse().join('/') : "-"}
                                        </td>

                                        <td className="px-4 py-3 text-xs text-center">
                                            <select
                                                aria-label="Status da despesa"
                                                className={`border-2 rounded-lg p-1 text-xs cursor-pointer transition-all duration-200 ${exp.status === "Pago" ? "bg-green-50 text-green-700 border-green-400" : exp.status === "Pendente" ? "bg-red-50 text-red-700 border-red-200" : "border-gray-200"}`}
                                                value={exp.status || "Pendente"}
                                                onChange={e => handleStatusChange(exp.id!, e.target.value as "Pendente" | "Pago")}
                                            >
                                                <option value="Pendente">Pendente</option>
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
                                                            type="button"
                                                            onClick={() => handleEdit(exp)}
                                                            className="text-emerald-600 cursor-pointer hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-50/50 transition-all duration-200"
                                                            aria-label="Editar despesa"
                                                        >
                                                            <FaEdit size={18} />
                                                        </button>

                                                        {exp.status === "Pendente" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(exp.id!)}
                                                                className="text-red-600 cursor-pointer hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                                                aria-label="Excluir despesa"
                                                            >
                                                                <FaTrash size={18} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
