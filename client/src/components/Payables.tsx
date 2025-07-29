import { useContext, useEffect, useState } from "react"

import ProductsContext from "../Context/ProductsContext"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"
import type { ItemPayload } from "../types/types"


interface Payable extends ItemPayload {
    _id: string
    purchaseNumber: number
    status: "Em aberto" | "Pago"
    paymentDate: string | null
    bank: string
}


export const Payables: React.FC = () => {
  const [payables, setPayables] = useState<Payable[]>([])
  const [modifiedId, setModifiedId] = useState<string | null>(null)
  const { products } = useContext(ProductsContext)
  const axiosPrivate = useAxiosPrivate()

  useEffect(() => {
    async function fetchPurchases() {
      try {
        const response = await axiosPrivate.get("/purchases")
        const purchasesWithPayableInfo: Payable[] = response.data.map((purchase: Payable) => ({
          ...purchase,
          status: purchase.status || "Em aberto",
          paymentDate: purchase.paymentDate || null,
          bank: purchase.bank || ""
        }))
        setPayables(purchasesWithPayableInfo)
      } catch (error) {
        console.error("Erro ao buscar compras:", error)
      }
    }
    fetchPurchases()
  }, [axiosPrivate])

  function handleStatusChange(id: string, newStatus: "Em aberto" | "Pago") {
    setPayables(prev =>
      prev.map(sale =>
        sale._id === id
          ? {
            ...sale,
            status: newStatus,
            paymentDate: newStatus === "Pago" ? new Date().toISOString() : null
          }
          : sale
      )
    )
    setModifiedId(id)
  }

  function handleBankChange(id: string, bank: string) {
    setPayables(prev =>
      prev.map(sale => (sale._id === id ? { ...sale, bank } : sale))
    )

    setModifiedId(id)
  }

  async function handleSave(id: string) {
    const saleToSave = payables.find(sale => sale._id === id)
    if (!saleToSave) return

    try {
      await axiosPrivate.patch(`/payables/${id}`, {
        status: saleToSave.status,
        paymentDate: saleToSave.paymentDate,
        bank: saleToSave.bank
      })
      setModifiedId(null)
    } catch (error) {
      console.error("Erro ao atualizar recebível:", error)
    }
  }


  return (
    <main className="p-6 overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4 text-emerald-700">Contas a Receber</h2>

      <table className="min-w-full bg-white border border-emerald-300 text-sm">
        <thead className="bg-emerald-50 text-emerald-700">
          <tr>
            <th className="p-2 border">Data da Compra</th>
            <th className="p-2 border">Nº Venda</th>
            <th className="p-2 border">Cliente</th>
            <th className="p-2 border">Produto(s)</th>
            <th className="p-2 border">Valor Total</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Data Pagamento</th>
            <th className="p-2 border">Banco</th>
            <th className="p-2 border">Ações</th>
          </tr>
        </thead>

        <tbody>
          {payables.map(purchase => (
            <tr key={purchase._id} className="text-center text-gray-800">
              <td className="p-2 border">{purchase.date}</td>

              <td className="p-2 border">{purchase.purchaseNumber}</td>

              <td className="p-2 border">{purchase.clientName}</td>

              <td className="p-2 border text-left">
                <ul className="space-y-2">
                  {purchase.items.map(item => {
                    const product = products.find(p => p.id === item.productId)
                    return (
                      <li key={item.productId}>
                        {item.productName} - R${item.price} - {item.quantity}(x)
                        {product?.description ? ` - ${product.description}` : ""}
                      </li>
                    )
                  })}
                </ul>
              </td>

              <td className="p-2 border">
                {purchase.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </td>

              <td className="p-2 border">
                <select
                  aria-label="Sale status"
                  className={`border rounded p-1 text-sm cursor-pointer ${purchase.status === "Pago" ? "bg-green-100 text-green-700 border-green-400" : ""
                    }`}
                  value={purchase.status}
                  onChange={e => handleStatusChange(purchase._id, e.target.value as "Em aberto" | "Pago")}
                >
                  <option value="Em aberto">Em aberto</option>
                  <option value="Pago">Pago</option>
                </select>
              </td>

              <td className="p-2 border">
                {purchase.paymentDate ? new Date(purchase.paymentDate).toLocaleDateString("pt-BR") : "--"}
              </td>

              <td className="p-2 border">
                <input
                  type="text"
                  value={purchase.bank}
                  onChange={e => handleBankChange(purchase._id, e.target.value)}
                  placeholder="Banco"
                  className="border rounded p-1 w-full text-sm"
                />
              </td>

              <td className="p-2 border">
                {modifiedId === purchase._id && (
                  <button
                    type="button"
                    onClick={() => handleSave(purchase._id)}
                    className="bg-emerald-600 cursor-pointer text-white px-2 py-1 rounded text-sm hover:bg-emerald-700"
                  >
                    Salvar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
