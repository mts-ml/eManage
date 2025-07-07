import { useState } from "react"


interface BankAccount {
    bankName: string
    accountNumber: string
    agency: string
    id?: number
}


export const BankAccountsRegistration: React.FC = () => {
    const defaultValues = {
        bankName: "",
        accountNumber: "",
        agency: ""
    }

    const [form, setForm] = useState<Omit<BankAccount, "id">>(defaultValues)
    const [errors, setErrors] = useState(defaultValues)
    const [accounts, setAccounts] = useState<BankAccount[]>([])
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.currentTarget as {
            name: keyof BankAccount
            value: string
        }

        const updatedForm = { ...form, [name]: value }
        setForm(updatedForm)

        const validate = formValidation(updatedForm)
        setErrors(validate)

        const allFilled = Object.values(updatedForm).every(f => f.trim() !== "")
        const noErrors = Object.values(validate).every(e => e === "")
        setIsReadyToSubmit(allFilled && noErrors)
    }

    function formValidation(form: BankAccount) {
        const errors: BankAccount = {
            bankName: "",
            accountNumber: "",
            agency: ""
        }

        if (!form.bankName.trim()) errors.bankName = "Campo obrigatório"
        if (!form.accountNumber.trim()) {
            errors.accountNumber = "Campo obrigatório"
        } else if (!/^\d{4,}$/.test(form.accountNumber)) {
            errors.accountNumber = "Número inválido"
        }

        if (!form.agency.trim()) {
            errors.agency = "Campo obrigatório"
        } else if (!/^\d{3,}$/.test(form.agency)) {
            errors.agency = "Agência inválida"
        }

        return errors
    }

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        if (!isReadyToSubmit) return

        const newAccount: BankAccount = {
            ...form,
            id: Date.now()
        }

        setAccounts(prev => [...prev, newAccount])
        setForm(defaultValues)
        setErrors(defaultValues)
        setIsReadyToSubmit(false)
    }

    
    return (
        <main className="p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Cadastro de Contas Bancárias</h2>

            <form onSubmit={handleSubmit} className="grid gap-4 mb-6" aria-label="Formulário de cadastro de contas bancárias">
                {/* Banco */}
                <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">Banco</label>
                    <input
                        type="text"
                        id="bankName"
                        name="bankName"
                        placeholder="Ex: Banco do Brasil"
                        value={form.bankName}
                        onChange={handleChange}
                        aria-describedby="bankError"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {errors.bankName && (
                        <div id="bankError" className="text-red-600 text-sm mt-1" aria-live="polite">
                            {errors.bankName}
                        </div>
                    )}
                </div>

                {/* Conta */}
                <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Número da Conta</label>
                    <input
                        type="text"
                        id="accountNumber"
                        name="accountNumber"
                        placeholder="Ex: 12345-6"
                        value={form.accountNumber}
                        onChange={handleChange}
                        aria-describedby="accountError"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {errors.accountNumber && (
                        <div id="accountError" className="text-red-600 text-sm mt-1" aria-live="polite">
                            {errors.accountNumber}
                        </div>
                    )}
                </div>

                {/* Agência */}
                <div>
                    <label htmlFor="agency" className="block text-sm font-medium text-gray-700">Agência</label>
                    <input
                        type="text"
                        id="agency"
                        name="agency"
                        placeholder="Ex: 0012"
                        value={form.agency}
                        onChange={handleChange}
                        aria-describedby="agencyError"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {errors.agency && (
                        <div id="agencyError" className="text-red-600 text-sm mt-1" aria-live="polite">
                            {errors.agency}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!isReadyToSubmit}
                    className="bg-emerald-600 text-white py-2 px-4 rounded-md transition hover:bg-emerald-700 disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer"
                >
                    Salvar Conta
                </button>
            </form>

            <h3 className="text-lg font-semibold mb-2">Contas Cadastradas</h3>
            <ul className="list-disc pl-6 text-gray-800 text-sm">
                {accounts.map(account => (
                    <li key={account.id} className="mb-1">
                        <span className="font-semibold text-green-800">Banco:</span> {account.bankName} |{" "}
                        <span className="font-semibold text-green-800">Agência:</span> {account.agency} |{" "}
                        <span className="font-semibold text-green-800">Conta:</span> {account.accountNumber}
                    </li>
                ))}
            </ul>
        </main>
    )
}
