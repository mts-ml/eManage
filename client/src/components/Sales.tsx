import { useContext, useEffect, useState } from "react"
import { X } from "lucide-react"
import { FaSearch } from 'react-icons/fa'
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
    const [customPrice, setCustomPrice] = useState<string>("")
    const [clientSearchTerm, setClientSearchTerm] = useState<string>("")
    const [productSearchTerm, setProductSearchTerm] = useState<string>("")
    const axiosPrivate = useAxiosPrivate()

    // Filtrar clientes baseado no termo de busca
    const filteredClients = clients.filter(client => {
        if (!clientSearchTerm.trim()) return true
        return client.name.toLowerCase().includes(clientSearchTerm.toLowerCase().trim())
    })

    // Filtrar produtos baseado no termo de busca
    const filteredProducts = products.filter(product => {
        if (!productSearchTerm.trim()) return true
        return product.name.toLowerCase().includes(productSearchTerm.toLowerCase().trim())
    })

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

            // Usar preço customizado se fornecido, senão usar o preço padrão
            const finalPrice = customPrice && !isNaN(Number(customPrice)) && Number(customPrice) > 0
                ? customPrice
                : product.salePrice

            if (quantity <= maxAddable && quantity >= 1) {
                setSelectedProductId("")
                setCustomPrice("") // Limpar preço customizado
            }

            if (existingProduct) {
                return prev.map(item =>
                    item.id === product.id
                        ? {
                            ...item,
                            quantity: item.quantity + quantity,
                            salePrice: finalPrice // Atualizar preço se necessário
                        }
                        : item
                )
            } else {
                return [...prev, { ...product, quantity, salePrice: finalPrice }]
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

                        {/* Input de busca para clientes */}
                        <div className="relative mb-2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="h-4 w-4 text-gray-400" />
                            </div>

                            <input
                                type="text"
                                placeholder="Buscar cliente por nome..."
                                value={clientSearchTerm}
                                onChange={(e) => setClientSearchTerm(e.currentTarget.value)}
                                className="block w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm"
                            />
                        </div>

                        <select
                            id="client"
                            value={selectedClientId}
                            onChange={e => setSelectedClientId(e.target.value)}
                            className="w-full border-2 border-gray-200 cursor-pointer rounded-xl p-3 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Selecione um cliente</option>
                            {filteredClients.map(client => (
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

                        {/* Input de busca para produtos */}
                        <div className="relative mb-2">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="h-4 w-4 text-gray-400" />
                            </div>

                            <input
                                type="text"
                                placeholder="Buscar produto por nome..."
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.currentTarget.value)}
                                className="block w-full pl-10 pr-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm"
                            />
                        </div>

                        <select
                            id="product"
                            value={selectedProductId}
                            onChange={e => setSelectedProductId(e.target.value)}
                            className="w-full border-2 border-gray-200 cursor-pointer rounded-xl p-3 transition-all duration-300 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Selecione um produto</option>
                            {filteredProducts.map(product => (
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-emerald-50/50 p-4 rounded-xl">
                                <p className="text-sm font-medium text-gray-600 mb-1">Preço Padrão</p>

                                <p className="text-lg font-bold text-emerald-700">
                                    R$ {Number(selectedProduct.salePrice).toFixed(2).replace(".", ",")}
                                </p>
                            </div>

                            <div className="bg-yellow-50/50 p-4 rounded-xl">
                                <p className="text-sm font-medium text-gray-600 mb-1">Preço Customizado</p>

                                <div className="flex items-center gap-2">
                                    <label htmlFor="customPrice" className="sr-only">Preço Customizado</label>
                                    <input
                                        id="customPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        onChange={e => setCustomPrice(e.currentTarget.value)}
                                        value={customPrice}
                                        placeholder={selectedProduct.salePrice}
                                        className="w-full border-2 border-gray-200 rounded-lg p-2 text-center font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                <p className="text-xs text-gray-500 mt-1">
                                    Deixe vazio para usar o preço padrão
                                </p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl">
                                <p className="text-sm font-medium text-gray-600 mb-2">Estoque Disponível</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 text-sm font-bold">📦</span>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-blue-700">
                                                {selectedProduct.stock}
                                            </p>

                                            <p className="text-xs text-blue-600 font-medium">unidades</p>
                                        </div>
                                    </div>
                                    {selectedProduct.description && selectedProduct.description.trim() !== "" && (
                                        <div className="text-right">
                                            <p className="text-xs text-blue-600 font-medium mb-1">Descrição</p>

                                            <p className="text-xs text-blue-700 italic max-w-[120px] truncate">
                                                {selectedProduct.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
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
                            type="button"
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
                                className="border-2 border-emerald-100 rounded-xl p-6 bg-gradient-to-r from-emerald-50/50 to-green-50/50 hover:from-emerald-50/70 hover:to-green-50/70 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    {/* Informações do produto */}
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <span className="text-emerald-600 text-xl">📦</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-emerald-800 text-lg mb-1 truncate">
                                                    {item.name}
                                                </h4>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="font-medium">Preço:</span>
                                                        <span className="font-semibold text-emerald-700">
                                                            {Number(item.salePrice).toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL"
                                                            })}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="font-medium">Quantidade:</span>
                                                        <span className="font-semibold text-emerald-700">
                                                            {Number(item.quantity).toLocaleString("pt-BR")}(x)
                                                        </span>
                                                    </div>

                                                    {item.description && item.description.trim() !== "" && (
                                                        <div className="flex items-start gap-2 text-sm text-gray-600">
                                                            <span className="font-medium mt-0.5">Descrição:</span>
                                                            <span className="italic text-gray-700 bg-gray-50 px-2 py-1 rounded-md">
                                                                {item.description}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-medium text-gray-600">Subtotal:</span>
                                                        <span className="font-bold text-emerald-800 text-base">
                                                            {(Number(item.salePrice) * Number(item.quantity)).toLocaleString("pt-BR", {
                                                                style: "currency",
                                                                currency: "BRL"
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controles de quantidade e remoção */}
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="flex items-center gap-2 bg-white rounded-lg p-3 border-2 border-emerald-200 shadow-sm">
                                            <button
                                                onClick={() => handleQuantityChange(item.id!, -1)}
                                                className="w-10 h-10 flex items-center justify-center cursor-pointer border border-emerald-300 rounded-lg hover:bg-emerald-100/50 transition-all duration-200 font-bold text-emerald-700 hover:scale-105"
                                                aria-label="Diminuir quantidade"
                                            >
                                                -
                                            </button>

                                            <span className="font-bold text-emerald-800 min-w-[3rem] text-center text-lg">
                                                {Number(item.quantity).toLocaleString("pt-BR")}
                                            </span>

                                            <button
                                                onClick={() => handleQuantityChange(item.id!, 1)}
                                                className="w-10 h-10 flex items-center justify-center cursor-pointer border border-emerald-300 rounded-lg hover:bg-emerald-100/50 transition-all duration-200 font-bold text-emerald-700 hover:scale-105"
                                                aria-label="Aumentar quantidade"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleRemoveItem(item.id!)}
                                            className="text-red-600 hover:text-red-800 p-3 rounded-lg hover:bg-red-50 transition-all duration-200 font-semibold border-2 border-red-200 hover:border-red-300 cursor-pointer"
                                        >
                                            🗑️ Remover
                                        </button>
                                    </div>
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
                <div className="border-2 border-emerald-200/50 rounded-2xl p-8 bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-sm shadow-xl">
                    {/* Header com ícone e título */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                            <span className="text-3xl">✅</span>
                        </div>
                        <h3 className="text-3xl font-bold text-emerald-800 mb-2">
                            Venda Finalizada com Sucesso!
                        </h3>
                        <p className="text-emerald-600 font-medium">Detalhes da transação</p>
                    </div>

                    {/* Informações principais */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-2">
                                <span className="text-emerald-600 mr-2">📋</span>
                                <p className="text-sm font-medium text-gray-600">Número da Venda</p>
                            </div>
                            <p className="text-2xl font-bold text-emerald-700">#{lastSale.saleNumber}</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-2">
                                <span className="text-emerald-600 mr-2">👤</span>
                                <p className="text-sm font-medium text-gray-600">Cliente</p>
                            </div>
                            <p className="text-xl font-bold text-emerald-700 truncate">{lastSale.clientName}</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-2">
                                <span className="text-emerald-600 mr-2">📅</span>
                                <p className="text-sm font-medium text-gray-600">Data</p>
                            </div>
                            <p className="text-xl font-bold text-emerald-700">{lastSale.date}</p>
                        </div>
                    </div>

                    {/* Tabela de itens */}
                    <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
                            <h4 className="font-semibold text-white text-lg flex items-center">
                                <span className="mr-2">🛍️</span>
                                Itens da Venda
                            </h4>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-emerald-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                                            Produto
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-emerald-700 uppercase tracking-wider">
                                            Quantidade
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-emerald-700 uppercase tracking-wider">
                                            Preço Unit.
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-emerald-700 uppercase tracking-wider">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-100">
                                    {lastSale.items.map((item, index) => (
                                        <tr key={index} className="hover:bg-emerald-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-emerald-600 text-sm font-semibold">
                                                            {index + 1}
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-900 font-medium">{item.productName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                                                    {item.quantity}x
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-gray-700 font-medium">
                                                    {Number(item.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-emerald-700 font-bold">
                                                    {(Number(item.price) * item.quantity).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Total */}
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-t border-emerald-200">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-emerald-800">Total da Venda:</span>
                                <span className="text-2xl font-bold text-emerald-700">
                                    {lastSale.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
