import { useEffect, useState } from "react"
import { FileText, Download, Calendar, TrendingUp, TrendingDown, Building2, Filter } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"


import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import type { Receivable, Payable, ExpenseFromBackend } from "../types/types"


// Interface para estender jsPDF com propriedades do autoTable
interface JsPDFWithAutoTable extends jsPDF {
   lastAutoTable: {
      finalY: number
   }
}

interface Transaction {
   id: string
   date: string
   type: "Crédito" | "Débito"
   description: string
   amount: number
   clientName: string
   transactionNumber: string
   category: "Venda" | "Compra" | "Despesa"
   bank: string
}

interface BankBalance {
   totalCredits: number
   totalDebits: number
   balance: number
}

interface ReportFilters {
   startDate: string
   endDate: string
   selectedBank: string
   reportType: "diario" | "mensal" | "personalizado"
}


export const Reports: React.FC = () => {
   const [filters, setFilters] = useState<ReportFilters>({
      startDate: "",
      endDate: "",
      selectedBank: "",
      reportType: "mensal"
   })
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
            if (salesResponse.data && Array.isArray(salesResponse.data)) {
               salesResponse.data.forEach(sale => {
                  if (sale.bank && sale.bank.trim()) {
                     allBanks.add(sale.bank.trim())
                  }
               })
            }

            // Bancos das compras
            if (purchasesResponse.data && Array.isArray(purchasesResponse.data)) {
               purchasesResponse.data.forEach(purchase => {
                  if (purchase.bank && purchase.bank.trim()) {
                     allBanks.add(purchase.bank.trim())
                  }
               })
            }

            // Bancos das despesas
            if (expensesResponse.data && Array.isArray(expensesResponse.data)) {
               expensesResponse.data.forEach(expense => {
                  if (expense.bank && expense.bank.trim()) {
                     allBanks.add(expense.bank.trim())
                  }
               })
            }

            setAvailableBanks(Array.from(allBanks).sort())
         } catch (error) {
            console.error("Erro ao buscar bancos:", error)
         }
      }

      fetchAvailableBanks()
   }, [axiosPrivate])

   // Definir datas automáticas baseadas no tipo de relatório
   useEffect(() => {
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()

      switch (filters.reportType) {
         case "diario": {
            const todayStr = today.toISOString().split('T')[0]
            setFilters(prev => ({
               ...prev,
               startDate: todayStr,
               endDate: todayStr
            }))
            break
         }
         case "mensal": {
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
            const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
            setFilters(prev => ({
               ...prev,
               startDate: firstDayOfMonth,
               endDate: lastDayOfMonth
            }))
            break
         }
         case "personalizado":
            // Manter as datas atuais se já foram definidas
            break
      }
   }, [filters.reportType])

   // Buscar transações
   async function fetchTransactions() {
      if (!filters.startDate || !filters.endDate) return

      setIsLoading(true)
      try {
         const [salesResponse, purchasesResponse, expensesResponse] = await Promise.all([
            axiosPrivate.get<Receivable[]>("/sales"),
            axiosPrivate.get<Payable[]>("/purchases"),
            axiosPrivate.get<ExpenseFromBackend[]>("/expenses")
         ])

         // Processar todas as transações
         const allTransactions: Transaction[] = [
            // Vendas (créditos)
            ...(salesResponse.data || [])
               .filter(sale =>
                  sale.status === "Pago" &&
                  sale.paymentDate &&
                  (!filters.selectedBank || sale.bank === filters.selectedBank) &&
                  sale.paymentDate >= filters.startDate &&
                  sale.paymentDate <= filters.endDate
               )
               .map(sale => ({
                  id: sale._id,
                  date: sale.paymentDate!.split('-').reverse().join('/'),
                  type: "Crédito" as const,
                  description: `Venda #${sale.saleNumber}`,
                  amount: sale.total,
                  clientName: sale.clientName,
                  transactionNumber: `V${sale.saleNumber}`,
                  category: "Venda" as const,
                  bank: sale.bank
               })),

            // Compras (débitos)
            ...(purchasesResponse.data || [])
               .filter(purchase =>
                  purchase.status === "Pago" &&
                  purchase.payments?.length > 0 &&
                  (!filters.selectedBank || purchase.bank === filters.selectedBank)
               )
               .flatMap(purchase =>
                  purchase.payments!
                     .filter(payment =>
                        payment.paymentDate >= filters.startDate &&
                        payment.paymentDate <= filters.endDate
                     )
                     .map(payment => ({
                        id: purchase._id,
                        date: payment.paymentDate.split('-').reverse().join('/'),
                        type: "Débito" as const,
                        description: `Compra #${purchase.purchaseNumber}`,
                        amount: payment.amount,
                        clientName: purchase.supplierName,
                        transactionNumber: `C${purchase.purchaseNumber}`,
                        category: "Compra" as const,
                        bank: purchase.bank
                     }))
               ),

            // Despesas (débitos)
            ...(expensesResponse.data || [])
               .filter(expense =>
                  expense.status === "Pago" &&
                  expense.dueDate &&
                  (!filters.selectedBank || expense.bank === filters.selectedBank) &&
                  expense.dueDate >= filters.startDate &&
                  expense.dueDate <= filters.endDate
               )
               .map(expense => ({
                  id: expense._id,
                  date: expense.dueDate!.split('-').reverse().join('/'),
                  type: "Débito" as const,
                  description: expense.name,
                  amount: Number(expense.value),
                  clientName: expense.description || "Despesa",
                  transactionNumber: `D${expense._id.slice(-6)}`,
                  category: "Despesa" as const,
                  bank: expense.bank || "Não informado"
               }))
         ]

         // Ordenar por data (simples)
         allTransactions.sort((a, b) => a.date.localeCompare(b.date))

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

   function formatCurrency(value: number): string {
      return value.toLocaleString("pt-BR", {
         style: "currency",
         currency: "BRL"
      })
   }

   function formatDate(date: string): string {
      return new Date(date).toLocaleDateString("pt-BR")
   }

   function generatePDF() {
      if (transactions.length === 0) return

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const margin = 20
      let yPosition = margin

      // Cabeçalho
      doc.setFontSize(20)
      doc.setTextColor(16, 185, 129) // emerald-600
      doc.text("PANDA ALIMENTOS", pageWidth / 2, yPosition, { align: "center" })
      yPosition += 10

      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text("Relatório de Movimentação Financeira", pageWidth / 2, yPosition, { align: "center" })
      yPosition += 15

      // Informações do relatório
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Período: ${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}`, margin, yPosition)
      yPosition += 7

      if (filters.selectedBank) {
         doc.text(`Banco: ${filters.selectedBank}`, margin, yPosition)
         yPosition += 7
      }

      doc.text(`Tipo de Relatório: ${filters.reportType.charAt(0).toUpperCase() + filters.reportType.slice(1)}`, margin, yPosition)
      yPosition += 7

      doc.text(`Data de Geração: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, margin, yPosition)
      yPosition += 15

      // Resumo financeiro
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text("Resumo Financeiro", margin, yPosition)
      yPosition += 10

      const summaryData = [
         ["Total Créditos", formatCurrency(bankBalance.totalCredits)],
         ["Total Débitos", formatCurrency(bankBalance.totalDebits)],
         ["Saldo Final", formatCurrency(bankBalance.balance)]
      ]

      autoTable(doc, {
         startY: yPosition,
         head: [["Item", "Valor"]],
         body: summaryData,
         theme: "grid",
         headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontStyle: "bold"
         },
         styles: {
            fontSize: 10
         },
         margin: { left: margin, right: margin }
      })

      yPosition = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15

      // Verificar se há espaço para a tabela de transações
      if (yPosition > doc.internal.pageSize.height - 100) {
         doc.addPage()
         yPosition = margin
      }

      // Tabela de transações
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text("Detalhamento de Transações", margin, yPosition)
      yPosition += 10

      const tableData = transactions.map((transaction, index) => {
         const accumulatedBalance = transactions
            .slice(0, index + 1)
            .reduce((sum, t) => {
               return sum + (t.type === "Crédito" ? t.amount : -t.amount)
            }, 0)

         return [
            transaction.date,
            transaction.type,
            transaction.description,
            transaction.clientName,
            transaction.category,
            formatCurrency(transaction.amount),
            formatCurrency(accumulatedBalance)
         ]
      })

      autoTable(doc, {
         startY: yPosition,
         head: [["Data", "Tipo", "Descrição", "Cliente/Fornecedor", "Categoria", "Valor", "Saldo Acumulado"]],
         body: tableData,
         theme: "grid",
         headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontStyle: "bold"
         },
         styles: {
            fontSize: 8
         },
         margin: { left: margin, right: margin },
         columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 35 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 }
         }
      })

      // Rodapé
      const finalY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Total de transações: ${transactions.length}`, margin, finalY)

      // Salvar o PDF
      const fileName = `relatorio_${filters.reportType}_${filters.startDate}_${filters.endDate}.pdf`
      doc.save(fileName)
   }

   function handleFilterChange(field: keyof ReportFilters, value: string) {
      setFilters(prev => ({
         ...prev,
         [field]: value
      }))
   }

   function handleSearch() {
      fetchTransactions()
   }


   return (
      <main className="p-6 bg-white rounded-lg shadow-lg">
         <header className="mb-6">
            <h1 className="text-2xl font-bold text-emerald-800 mb-2 flex items-center gap-2">
               <FileText className="h-6 w-6" />
               Relatórios em PDF
            </h1>

            <p className="text-gray-600">Gere relatórios detalhados de movimentação financeira em PDF</p>
         </header>

         {/* Filtros */}
         <section className="bg-emerald-50 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
               <Filter className="h-5 w-5" />
               Configurações do Relatório
            </h2>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {/* Tipo de Relatório */}
               <div>
                  <label htmlFor="reportType" className="block text-sm font-medium text-emerald-700 mb-2">
                     Tipo de Relatório
                  </label>

                  <select
                     id="reportType"
                     value={filters.reportType}
                     onChange={(e) => handleFilterChange("reportType", e.target.value as "diario" | "mensal" | "personalizado")}
                     className="w-full cursor-pointer p-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  >
                     <option value="diario">Relatório Diário</option>
                     <option value="mensal">Relatório Mensal</option>
                     <option value="personalizado">Período Personalizado</option>
                  </select>
               </div>

               {/* Seleção de Banco */}
               <div>
                  <label htmlFor="bank" className="block text-sm font-medium text-emerald-700 mb-2">
                     Banco (Opcional)
                  </label>
                  <select
                     id="bank"
                     value={filters.selectedBank}
                     onChange={(e) => handleFilterChange("selectedBank", e.target.value)}
                     className="w-full cursor-pointer p-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  >
                     <option value="">Todos os bancos</option>
                     {availableBanks.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                     ))}
                  </select>
               </div>

               {/* Data Inicial */}
               <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-emerald-700 mb-2">
                     Data Inicial
                  </label>

                  <input
                     type="date"
                     id="startDate"
                     value={filters.startDate}
                     onChange={(e) => handleFilterChange("startDate", e.target.value)}
                     className="w-full cursor-pointer p-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
               </div>

               {/* Data Final */}
               <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-emerald-700 mb-2">
                     Data Final
                  </label>

                  <input
                     type="date"
                     id="endDate"
                     value={filters.endDate}
                     onChange={(e) => handleFilterChange("endDate", e.target.value)}
                     className="w-full cursor-pointer p-3 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  />
               </div>
            </section>

            <section className="flex gap-4 mt-4">
               <button
                  onClick={handleSearch}
                  disabled={!filters.startDate || !filters.endDate || isLoading}
                  className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 flex items-center gap-2"
               >
                  <Calendar className="h-4 w-4" />
                  {isLoading ? "Buscando..." : "Buscar Dados"}
               </button>

               <button
                  type="button"
                  onClick={generatePDF}
                  disabled={transactions.length === 0}
                  className="px-6 py-3 bg-emerald-800 text-white font-semibold rounded-lg hover:bg-emerald-900 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 flex items-center gap-2"
               >
                  <Download className="h-4 w-4" />
                  Gerar PDF
               </button>
            </section>
         </section>

         {/* Resumo do Saldo */}
         {transactions.length > 0 && (
            <section className="bg-white border-2 border-emerald-200 rounded-lg p-4 mb-6">
               <h2 className="text-lg font-semibold text-emerald-800 mb-4">Resumo do Período</h2>

               <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                     <header className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">Total Créditos</span>
                     </header>

                     <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(bankBalance.totalCredits)}
                     </p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                     <header className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-800">Total Débitos</span>
                     </header>

                     <p className="text-2xl font-bold text-red-700">
                        {formatCurrency(bankBalance.totalDebits)}
                     </p>
                  </div>

                  <div className={`p-4 rounded-lg border ${bankBalance.balance >= 0
                     ? "bg-emerald-50 border-emerald-200"
                     : "bg-red-50 border-red-200"
                     }`}>
                     <header className="flex items-center gap-2 mb-2">
                        <Building2 className={`h-5 w-5 ${bankBalance.balance >= 0 ? "text-emerald-600" : "text-red-600"}`} />
                        <span className={`font-semibold ${bankBalance.balance >= 0 ? "text-emerald-800" : "text-red-800"}`}>
                           Saldo Final
                        </span>
                     </header>

                     <p className={`text-2xl font-bold ${bankBalance.balance >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {formatCurrency(bankBalance.balance)}
                     </p>
                  </div>
               </section>
            </section>
         )}

         {/* TABELA */}
         {transactions.length > 0 && (
            <section className="bg-white border-2 border-emerald-200 rounded-lg overflow-hidden">
               <header className="bg-emerald-100 px-6 py-4 border-b border-emerald-200">
                  <h2 className="text-lg font-semibold text-emerald-800">
                     Transações Encontradas ({transactions.length} transações)
                  </h2>
               </header>

               <section className="overflow-x-auto">
                  <table className="w-full text-center">
                     <thead className="bg-emerald-50">
                        <tr>
                           <th className="px-4 py-3 text-xs font-semibold text-emerald-700">Data</th>
                           <th className="px-4 py-3 text-xs font-semibold text-emerald-700">Tipo</th>
                           <th className="px-4 py-3 text-xs font-semibold text-emerald-700">Descrição</th>
                           <th className="px-4 py-3 text-xs font-semibold text-emerald-700">Cliente/Fornecedor</th>
                           <th className="px-4 py-3 text-xs font-semibold text-emerald-700">Categoria</th>
                           <th className="px-4 py-3 text-xs font-semibold text-emerald-700">Banco</th>
                           <th className="px-4 py-3 text-xs font-semibold text-emerald-700">Valor</th>
                        </tr>
                     </thead>

                     <tbody className="divide-y divide-emerald-100">
                        {transactions.map((transaction) => (
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

                              <td className="px-4 py-3 text-sm text-gray-700">
                                 {transaction.bank}
                              </td>

                              <td className={`px-4 py-3 text-sm font-bold ${transaction.type === "Crédito" ? "text-green-700" : "text-red-700"}`}>
                                 {transaction.type === "Crédito" ? "+" : "-"}
                                 {formatCurrency(transaction.amount)}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </section>
            </section>
         )}

         {/* Mensagem quando não há transações */}
         {!isLoading && filters.startDate && filters.endDate && transactions.length === 0 && (
            <section className="text-center py-12 bg-gray-50 rounded-lg">
               <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
               <p className="text-gray-600">
                  Não foram encontradas transações para o período selecionado.
                  {filters.selectedBank && ` Filtro aplicado: Banco ${filters.selectedBank}`}
               </p>
            </section>
         )}
      </main>
   )
}
