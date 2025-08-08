import { useEffect, useState } from "react"
import { Calendar, DollarSign, TrendingUp, TrendingDown, Building2 } from "lucide-react"

import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import type { Receivable, Payable, ExpenseFromBackend } from "../types/types"


interface Transaction {
  id: string
  date: string
  type: "Crédito" | "Débito"
  description: string
  amount: number
  clientName: string
  transactionNumber: string
  category: "Venda" | "Compra" | "Despesa"
}

interface BankBalance {
  totalCredits: number
  totalDebits: number
  balance: number
}


export const Cashflow: React.FC = () => {
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bankBalance, setBankBalance] = useState<BankBalance>({
    totalCredits: 0,
    totalDebits: 0,
    balance: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [availableBanks, setAvailableBanks] = useState<string[]>([])

  const axiosPrivate = useAxiosPrivate()

  // Buscar bancos disponíveis
  useEffect(() => {
    async function fetchAvailableBanks() {
      try {
        const [salesResponse, purchasesResponse, expensesResponse] = await Promise.all([
          axiosPrivate.get<Receivable[]>("/sales"),
          axiosPrivate.get<Payable[]>("/purchases"),
          axiosPrivate.get<ExpenseFromBackend[]>("/expenses")
        ])

        const allBanks = new Set<string>()

        // Bancos das vendas
        if (salesResponse.status !== 204 && salesResponse.data) {
          salesResponse.data.forEach(sale => {
            if (sale.bank && sale.bank.trim()) {
              allBanks.add(sale.bank.trim())
            }
          })
        }

        // Bancos das compras
        if (purchasesResponse.status !== 204 && purchasesResponse.data) {
          purchasesResponse.data.forEach(purchase => {
            if (purchase.bank && purchase.bank.trim()) {
              allBanks.add(purchase.bank.trim())
            }
          })
        }

        // Bancos das despesas
        if (expensesResponse.status !== 204 && expensesResponse.data) {
          expensesResponse.data.forEach(expense => {
            if (expense.bank && expense.bank.trim()) {
              allBanks.add(expense.bank.trim())
            }
          })
        }

        setAvailableBanks(Array.from(allBanks).sort())
      } catch (error) {
        console.error("Erro ao buscar bancos:", error)
        setAvailableBanks([])
      }
    }

    fetchAvailableBanks()
  }, [axiosPrivate])

  // Buscar transações do banco no período
  async function fetchTransactions() {
    if (!selectedBank || !startDate || !endDate) return

    setIsLoading(true)
    try {
      const [salesResponse, purchasesResponse, expensesResponse] = await Promise.all([
        axiosPrivate.get<Receivable[]>("/sales"),
        axiosPrivate.get<Payable[]>("/purchases"),
        axiosPrivate.get<ExpenseFromBackend[]>("/expenses")
      ])

      // Processar todas as transações usando map e flat
      const allTransactions: Transaction[] = [
        // Vendas (créditos)
        ...(salesResponse.status !== 204 && salesResponse.data ? salesResponse.data
          .filter(sale =>
            sale.bank === selectedBank &&
            sale.status === "Pago" &&
            sale.paymentDate &&
            new Date(sale.paymentDate) >= new Date(startDate + 'T00:00:00') &&
            new Date(sale.paymentDate) <= new Date(endDate + 'T23:59:59')
          )
          .map(sale => ({
            id: sale._id,
            date: new Date(sale.paymentDate!).toLocaleDateString("pt-BR"),
            type: "Crédito" as const,
            description: `Venda #${sale.saleNumber}`,
            amount: sale.total,
            clientName: sale.clientName,
            transactionNumber: `V${sale.saleNumber}`,
            category: "Venda" as const
          })) : []),

        // Compras (débitos)
        ...(purchasesResponse.status !== 204 && purchasesResponse.data ? purchasesResponse.data
          .filter(purchase =>
            purchase.bank === selectedBank &&
            purchase.status === "Pago" &&
            purchase.paymentDate &&
            new Date(purchase.paymentDate) >= new Date(startDate + 'T00:00:00') &&
            new Date(purchase.paymentDate) <= new Date(endDate + 'T23:59:59')
          )
          .map(purchase => ({
            id: purchase._id,
            date: new Date(purchase.paymentDate!).toLocaleDateString("pt-BR"),
            type: "Débito" as const,
            description: `Compra #${purchase.purchaseNumber}`,
            amount: purchase.total,
            clientName: purchase.clientName,
            transactionNumber: `C${purchase.purchaseNumber}`,
            category: "Compra" as const
          })) : []),

        // Despesas (débitos) - usar dueDate como data de pagamento
        ...(expensesResponse.status !== 204 && expensesResponse.data ? expensesResponse.data
          .filter(expense =>
            expense.bank === selectedBank &&
            expense.status === "Pago" &&
            expense.dueDate &&
            new Date(expense.dueDate + 'T00:00:00') >= new Date(startDate + 'T00:00:00') &&
            new Date(expense.dueDate + 'T00:00:00') <= new Date(endDate + 'T23:59:59')
          )
          .map(expense => ({
            id: expense._id,
            date: new Date(expense.dueDate!).toLocaleDateString("pt-BR"),
            type: "Débito" as const,
            description: expense.name,
            amount: Number(expense.value),
            clientName: expense.description || "Despesa",
            transactionNumber: `D${expense._id.slice(-6)}`,
            category: "Despesa" as const
          })) : [])
      ]

      // Ordenar por data
      allTransactions.sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime())

      setTransactions(allTransactions)

      // Calcular saldo
      const totalCredits = allTransactions
        .filter(t => t.type === "Crédito")
        .reduce((sum, t) => sum + t.amount, 0)

      const totalDebits = allTransactions
        .filter(t => t.type === "Débito")
        .reduce((sum, t) => sum + t.amount, 0)

      setBankBalance({
        totalCredits,
        totalDebits,
        balance: totalCredits - totalDebits
      })

    } catch (error) {
      console.error("Erro ao buscar transações:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearch() {
    fetchTransactions()
  }

  function formatCurrency(value: number): string {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }


  return (
    <main className="p-6 bg-white rounded-lg shadow-lg">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-emerald-800 mb-2 flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Extrato Bancário
        </h1>

        <p className="text-gray-600">Visualize todas as transações de um banco em um período específico</p>
      </header>

      {/* Filtros */}
      <section className="bg-emerald-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-emerald-800 mb-4">Filtros</h2>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Seleção de Banco */}
          <article>
            <label htmlFor="bank" className="block text-sm font-medium text-emerald-700 mb-2">
              Banco
            </label>

            <select
              id="bank"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full cursor-pointer p-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
            >
              <option value="">Selecione um banco</option>
              {availableBanks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </article>

          {/* Data Inicial */}
          <article>
            <label htmlFor="startDate" className="block text-sm font-medium text-emerald-700 mb-2">
              Data Inicial
            </label>

            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full cursor-pointer p-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
            />
          </article>

          {/* Data Final */}
          <article>
            <label htmlFor="endDate" className="block text-sm font-medium text-emerald-700 mb-2">
              Data Final
            </label>

            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full cursor-pointer p-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
            />
          </article>
        </section>

        <button
          onClick={handleSearch}
          disabled={!selectedBank || !startDate || !endDate || isLoading}
          className="mt-4 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          {isLoading ? "Buscando..." : "Buscar Transações"}
        </button>
      </section>

      {/* Resumo do Saldo */}
      {transactions.length > 0 && (
        <section className="bg-white border-2 border-emerald-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-emerald-800 mb-4">Resumo do Período</h2>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <article className="bg-green-50 p-4 rounded-lg border border-green-200">
              <header className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Total Créditos</span>
              </header>

              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(bankBalance.totalCredits)}
              </p>
            </article>

            <article className="bg-red-50 p-4 rounded-lg border border-red-200">
              <header className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-800">Total Débitos</span>
              </header>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(bankBalance.totalDebits)}
              </p>
            </article>

            <article className={`p-4 rounded-lg border ${bankBalance.balance >= 0
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
              }`}>
              <header className="flex items-center gap-2 mb-2">
                <DollarSign className={`h-5 w-5 ${bankBalance.balance >= 0 ? "text-emerald-600" : "text-red-600"
                  }`} />
                <span className={`font-semibold ${bankBalance.balance >= 0 ? "text-emerald-800" : "text-red-800"
                  }`}>
                  Saldo Final
                </span>
              </header>
              <p className={`text-2xl font-bold ${bankBalance.balance >= 0 ? "text-emerald-700" : "text-red-700"
                }`}>
                {formatCurrency(bankBalance.balance)}
              </p>
            </article>
          </section>
        </section>
      )}

      {/* Lista de Transações */}
      {transactions.length > 0 && (
        <section className="bg-white border-2 border-emerald-200 rounded-lg overflow-hidden">
          <header className="bg-emerald-100 px-6 py-4 border-b border-emerald-200">
            <h2 className="text-lg font-semibold text-emerald-800">
              Extrato de Transações ({transactions.length} transações)
            </h2>
          </header>

          <section className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700">Cliente/Fornecedor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700">Categoria</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700">Valor</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-700">Saldo Acumulado</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-100">
                {transactions.map((transaction, index) => {
                  // Calcular saldo acumulado
                  const accumulatedBalance = transactions
                    .slice(0, index + 1)
                    .reduce((sum, t) => {
                      return sum + (t.type === "Crédito" ? t.amount : -t.amount)
                    }, 0)

                  return (
                    <tr key={transaction.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {transaction.date}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.type === "Crédito"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                          }`}>
                          {transaction.type === "Crédito" ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {transaction.type}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {transaction.description}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700">
                        {transaction.clientName}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.category === "Venda"
                            ? "bg-blue-100 text-blue-800"
                            : transaction.category === "Compra"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-orange-100 text-orange-800"
                          }`}>
                          {transaction.category}
                        </span>
                      </td>

                      <td className={`px-4 py-3 text-sm font-bold text-right ${transaction.type === "Crédito" ? "text-green-700" : "text-red-700"
                        }`}>
                        {transaction.type === "Crédito" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </td>

                      <td className={`px-4 py-3 text-sm font-bold text-right ${accumulatedBalance >= 0 ? "text-emerald-700" : "text-red-700"
                        }`}>
                        {formatCurrency(accumulatedBalance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        </section>
      )}

      {/* Mensagem quando não há transações */}
      {!isLoading && selectedBank && startDate && endDate && transactions.length === 0 && (
        <section className="text-center py-12 bg-gray-50 rounded-lg">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>

          <p className="text-gray-600">
            Não foram encontradas transações para o banco <strong>{selectedBank}</strong> no período selecionado.
          </p>
        </section>
      )}
    </main>
  )
} 
