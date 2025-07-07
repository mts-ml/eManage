import { useState } from "react"


interface Expense {
    title: string
    amount: string
    date: string
    id?: number
}


export const ExpensesRegistration: React.FC = () => {
    const defaultValues = {
        title: "",
        amount: "",
        date: ""
    }

    const [form, setForm] = useState<Omit<Expense, "id">>(defaultValues)
    const [errors, setErrors] = useState(defaultValues)
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)


    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.currentTarget as {
            name: keyof Expense
            value: string
        }

        const formattedValue = name === "amount" ? value.replace(",", ".") : value

        const updatedForm = { ...form, [name]: formattedValue }
        setForm(updatedForm)

        const validateFields = formValidation(updatedForm)
        setErrors(validateFields)

        const allFieldsFilled = Object.values(updatedForm).every(field => field.trim() !== "")
        const noErrors = Object.values(validateFields).every(error => error === "")
        setIsReadyToSubmit(allFieldsFilled && noErrors)
    }

    function formValidation(form: Expense) {
        const errors: Expense = { title: "", amount: "", date: "" }

        if (!form.title.trim()) errors.title = "Campo obrigatório"
        if (!form.date.trim()) errors.date = "Campo obrigatório"

        if (!form.amount.trim()) {
            errors.amount = "Campo obrigatório"
        } else if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
            errors.amount = "Valor inválido"
        }

        return errors
    }

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        if (!isReadyToSubmit) return

        const newExpense: Expense = {
            ...form,
            id: Date.now()
        }

        setExpenses(prev => [...prev, newExpense])
        setForm(defaultValues)
        setErrors(defaultValues)
        setIsReadyToSubmit(false)
    }


    return (
        <main className="p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Cadastro de Despesas</h2>

            <form onSubmit={handleSubmit} className="grid gap-4 mb-6" aria-label="Formulário de cadastro de despesas">

                {/* Título */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título</label>

                    <input
                        type="text"
                        id="title"
                        name="title"
                        placeholder="Ex: Internet, Conta de luz..."
                        value={form.title}
                        onChange={handleChange}
                        aria-describedby="titleError"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />

                    {errors.title && (
                        <div id="titleError" className="text-red-600 text-sm mt-1" aria-live="polite">{errors.title}</div>
                    )}
                </div>

                {/* Valor */}
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor</label>

                    <input
                        type="text"
                        id="amount"
                        name="amount"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={handleChange}
                        aria-describedby="amountError"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />

                    {errors.amount && (
                        <div
                            id="amountError"
                            className="text-red-600 text-sm mt-1"
                            aria-live="polite">
                            {errors.amount}
                        </div>
                    )}
                </div>

                {/* Data */}
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data</label>

                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        aria-describedby="dateError"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />

                    {errors.date && (
                        <div
                            id="dateError"
                            aria-live="polite"
                            className="text-red-600 text-sm mt-1 cursor-pointer"
                        >
                            {errors.date}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!isReadyToSubmit}
                    className="bg-emerald-600 text-white py-2 px-4 rounded-md transition hover:bg-emerald-700 disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer"
                >
                    Salvar Despesa
                </button>
            </form>

            <h3 className="text-lg font-semibold mb-2">Lista de Despesas</h3>

            <ul className="list-disc pl-6 text-gray-800 text-sm">
                {expenses.map(expense => (
                    <li key={expense.id} className="mb-1">
                        <span className="font-semibold text-green-800">Título:</span> {expense.title} |{" "}
                        <span className="font-semibold text-green-800">Valor:</span> R${Number(expense.amount).toFixed(2).replace(".", ",")} |{" "}
                        <span className="font-semibold text-green-800">Data:</span> {new Date(expense.date).toLocaleDateString("pt-BR")}
                    </li>
                ))}
            </ul>
        </main>
    )
}
