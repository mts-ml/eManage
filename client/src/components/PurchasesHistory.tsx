import { useState } from "react"
import { FaSearch, FaCalendarAlt } from 'react-icons/fa'
import type { AxiosResponse } from "axios"

import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import type { Payable } from "../types/types"


interface PurchasesHistoryFilters {
   startDate: string
   endDate: string
   supplierSearch: string
   purchaseNumberSearch: string
}


export const PurchasesHistory: React.FC = () => {
   const [purchasesHistory, setPurchasesHistory] = useState<Payable[]>([])
   const [filteredPurchases, setFilteredPurchases] = useState<Payable[]>([])
   const [loading, setLoading] = useState<boolean>(false)
   const [filters, setFilters] = useState<PurchasesHistoryFilters>({
      startDate: "",
      endDate: "",
      supplierSearch: "",
      purchaseNumberSearch: ""
   })
   const axiosPrivate = useAxiosPrivate()

   async function fetchPurchasesHistory() {
      setLoading(true)
      try {
         const response: AxiosResponse<Payable[]> = await axiosPrivate.get('/purchases/history')
         setPurchasesHistory(response.data)
         // Aplicar filtros após buscar dados
         applyFilters(response.data)
      } catch (error) {
         console.error("Erro ao buscar histórico de compras:", error)
         alert("Erro ao carregar histórico de compras")
      } finally {
         setLoading(false)
      }
   }

   function applyFilters(data: Payable[] = purchasesHistory) {
      let filtered = [...data]

      // Filtro por período (só aplicar se ambas as datas estiverem preenchidas)
      if (filters.startDate && filters.endDate) {
         filtered = filtered.filter(purchase => {
            // Converter data do formato brasileiro (dd/mm/yyyy) para Date
            const [day, month, year] = purchase.date.split('/')
            // Criar data no formato YYYY-MM-DD para evitar problemas de fuso horário
            const purchaseDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
            const purchaseDate = new Date(purchaseDateStr + 'T00:00:00')
            
            const startDate = new Date(filters.startDate + 'T00:00:00')
            const endDate = new Date(filters.endDate + 'T23:59:59')

            return purchaseDate >= startDate && purchaseDate <= endDate
         })
      }

      // Filtro por fornecedor
      if (filters.supplierSearch.trim()) {
         filtered = filtered.filter(purchase =>
            purchase.clientName.toLowerCase().includes(filters.supplierSearch.toLowerCase().trim())
         )
      }

      // Filtro por número da compra
      if (filters.purchaseNumberSearch.trim()) {
         filtered = filtered.filter(purchase =>
            purchase.purchaseNumber.toString().includes(filters.purchaseNumberSearch.trim())
         )
      }

      setFilteredPurchases(filtered)
   }

   function handleFilterChange(key: keyof PurchasesHistoryFilters, value: string) {
      setFilters(prev => ({ ...prev, [key]: value }))
   }

   function clearFilters() {
      setFilters({
         startDate: "",
         endDate: "",
         supplierSearch: "",
         purchaseNumberSearch: ""
      })
      setFilteredPurchases([])
   }

   function handleSearch() {
      fetchPurchasesHistory()
   }

   function formatCurrency(value: number): string {
      return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
   }

   const totalPurchases = filteredPurchases.length
   const totalExpenses = filteredPurchases.reduce((sum, purchase) => sum + purchase.total, 0)


   return (
      <main className="p-8 max-w-7xl mx-auto">
         <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
               📦 Histórico de Compras
            </h1>

            <p className="text-gray-600 font-medium">Consulte todas as compras realizadas no período</p>
         </header>

         {/* Filtros */}
         <section className="border-2 border-emerald-200/50 rounded-2xl p-6 bg-white/90 backdrop-blur-sm shadow-xl mb-8">
            <header className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-semibold text-emerald-800 flex items-center">
                  <FaCalendarAlt className="mr-2" />
                  Filtros de Período
               </h2>

               <section className="flex items-center gap-3">
                  <button
                     type="button"
                     onClick={handleSearch}
                     className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
                  >
                     🔍 Buscar Compras
                  </button>

                  <button
                     type="button"
                     onClick={clearFilters}
                     className="text-emerald-600 hover:text-emerald-700 font-medium text-sm cursor-pointer"
                  >
                     Limpar Filtros
                  </button>
               </section>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
               <article>
                  <label
                     htmlFor="startDate"
                     className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                     Data Inicial
                  </label>

                  <input
                     id="startDate"
                     type="date"
                     value={filters.startDate}
                     onChange={e => handleFilterChange('startDate', e.target.value)}
                     className="w-full border-2 border-gray-200 rounded-lg p-3 transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
               </article>

               <article>
                  <label
                     htmlFor="endDate"
                     className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                     Data Final
                  </label>

                  <input
                     id="endDate"
                     type="date"
                     value={filters.endDate}
                     onChange={e => handleFilterChange('endDate', e.target.value)}
                     className="w-full border-2 border-gray-200 rounded-lg p-3 transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
               </article>

               <article>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Buscar Fornecedor
                  </label>

                  <section className="relative">
                     <section className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-4 w-4 text-gray-400" />
                     </section>

                     <input
                        type="text"
                        placeholder="Nome do fornecedor..."
                        value={filters.supplierSearch}
                        onChange={e => handleFilterChange('supplierSearch', e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                     />
                  </section>
               </article>

               <article>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                     Número da Compra
                  </label>

                  <input
                     type="text"
                     placeholder="Número da compra..."
                     value={filters.purchaseNumberSearch}
                     onChange={e => handleFilterChange('purchaseNumberSearch', e.target.value)}
                     className="w-full border-2 border-gray-200 rounded-lg p-3 transition-all duration-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
               </article>
            </section>

                         {/* Estatísticas */}
             <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <article className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                   <p className="text-sm font-medium text-gray-600 mb-1">Total de Compras</p>

                   <p className="text-2xl font-bold text-emerald-700">{totalPurchases}</p>
                </article>

                <article className="bg-green-50/50 p-4 rounded-xl border border-green-200">
                   <p className="text-sm font-medium text-gray-600 mb-1">Despesa Total</p>

                   <p className="text-2xl font-bold text-green-700">{formatCurrency(totalExpenses)}</p>
                </article>
             </section>
         </section>

                   {/* Tabela de Histórico */}
         <section className="border-2 border-emerald-200/50 rounded-2xl shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
            <header className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
               <h3 className="font-semibold text-white text-lg">
                  Compras Realizadas ({filteredPurchases.length})
               </h3>
            </header>

            {loading ? (
               <section className="p-8 text-center">
                  <section className="inline-flex items-center justify-center w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2"></section>
                  <span className="text-gray-600">Carregando histórico...</span>
               </section>
            ) :
               filteredPurchases.length === 0 ? (
                  <section className="p-8 text-center">
                     {purchasesHistory.length === 0 ? (
                        <article>
                           <p className="text-gray-500 text-lg mb-4">Nenhuma compra carregada</p>

                           <p className="text-gray-400 text-sm">Clique em "Buscar Compras" para carregar o histórico</p>
                        </article>
                     ) : (
                        <p className="text-gray-500 text-lg">Nenhuma compra encontrada com os filtros aplicados</p>
                     )}
                  </section>
               ) : (
                  <section className="overflow-x-auto max-h-[70vh]">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-emerald-50 sticky top-0 z-10">
                           <tr>
                              <th className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center">Data</th>
                              <th className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center">Nº Compra</th>
                              <th className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center">Fornecedor</th>
                              <th className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center">Itens</th>
                              <th className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center">Total</th>
                              <th className="px-4 py-3 text-xs font-semibold text-emerald-700 text-center">Status</th>
                           </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-100">
                           {filteredPurchases.map(purchase => (
                              <tr key={purchase._id} className="hover:bg-emerald-50/50 transition-colors duration-200">

                                <td className="px-4 py-3 text-xs font-medium text-center">
                                   {purchase.date}
                                </td>

                                <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">
                                   #{purchase.purchaseNumber}
                                </td>

                                <td className="px-4 py-3 text-xs text-center">
                                   {purchase.clientName}
                                </td>

                                <td className="px-4 py-3 text-xs">
                                   {purchase.items.map((item, index) => (
                                      <section key={index}
                                         className="flex items-center justify-center text-gray-700"
                                      >
                                         <span className="font-medium">{item.productName} -</span>
                                         <span className="text-gray-600 ml-1">{item.quantity}(x) -</span>
                                         <span className="text-emerald-600 font-semibold ml-1">
                                            {formatCurrency(item.price)}
                                         </span>
                                      </section>
                                   ))}
                                </td>

                                <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-center">
                                   {formatCurrency(purchase.total)}
                                </td>

                                <td className="px-4 py-3 text-xs text-center">
                                   <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${purchase.status === "Pago"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                      }`}>
                                      {purchase.status}
                                   </span>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </section>
              )}
         </section>
      </main>
   )
} 