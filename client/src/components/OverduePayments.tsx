import { useEffect, useState } from "react"
import { AlertTriangle, Filter, SortAsc, SortDesc, Calendar, DollarSign, Clock, ArrowDownCircle, ArrowUpCircle } from "lucide-react"

import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import type {
    OverduePayment,
    OverduePaymentFilters,
    Receivable,
    Payable,
    ExpenseFromBackend,
    AxiosErrorResponse
} from "../types/types"

export const OverduePayments: React.FC = () => {
    const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([])
    const [filteredPayments, setFilteredPayments] = useState<OverduePayment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>("")
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState<OverduePaymentFilters>({
        type: 'all',
        sortBy: 'daysOverdue',
        sortOrder: 'desc'
    })
    
    const axiosPrivate = useAxiosPrivate()

    useEffect(() => {
        fetchOverduePayments()
    }, [axiosPrivate])

    useEffect(() => {
        applyFilters()
    }, [overduePayments, filters])

    async function fetchOverduePayments() {
        setLoading(true)
        setError("")
        
        try {
            const [receivablesRes, payablesRes, expensesRes] = await Promise.all([
                axiosPrivate.get<Receivable[]>("/sales"),
                axiosPrivate.get<Payable[]>("/payables"),
                axiosPrivate.get<ExpenseFromBackend[]>("/expenses")
            ])

            const today = new Date()
            const overdueItems: OverduePayment[] = []

            // Processar recebíveis atrasados
            receivablesRes.data
                .filter(item => item.status === "Em aberto")
                .forEach(item => {
                    // Converter data DD/MM/YYYY para Date object
                    const [day, month, year] = item.date.split('/')
                    const saleDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                    
                    // Assumir que o prazo padrão é 30 dias após a venda
                    const dueDate = new Date(saleDate.getTime() + (30 * 24 * 60 * 60 * 1000))
                    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                    
                    if (daysOverdue > 0) {
                        overdueItems.push({
                            _id: item._id,
                            type: 'receivable',
                            description: `Venda #${item.saleNumber} - ${item.clientName}`,
                            amount: item.total,
                            dueDate: dueDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
                            daysOverdue,
                            clientName: item.clientName,
                            saleNumber: item.saleNumber,
                            status: item.status,
                            paymentDate: item.paymentDate,
                            bank: item.bank
                        })
                    }
                })

            // Processar pagáveis atrasados
            if (payablesRes.status !== 204 && Array.isArray(payablesRes.data)) {
                payablesRes.data
                    .filter(item => item.status === "Em aberto")
                    .forEach(item => {
                        // Converter data DD/MM/YYYY para Date object
                        const [day, month, year] = item.date.split('/')
                        const purchaseDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                        
                        // Assumir que o prazo padrão é 30 dias após a compra
                        const dueDate = new Date(purchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000))
                        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                        
                        if (daysOverdue > 0) {
                            overdueItems.push({
                                _id: item._id,
                                type: 'payable',
                                description: `Compra #${item.purchaseNumber} - ${item.clientName}`,
                                amount: item.total,
                                dueDate: dueDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
                                daysOverdue,
                                supplierName: item.clientName, // clientName representa o nome do fornecedor
                                purchaseNumber: item.purchaseNumber,
                                invoiceNumber: item.invoiceNumber,
                                status: item.status,
                                paymentDate: item.paymentDate,
                                bank: item.bank
                            })
                        }
                    })
            }

            // Processar despesas atrasadas
            if (expensesRes.status !== 204 && Array.isArray(expensesRes.data)) {
                expensesRes.data
                    .filter(item => item.status === "Em aberto" && item.dueDate)
                    .forEach(item => {
                        if (!item.dueDate) return
                        
                        const dueDate = new Date(item.dueDate)
                        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                        
                        if (daysOverdue > 0) {
                            overdueItems.push({
                                _id: item._id,
                                type: 'expense',
                                description: item.name,
                                amount: parseFloat(item.value),
                                dueDate: item.dueDate,
                                daysOverdue,
                                status: item.status || "Em aberto",
                                paymentDate: null,
                                bank: item.bank || ""
                            })
                        }
                    })
            }

            setOverduePayments(overdueItems)
        } catch (error) {
            const axiosError = error as AxiosErrorResponse
            console.error("Erro ao buscar pagamentos atrasados:", error)
            
            if (axiosError.response?.status === 500) {
                setError("Erro interno do servidor. Tente novamente mais tarde.")
            } else if (axiosError.response?.status === 401) {
                setError("Sessão expirada. Faça login novamente.")
            } else {
                setError(axiosError.response?.data?.message || "Erro ao buscar pagamentos atrasados")
            }
        } finally {
            setLoading(false)
        }
    }

    function applyFilters() {
        let filtered = [...overduePayments]

        // Filtro por tipo
        if (filters.type && filters.type !== 'all') {
            filtered = filtered.filter(item => item.type === filters.type)
        }

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

        setFilteredPayments(filtered)
    }

    function getSeverityColor(daysOverdue: number): string {
        if (daysOverdue >= 30) return "text-red-600 bg-red-50 border-red-200"
        if (daysOverdue >= 15) return "text-orange-600 bg-orange-50 border-orange-200"
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
    }

    function getTypeIcon(type: string) {
        switch (type) {
            case 'receivable':
                return <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
            case 'payable':
                return <ArrowUpCircle className="h-4 w-4 text-red-600" />
            case 'expense':
                return <DollarSign className="h-4 w-4 text-blue-600" />
            default:
                return <AlertTriangle className="h-4 w-4 text-gray-600" />
        }
    }

    function getTypeLabel(type: string): string {
        switch (type) {
            case 'receivable':
                return 'A Receber'
            case 'payable':
                return 'A Pagar'
            case 'expense':
                return 'Despesa'
            default:
                return 'Desconhecido'
        }
    }

    function formatCurrency(value: number): string {
        return `R$ ${value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`
    }

    function formatDate(dateString: string): string {
        // Verificar se a data está no formato DD/MM/YYYY
        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/')
            return `${day}/${month}/${year}`
        }
        
        // Para datas ISO ou outras formatos
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
            return dateString // Retornar como está se não conseguir parsear
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
                    Pagamentos Atrasados
                </h1>
                <p className="text-gray-600">
                    {filteredPayments.length} pagamento(s) atrasado(s) encontrado(s)
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
                        onClick={fetchOverduePayments}
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

            {showFilters && (
                <section 
                    id="filters-panel"
                    className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"
                    aria-label="Painel de filtros"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo
                            </label>
                            <select
                                id="type-filter"
                                value={filters.type}
                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as 'receivable' | 'payable' | 'expense' | 'all' }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                aria-label="Filtrar por tipo de pagamento"
                            >
                                <option value="all">Todos</option>
                                <option value="receivable">A Receber</option>
                                <option value="payable">A Pagar</option>
                                <option value="expense">Despesas</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                                Ordenar por
                            </label>
                            <select
                                id="sort-by"
                                value={filters.sortBy}
                                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'daysOverdue' | 'amount' | 'dueDate' }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                aria-label="Ordenar pagamentos por"
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
                                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                        filters.sortOrder === 'asc' ? 'bg-emerald-100 border-emerald-500' : 'bg-white'
                                    }`}
                                    aria-label="Ordenar em ordem crescente"
                                    title="Ordenar em ordem crescente"
                                >
                                    <SortAsc className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                        filters.sortOrder === 'desc' ? 'bg-emerald-100 border-emerald-500' : 'bg-white'
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
                                    value={filters.maxDays || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, maxDays: e.target.value ? parseInt(e.target.value) : undefined }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    aria-label="Dias máximos de atraso"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {filteredPayments.length === 0 ? (
                <section className="text-center py-12" aria-label="Estado vazio">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum pagamento atrasado encontrado
                    </h2>
                    
                    <p className="text-gray-600">
                        {overduePayments.length === 0 
                            ? "Não há pagamentos atrasados no sistema."
                            : "Nenhum pagamento atende aos filtros aplicados."
                        }
                    </p>
                </section>
            ) : (
                <section className="grid gap-4" aria-label="Lista de pagamentos atrasados">
                    {filteredPayments.map((payment) => (
                        <article
                            key={payment._id}
                            className={`p-4 border rounded-lg ${getSeverityColor(payment.daysOverdue)}`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <header className="flex items-center gap-3 mb-2">
                                        {getTypeIcon(payment.type)}
                                        <span className="text-sm font-medium text-gray-600">
                                            {getTypeLabel(payment.type)}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            #{payment.saleNumber || payment.purchaseNumber || payment._id.slice(-6)}
                                        </span>
                                    </header>
                                    
                                    <h3 className="font-medium text-gray-900 mb-1">
                                        {payment.description}
                                    </h3>
                                    
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>Vencimento: {formatDate(payment.dueDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{payment.daysOverdue} dia(s) atrasado(s)</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="h-4 w-4" />
                                            <span>{formatCurrency(payment.amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        payment.daysOverdue >= 30 
                                            ? 'bg-red-100 text-red-800' 
                                            : payment.daysOverdue >= 15 
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {payment.daysOverdue} dias
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
