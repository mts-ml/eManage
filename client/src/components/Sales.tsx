import { useContext, useEffect, useState } from "react"
import { X } from "lucide-react"
import type { AxiosResponse } from "axios"


import ProductsContext from "../Context/ProductsContext"
import ClientContext from "../Context/ClientContext"
import type { Product, ItemPayload, SaleResponse } from "../types/types"
import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


interface CartItem extends Product {
    quantity: number
}

export const Sales: React.FC = () => {
    const { clients } = useContext(ClientContext)
    const { products, setProducts } = useContext(ProductsContext)

    const [cart, setCart] = useState<CartItem[]>([])
    const [lastSale, setLastSale] = useState<SaleResponse["sale"] | null>(null)
    const [selectedClientId, setSelectedClientId] = useState<string>("")
    const [selectedProductId, setSelectedProductId] = useState<string>("")
    const [quantity, setQuantity] = useState<number>(0)
    const axiosPrivate = useAxiosPrivate()

    const today = new Date().toLocaleDateString("pt-BR")
    const selectedProduct = products.find(p => p.id === selectedProductId)
    const selectedClient = clients.find(c => c.id === selectedClientId)
    const total = cart.reduce((sum, item) => sum + Number(item.salePrice) * item.quantity, 0)

    useEffect(() => {
        async function getLastSale() {
            try {
                const response = await axiosPrivate.get('/sales/last')
                setLastSale(response.data.sale)
            } catch (error) {
                console.log("Erro ao buscar a última venda:", error)
                return
            }
        }

        getLastSale()
    }, [])

    function handleAddToCart(product: Product, quantity: number) {
        setCart(prev => {
            const existingProduct = prev.find(item => item.id === product.id)
            const currentQuantity = existingProduct ? existingProduct.quantity : 0
            const maxAddable = Number(product.stock) - currentQuantity

            if (quantity > maxAddable) {
                alert(`Quantidade excede o estoque disponível (${product.stock}).`)
                return prev
            }
            if (quantity < 1) {
                alert("A quantidade deve ser pelo menos 1.")
                return prev
            }
            if (quantity <= maxAddable && quantity >= 1) {
                setSelectedProductId("")
            }

            if (existingProduct) {
                return prev.map(item =>
                    item.id === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + quantity
                        }
                        : item
                )
            } else {
                return [...prev, { ...product, quantity }]
            }

        })

        setQuantity(1)
    }

    function handleQuantityChange(id: string, delta: number) {
        setCart(prev =>
            prev.map(item =>
                item.id === id
                    ? {
                        ...item,
                        quantity: Math.max(1, Math.min(item.quantity + delta, Number(item.stock)))
                    }
                    : item
            )
        )
    }

    function handleRemoveItem(id: string) {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    async function submitSale() {
        const salePayload: ItemPayload = {
            clientId: selectedClientId,
            clientName: selectedClient?.name || "Cliente Desconhecido",
            date: today,
            items: cart
                .map(item => ({
                    productId: item.id!,
                    productName: item.name,
                    quantity: item.quantity,
                    price: Number(item.salePrice)
                }),
                ),
            total,
        }

        if (!selectedClientId || cart.length === 0) {
            alert("Selecione um cliente e adicione produtos ao carrinho.")
            return
        }

        try {
            const response: AxiosResponse<SaleResponse> = await axiosPrivate.post('/sales', salePayload)

            const { sale, updatedProducts } = response.data

            setProducts((prev: Product[]) =>
                prev.map(product => {
                    const updatedProduct = updatedProducts.find(p => p.id === product.id)

                    return updatedProduct ? { ...product, stock: updatedProduct.stock } : product
                })
            )

            setLastSale(sale)
        } catch (error) {
            console.error(error)
            alert('Erro ao finalizar a venda.')
            return
        }

        alert("Venda finalizada com sucesso")
        setCart([])
        setSelectedClientId("")
        setSelectedProductId("")
        setQuantity(1)
    }


    return (
        <main className="p-8 max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 mb-2">
                    🛒 Vendas
                </h2>
                <p className="text-gray-600 font-medium">Gerencie suas vendas de forma eficiente</p>
            </div>

            {/* Selecionar cliente e produto */}
            <section className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-white/90 backdrop-blur-sm shadow-xl mb-8">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-xl font-semibold text-emerald-800">
                        Venda Nº {lastSale ? lastSale.saleNumber + 1 : '-'}
                    </p>

                                            <div className="text-sm text-gray-600 bg-emerald-50/50 px-4 py-2 rounded-lg">
                        Data: {today}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="client" className="block text-sm font-semibold text-gray-700 mb-2">
                            Cliente <span className="text-red-500">*</span>
                        </label>

                        <select
                            id="client"
                            value={selectedClientId}
                            onChange={e => setSelectedClientId(e.target.value)}
                            className="w-full border-2 border-gray-200 cursor-pointer rounded-xl p-3 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Selecione um cliente</option>
                            {clients.map(client => (
                                <option
                                    key={client.id}
                                    value={client.id}
                                >
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="product" className="block text-sm font-semibold text-gray-700 mb-2">
                            Produto <span className="text-red-500">*</span>
                        </label>

                        <select
                            id="product"
                            value={selectedProductId}
                            onChange={e => setSelectedProductId(e.target.value)}
                            className="w-full border-2 border-gray-200 cursor-pointer rounded-xl p-3 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Selecione um produto</option>
                            {products.map(product => (
                                <option
                                    key={product.id}
                                    value={product.id}
                                >
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {selectedProduct && selectedClient && (
                <section className="mb-8 border-2 border-emerald-200/50 rounded-2xl p-6 bg-white/90 backdrop-blur-sm shadow-xl">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-lg font-semibold text-emerald-800 mb-2">
                                    Cliente: <span className="text-emerald-600">{selectedClient.name}</span>
                                </p>
                                <p className="text-lg font-semibold text-emerald-800">
                                    Produto: <span className="text-emerald-600">{selectedProduct.name}</span>
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedProductId("")
                                    setSelectedClientId("")
                                }}
                                className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                aria-label="Fechar aba de venda."
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-emerald-50/50 p-4 rounded-xl">
                                <p className="text-sm font-medium text-gray-600 mb-1">Preço Unitário</p>
                                <p className="text-lg font-bold text-emerald-700">
                                    R$ {Number(selectedProduct.salePrice).toFixed(2).replace(".", ",")}
                                </p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl">
                                <p className="text-sm font-medium text-gray-600 mb-1">Estoque Disponível</p>
                                <p className="text-lg font-bold text-blue-700">
                                    {selectedProduct.stock} {selectedProduct.description}
                                </p>
                            </div>

                            <div className="bg-green-50/50 p-4 rounded-xl">
                                <p className="text-sm font-medium text-gray-600 mb-1">Quantidade</p>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="quantity" className="sr-only">Quantidade</label>
                                    <input
                                        id="quantity"
                                        type="number"
                                        onChange={e => setQuantity(Number(e.currentTarget.value))}
                                        value={quantity}
                                        min={1}
                                        max={selectedProduct.stock}
                                        placeholder="Qtd"
                                        className="w-20 border-2 border-gray-200 rounded-lg p-2 text-center font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleAddToCart(selectedProduct, quantity)}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            ➕ Adicionar ao Carrinho
                        </button>
                    </div>
                </section>
            )}

            {selectedClientId && cart.length > 0 && (
                <div className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-white/90 backdrop-blur-sm shadow-xl mb-8">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-emerald-800 mb-2">
                            🛒 Carrinho
                        </h3>
                        <p className="text-gray-600 font-medium">
                            Cliente: <span className="font-semibold text-emerald-700">{selectedClient?.name}</span>
                        </p>
                    </div>

                    <div className="space-y-4 mb-6">
                        {cart.map(item => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center border-2 border-emerald-100 rounded-xl p-4 bg-emerald-50/50 hover:bg-emerald-50/70 transition-all duration-200"
                            >
                                <div className="flex-1">
                                    <p className="font-semibold text-emerald-800 text-lg">
                                        {item.name}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {Number(item.salePrice).toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL"
                                        })} - {Number(item.quantity).toLocaleString("pt-BR")}x {item.description}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 border-2 border-emerald-200">
                                        <button
                                            onClick={() => handleQuantityChange(item.id!, -1)}
                                            className="w-8 h-8 flex items-center justify-center cursor-pointer border border-emerald-300 rounded-lg hover:bg-emerald-100/50 transition-all duration-200 font-bold text-emerald-700"
                                            aria-label="Diminuir quantidade"
                                        >
                                            -
                                        </button>

                                        <span className="font-semibold text-emerald-800 min-w-[2rem] text-center">
                                            {Number(item.quantity).toLocaleString("pt-BR")}
                                        </span>

                                        <button
                                            onClick={() => handleQuantityChange(item.id!, 1)}
                                            className="w-8 h-8 flex items-center justify-center cursor-pointer border border-emerald-300 rounded-lg hover:bg-emerald-100/50 transition-all duration-200 font-bold text-emerald-700"
                                            aria-label="Aumentar quantidade"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleRemoveItem(item.id!)}
                                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200 font-semibold"
                                    >
                                        ❌ Remover
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-800 mb-6">
                            Total: {Number(total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>

                        <button
                            type="button"
                            className="bg-gradient-to-r from-emerald-600 to-green-600 cursor-pointer text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
                            onClick={submitSale}
                        >
                            💳 Finalizar Venda
                        </button>
                    </div>
                </div>
            )}

            {lastSale && !selectedClientId && (
                <div className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-emerald-50/50 backdrop-blur-sm shadow-xl">
                    <h3 className="text-2xl font-bold text-center mb-8 text-emerald-800">
                        ✅ Venda Finalizada com Sucesso!
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-xl border border-emerald-200">
                            <p className="text-sm font-medium text-gray-600 mb-1">Número da Venda</p>

                            <p className="text-lg font-bold text-emerald-700">#{lastSale.saleNumber}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-emerald-200">
                            <p className="text-sm font-medium text-gray-600 mb-1">Cliente</p>

                            <p className="text-lg font-bold text-emerald-700">{lastSale.clientName}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-emerald-200">
                            <p className="text-sm font-medium text-gray-600 mb-1">Data</p>

                            <p className="text-lg font-bold text-emerald-700">{lastSale.date}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-emerald-200">
                        <h4 className="font-semibold text-emerald-800 mb-3">Itens da Venda:</h4>
                        
                        <ul className="space-y-2">
                            {lastSale.items.map((item, index) => (
                                <li key={index} className="flex justify-between items-center py-2 border-b border-emerald-100 last:border-b-0">
                                    <span className="text-gray-700">{item.productName}</span>
                                    <span className="text-emerald-700 font-semibold">
                                        {item.quantity}x - {Number(item.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4 pt-4 border-t border-emerald-200">
                            <p className="text-xl font-bold text-emerald-800 text-right">
                                Total: {lastSale.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
