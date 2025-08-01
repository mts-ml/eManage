import { useContext, useState } from "react"
import { FaTrash, FaEdit } from "react-icons/fa"
import axios from "axios"

import type { Expense, ExpenseErrors, ExpenseFromBackend } from "../types/types"
import ExpenseContext from "../Context/ExpensesContext"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


export const Expenses: React.FC = () => {
    const defaultExpense: Expense = {
        name: "",
        value: "",
        dueDate: "",
        description: ""
    }

    const [form, setForm] = useState<Expense>(defaultExpense)
    const [formErrors, setFormErrors] = useState<ExpenseErrors>({})
    const [showForm, setShowForm] = useState(false)
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)

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

        // if (form.description && form.description.trim().length < 3) {
        //     errors.description = "Mínimo 3 caracteres."
        // }

        return errors
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.currentTarget as { name: keyof Expense, value: string }

        const updatedForm = { ...form, [name]: value }
        setForm(updatedForm)

        const validation = validateExpense(updatedForm)
        setFormErrors(prev => ({ ...prev, [name]: validation[name] }))

        const requiredFieldsFilled = updatedForm.name.trim() !== "" && updatedForm.value !== ""
        const noErrors = Object.values(validation).every(error => !error)
        setIsReadyToSubmit(requiredFieldsFilled && noErrors)
    }

    function handleEdit(expense: Expense) {
        setForm({ ...expense, value: String(expense.value) })
        setEditingExpenseId(expense.id!)
        setShowForm(true)
        setFormErrors({})
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
            const { name, value, description, dueDate } = form

            const payload = {
                name,
                value,
                description: description || "-",
                dueDate: dueDate || null
            }

            if (editingExpenseId) {
                const response = await axiosPrivate.put<ExpenseFromBackend>(`/expenses/${editingExpenseId}`, payload)

                const updated = { ...response.data, id: response.data._id }
                setExpenses(prev => prev.map(exp => exp.id === editingExpenseId ? updated : exp))
            } else {
                console.log(payload)                
                const response = await axiosPrivate.post<ExpenseFromBackend>(`/expenses`, payload)

                const newExpense = { ...response.data, id: response.data._id }
                setExpenses(prev => [...prev, newExpense])
            }

            setForm(defaultExpense)
            setShowForm(false)
            setEditingExpenseId(null)
            setFormErrors({})
            setErrorMessage(null)
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
        { key: "dueDate", label: "Data de Vencimento", placeholder: "", required: false }
    ]

    return (
        <main className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6">Despesas</h2>

            <button
                type="button"
                onClick={() => {
                    setForm(defaultExpense)
                    setEditingExpenseId(null)
                    setShowForm(true)
                    setFormErrors({})
                }}
                className="block mb-6 cursor-pointer bg-emerald-600 text-white px-4 mx-auto py-2 rounded-md hover:bg-emerald-700"
            >
                Nova Despesa
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-gray-50 shadow-sm">
                    <h3 className="text-xl font-semibold mb-4">
                        {editingExpenseId ? "Editar Despesa" : "Nova Despesa"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {fields.map(({ key, label, placeholder, required }) => {
                            const isDate = key === "dueDate"
                            const fieldName = key as keyof Expense
                            return (
                                <div key={key}>
                                    <label className="block text-sm font-medium mb-1" htmlFor={key}>
                                        {label} {required && "*"}
                                    </label>

                                    <input
                                        type={isDate ? "date" : "text"}
                                        name={key}
                                        id={key}
                                        placeholder={placeholder}
                                        value={form[fieldName] || ""}
                                        onChange={handleChange}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 px-2"
                                    />

                                    {formErrors[fieldName] && (
                                        <p className="ml-2 text-red-600 text-sm mt-1">{formErrors[fieldName]}</p>
                                    )}
                                </div>
                            )
                        })}

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1" htmlFor="description">
                                Descrição
                            </label>

                            <textarea
                                name="description"
                                id="description"
                                value={form.description || ""}
                                onChange={handleChange}
                                rows={3}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                            />

                            {formErrors.description && (
                                <p className="ml-2 text-red-600 text-sm mt-1">
                                    {formErrors.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                setForm(defaultExpense)
                                setShowForm(false)
                                setEditingExpenseId(null)
                                setFormErrors({})
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={!isReadyToSubmit}
                            className={`px-4 py-2 rounded-md transition ${isReadyToSubmit
                                ? "bg-emerald-600 cursor-pointer text-white hover:bg-emerald-700"
                                : "bg-gray-400 text-gray-200 cursor-not-allowed"
                                }`}
                        >
                            {editingExpenseId ? "Atualizar" : "Salvar"} Despesa
                        </button>
                    </div>

                    {errorMessage && (
                        <p className="mt-4 p-3 bg-red-100 text-center text-red-700 rounded">{errorMessage}</p>
                    )}
                </form>
            )}

            {expenses.length > 0 && (
                <div className="overflow-auto border rounded-lg shadow-sm mb-10">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-emerald-600 text-white">
                            <tr>
                                <th className="px-4 py-2 text-sm">Despesa</th>
                                <th className="px-4 py-2 text-sm">Valor</th>
                                <th className="px-4 py-2 text-sm">Vencimento</th>
                                <th className="px-4 py-2 text-sm">Descrição</th>
                                <th className="px-4 py-2 text-sm">Ações</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y text-center divide-gray-100">
                            {expenses.map(exp => (
                                <tr key={exp.id}>
                                    <td className="px-4 py-2 text-sm">{exp.name}</td>

                                    <td className="px-4 py-2 text-sm">
                                        {Number(exp.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </td>

                                    <td className="px-4 py-2 text-sm">
                                        {exp.dueDate ? new Date(exp.dueDate).toLocaleDateString() : "-"}
                                    </td>

                                    <td className="px-4 py-2 text-sm max-w-[160px] truncate" title={exp.description}>
                                        {exp.description || "-"}
                                    </td>

                                    <td className="px-4 py-2 flex gap-2 justify-center">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(exp)}
                                            className="text-emerald-600 cursor-pointer hover:text-emerald-800"
                                            aria-label="Editar Despesa."
                                        >
                                            <FaEdit size={18} />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(exp.id!)}
                                            className="text-red-700 cursor-pointer hover:text-red-800"
                                            aria-label="Excluir Despesa."
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
        </main>
    )
}
