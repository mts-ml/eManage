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
        <main className="p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
                    🏦 Cadastro de Contas Bancárias
                </h2>
                <p className="text-gray-600 font-medium">Gerencie suas contas bancárias</p>
            </div>

            <form onSubmit={handleSubmit} className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-white/90 backdrop-blur-sm shadow-xl mb-8" aria-label="Formulário de cadastro de contas bancárias">
                <h3 className="text-2xl font-bold text-center mb-6 text-emerald-800">
                    ➕ Nova Conta Bancária
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Banco */}
                    <div>
                        <label htmlFor="bankName" className="block text-sm font-semibold text-gray-700 mb-2">
                            Banco <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="bankName"
                            name="bankName"
                            placeholder="Ex: Banco do Brasil"
                            value={form.bankName}
                            onChange={handleChange}
                            aria-describedby="bankError"
                            className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        />
                        {errors.bankName && (
                            <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                <span className="mr-1">⚠️</span>
                                {errors.bankName}
                            </p>
                        )}
                    </div>

                    {/* Agência */}
                    <div>
                        <label htmlFor="agency" className="block text-sm font-semibold text-gray-700 mb-2">
                            Agência <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="agency"
                            name="agency"
                            placeholder="Ex: 0012"
                            value={form.agency}
                            onChange={handleChange}
                            aria-describedby="agencyError"
                            className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        />
                        {errors.agency && (
                            <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                <span className="mr-1">⚠️</span>
                                {errors.agency}
                            </p>
                        )}
                    </div>

                    {/* Conta */}
                    <div>
                        <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                            Número da Conta <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="accountNumber"
                            name="accountNumber"
                            placeholder="Ex: 12345-6"
                            value={form.accountNumber}
                            onChange={handleChange}
                            aria-describedby="accountError"
                            className="w-full rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-4 py-3 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                        />
                        {errors.accountNumber && (
                            <p className="text-red-500 font-medium text-sm mt-2 flex items-center">
                                <span className="mr-1">⚠️</span>
                                {errors.accountNumber}
                            </p>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <button
                        type="submit"
                        disabled={!isReadyToSubmit}
                        className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        💾 Salvar Conta
                    </button>
                </div>
            </form>

            {accounts.length > 0 && (
                <div className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-white/90 backdrop-blur-sm shadow-xl">
                    <h3 className="text-2xl font-bold text-center mb-6 text-emerald-800">
                        📋 Contas Cadastradas
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accounts.map(account => (
                            <div key={account.id} className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center mb-2">
                                    <span className="text-emerald-600 mr-2">🏦</span>
                                    <span className="font-semibold text-emerald-800">{account.bankName}</span>
                                </div>
                                <div className="space-y-1 text-sm text-gray-700">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Agência:</span>
                                        <span className="font-mono">{account.agency}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Conta:</span>
                                        <span className="font-mono">{account.accountNumber}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    )
}
