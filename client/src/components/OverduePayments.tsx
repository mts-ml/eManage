import { useEffect, useState } from "react"
import { AlertTriangle, Filter, SortAsc, SortDesc, Calendar, DollarSign, Clock } from "lucide-react"

import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import type {
    ExpenseFromBackend,
    AxiosErrorResponse
} from "../types/types"

// Nova interface simplificada apenas para despesas
interface OverdueExpense {
    _id: string
    description: string
    amount: number
    dueDate: string
    daysOverdue: number
    expenseNumber: string
    status: "Pendente" | "Pago"
    bank: string
}

interface OverdueExpenseFilters {
    minDays?: number
    maxDays?: number
    minAmount?: number
    maxAmount?: number
    sortBy?: 'daysOverdue' | 'amount' | 'dueDate'
    sortOrder?: 'asc' | 'desc'
}

export const OverduePayments: React.FC = () => {
    const [overdueExpenses, setOverdueExpenses] = useState<OverdueExpense[]>([])
    const [filteredExpenses, setFilteredExpenses] = useState<OverdueExpense[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>("")
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState<OverdueExpenseFilters>({
        sortBy: 'daysOverdue',
        sortOrder: 'desc'
    })

    const axiosPrivate = useAxiosPrivate()

    useEffect(() => {
        fetchOverdueExpenses()
    }, [axiosPrivate])

    useEffect(() => {
        applyFilters()
    }, [overdueExpenses, filters])

    async function fetchOverdueExpenses() {
        setLoading(true)
        setError("")

        try {
            const expensesRes = await axiosPrivate.get<ExpenseFromBackend[]>("/expenses")

            const today = new Date()
            const overdueItems: OverdueExpense[] = []

            // Processar apenas despesas atrasadas com data de vencimento real
            if (expensesRes.status !== 204 && Array.isArray(expensesRes.data)) {
                expensesRes.data
                    .filter(item => item.status === "Pendente" && item.dueDate)
                    .forEach(item => {
                        if (!item.dueDate) return

                        const dueDate = new Date(item.dueDate)
                        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

                        if (daysOverdue > 0) {
                            overdueItems.push({
                                _id: item._id,
                                description: item.name,
                                amount: parseFloat(item.value),
                                dueDate: item.dueDate,
                                daysOverdue,
                                expenseNumber: item.expenseNumber,
                                status: item.status || "Pendente",
                                bank: item.bank || ""
                            })
                        }
                    })
            }

            setOverdueExpenses(overdueItems)
        } catch (error) {
            const axiosError = error as AxiosErrorResponse
            console.error("Erro ao buscar despesas atrasadas:", error)

            if (axiosError.response?.status === 500) {
                setError("Erro interno do servidor. Tente novamente mais tarde.")
            } else if (axiosError.response?.status === 401) {
                setError("Sessão expirada. Faça login novamente.")
            } else {
                setError(axiosError.response?.data?.message || "Erro ao buscar despesas atrasadas")
            }
        } finally {
            setLoading(false)
        }
    }

    function applyFilters() {
        let filtered = [...overdueExpenses]

        // Filtro por dias de atraso
        if (filters.minDays) {
            filtered = filtered.filter(item => item.daysOverdue >= filters.minDays!)
        }
        if (filters.maxDays) {
            filtered = filtered.filter(item => item.daysOverdue <= filters.maxDays!)
        }

        // Filtro por valor
        if (filters.minAmount) {
            filtered = filtered.filter(item => item.amount >= filters.minAmount!)
        }
        if (filters.maxAmount) {
            filtered = filtered.filter(item => item.amount <= filters.maxAmount!)
        }

        // Ordenação
        filtered.sort((a, b) => {
            let comparison = 0

            switch (filters.sortBy) {
                case 'daysOverdue':
                    comparison = a.daysOverdue - b.daysOverdue
                    break
                case 'amount':
                    comparison = a.amount - b.amount
                    break
                case 'dueDate':
                    comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                    break
                default:
                    comparison = a.daysOverdue - b.daysOverdue
            }

            return filters.sortOrder === 'desc' ? -comparison : comparison
        })

        setFilteredExpenses(filtered)
    }

    function getSeverityColor(daysOverdue: number): string {
        if (daysOverdue >= 30) return "text-red-600 bg-red-50 border-red-200"
        if (daysOverdue >= 15) return "text-orange-600 bg-orange-50 border-orange-200"
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
    }

    function formatCurrency(value: number): string {
        return `R$ ${value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`
    }

    function formatDate(dateString: string): string {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
            return dateString
        }
        return date.toLocaleDateString('pt-BR')
    }

    if (loading) {
        return (
            <section className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            </section>
        )
    }

    return (
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Despesas Atrasadas
                </h1>

                <p className="text-gray-600">
                    {filteredExpenses.length} despesa(s) atrasada(s) encontrada(s)
                </p>
            </header>

            {error && (
                <section className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="polite">
                    <p className="text-red-800">{error}</p>
                </section>
            )}

            <section className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                    </button>

                    <button
                        onClick={fetchOverdueExpenses}
                        className="cursor-pointer px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                        Atualizar
                    </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600" role="note" aria-label="Legenda de cores">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>≤ 14 dias</span>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span>15-29 dias</span>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>≥ 30 dias</span>
                </div>
            </section>

            {/* Painel de filtros */}
            {showFilters && (
                <section
                    id="filters-panel"
                    className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"
                    aria-label="Painel de filtros"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                                Ordenar por
                            </label>

                            <select
                                id="sort-by"
                                value={filters.sortBy}
                                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'daysOverdue' | 'amount' | 'dueDate' }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                aria-label="Ordenar despesas por"
                            >
                                <option value="daysOverdue">Dias de Atraso</option>
                                <option value="amount">Valor</option>
                                <option value="dueDate">Data de Vencimento</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ordem
                            </label>

                            <div className="flex" role="group" aria-label="Ordenação">
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${filters.sortOrder === 'asc' ? 'bg-emerald-100 border-emerald-500' : 'bg-white'
                                        }`}
                                    aria-label="Ordenar em ordem crescente"
                                    title="Ordenar em ordem crescente"
                                >
                                    <SortAsc className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${filters.sortOrder === 'desc' ? 'bg-emerald-100 border-emerald-500' : 'bg-white'
                                        }`}
                                    aria-label="Ordenar em ordem decrescente"
                                    title="Ordenar em ordem decrescente"
                                >
                                    <SortDesc className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dias de Atraso
                            </label>

                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    placeholder="Mín"
                                    value={filters.minDays || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, minDays: e.target.value ? parseInt(e.target.value) : undefined }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    aria-label="Dias mínimos de atraso"
                                />

                                <input
                                    type="number"
                                    placeholder="Máx"
                                    value={filters.minDays || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, maxDays: e.target.value ? parseInt(e.target.value) : undefined }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    aria-label="Dias máximos de atraso"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {filteredExpenses.length === 0 ? (
                <section className="text-center py-12" aria-label="Estado vazio">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhuma despesa atrasada encontrada
                    </h2>

                    <p className="text-gray-600">
                        {overdueExpenses.length === 0
                            ? "Não há despesas atrasadas no sistema."
                            : "Nenhuma despesa atende aos filtros aplicados."
                        }
                    </p>
                </section>
            ) : (
                <section className="grid gap-4" aria-label="Lista de despesas atrasadas">
                    {filteredExpenses.map((expense) => (
                        <article
                            key={expense._id}
                            className={`p-4 border rounded-lg ${getSeverityColor(expense.daysOverdue)}`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <header className="flex items-center gap-3 mb-2">
                                        <DollarSign className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-600">
                                            Despesa
                                        </span>
                                        
                                        <span className="text-sm text-gray-500">
                                            #{expense.expenseNumber}
                                        </span>
                                    </header>

                                    <h3 className="font-medium text-gray-900 mb-1">
                                        {expense.description}
                                    </h3>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>Vencimento: {formatDate(expense.dueDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{expense.daysOverdue} dia(s) atrasado(s)</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="h-4 w-4" />
                                            <span>{formatCurrency(expense.amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${expense.daysOverdue >= 30
                                        ? 'bg-red-100 text-red-800'
                                        : expense.daysOverdue >= 15
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {expense.daysOverdue} dias
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    )
}
