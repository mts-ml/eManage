import { useContext, useState } from "react"
import { X } from "lucide-react"


import ProductsContext from "../Context/ProductsContext"
import ClientsContext from "../Context/ClientsContext"
import type { Product } from "../types/types"
// import { useAxiosPrivate } from "../hooks/useAxiosPrivate"


interface CartItem extends Product {
    quantity: number
}

export const SalesRegistration: React.FC = () => {
    const { clients } = useContext(ClientsContext)
    const { products } = useContext(ProductsContext)

    const [cart, setCart] = useState<CartItem[]>([])
    // const [saleNumber, setSaleNumber] = useState<number>(1)
    const [selectedClientId, setSelectedClientId] = useState<string>("")
    const [selectedProductId, setSelectedProductId] = useState<string>("")
    const [quantity, setQuantity] = useState<number>(1)
    // const axiosPrivate = useAxiosPrivate()

    const today = new Date().toLocaleDateString("pt-BR")
    const selectedProduct = products.find(p => p.id === selectedProductId)
    const selectedClient = clients.find(c => c.id === selectedClientId)


    function handleAddToCart(product: Product, quantity: number) {
        setCart(prev => {
            const existingProduct = prev.find(item => item.id === product.id)
            if (existingProduct) {
                return prev.map(item =>
                    item.id === product.id
                        ? {
                            ...item,
                            quantity: Math.min(item.quantity + quantity, Number(product.stock))
                        }
                        : item
                )
            } else {
                return [...prev, { ...product, quantity }]
            }
        })

        setSelectedProductId("")
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

    // async function submitSale() {
    //     const salePayload: SalePayload = {
    //         clientId: selectedClientId,
    //         saleNumber,
    //         date: today,
    //         items: cart
    //             .map(item => ({
    //                 productId: item.id!,
    //                 quantity: item.quantity,
    //                 price: Number(item.price)
    //             }),
    //             ),
    //         total
    //     }

    //     try {
    //         const response = await axiosPrivate.post('/sales', salePayload)

    //     } catch (error) {
    //         console.error(error)
    //         alert('Erro ao finalizar a venda.')
    //     }

    //     alert("Venda finalizada com sucesso")
    //     setSaleNumber(prev => prev + 1)
    //     setCart([])
    //     setSelectedClientId("")
    //     setSelectedProductId("")
    //     setQuantity(1)
    // }

    const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)


    return (
        <main className="p-6 max-w-3xl mx-auto">

            <h2 className="text-2xl font-bold mb-8 text-center">
                Vendas
            </h2>

            {/* Selecionar cliente e produto */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <div className="text-lg font-medium">
                        {/* Venda Nº {saleNumber} */}
                    </div>

                    <div className="text-sm text-gray-600">
                        Data: {today}
                    </div>
                </div>

                <div className="mb-6">
                    <label htmlFor="client" className="block text-sm font-medium mb-1">
                        Cliente
                    </label>

                    <select
                        id="client"
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                        className="w-full border cursor-pointer border-gray-300 rounded-md p-2"
                    >
                        <option value="">Selecione um cliente</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <label htmlFor="product" className="block text-sm font-medium mb-1">
                        Produto
                    </label>

                    <select
                        id="product"
                        value={selectedProductId}
                        onChange={e => setSelectedProductId(e.target.value)}
                        className="w-full border cursor-pointer border-gray-300 rounded-md p-2"
                    >
                        <option value="">Selecione um produto</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {selectedProduct && selectedClient && (
                <section className="mb-8 border rounded-md p-4 bg-gray-50">
                    <div>
                        <div className="flex items-center justify-between">
                            <p className="mb-2">Cliente: <strong>{selectedClient.name}</strong></p>

                            <button
                                type="button"
                                aria-label="Fechar aba de venda."
                            >
                                <X
                                    onClick={() => {
                                        setSelectedProductId("")
                                        setSelectedClientId("")
                                    }}
                                    className="w-5 h-5 text-gray-500 hover:cursor-pointer hover:text-black" />
                            </button>
                        </div>

                        <p className="mb-2">
                            Produto: <strong>{selectedProduct.name}</strong>
                        </p>

                        <p className="text-sm text-gray-600 mb-2">
                            Preço: <strong>R${Number(selectedProduct.price).toFixed(2).replace(".", ",")}</strong>
                        </p>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        Estoque disponível: <strong>{selectedProduct.stock} {selectedProduct.description}</strong>
                    </p>

                    <div className="flex gap-2 items-center">
                        <label htmlFor="quantity" className="text-sm">
                            Quantidade:
                        </label>

                        <input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(Math.max(1, Math.min(Number(e.target.value), Number(selectedProduct.stock))))}
                            className="w-24 border border-gray-300 rounded-md p-1"
                            min={1}
                            max={Number(selectedProduct.stock)}
                        />

                        <button
                            onClick={() => handleAddToCart(selectedProduct, quantity)}
                            className="bg-emerald-600 cursor-pointer text-white px-4 py-1.5 rounded hover:bg-emerald-700"
                        >
                            Adicionar ao Carrinho
                        </button>
                    </div>

                </section>
            )}


            {selectedClientId && cart.length > 0 && (
                <>
                    <h3 className="text-lg font-semibold mb-2">
                        Carrinho
                    </h3>

                    <p className="text-sm text-gray-600 mb-4">
                        Cliente: <span className="font-medium">{selectedClient?.name}</span>
                    </p>

                    <div className="mb-6">
                        {cart.map(item => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center border-b py-2"
                            >
                                <div>
                                    <p className="font-medium">
                                        {item.name}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        R${Number(item.price).toFixed(2).replace(".", ",")} x {item.quantity}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleQuantityChange(item.id!, -1)}
                                        className="px-2 py-1 cursor-pointer border rounded hover:bg-black/30"
                                    >
                                        -
                                    </button>

                                    <span>
                                        {item.quantity}
                                    </span>

                                    <button
                                        onClick={() => handleQuantityChange(item.id!, 1)}
                                        className="px-2 cursor-pointer py-1 border rounded hover:bg-black/30"
                                    >
                                        +
                                    </button>

                                    <button
                                        onClick={() => handleRemoveItem(item.id!)}
                                        className="ml-4 cursor-pointer text-red-600 hover:text-red-800"
                                    >
                                        Remover
                                    </button>
                                </div>
                            </div>
                        ))}

                        <p className="text-right font-semibold mt-4">
                            Total: R${total.toFixed(2).replace(".", ",")}
                        </p>

                        <button
                            type="button"
                            className="bg-emerald-600 block mx-auto mt-6 cursor-pointer text-white px-6 py-2 rounded hover:bg-emerald-700"
                            // onClick={() => submitSale()}
                        >
                            Finalizar Compra
                        </button>
                    </div>
                </>
            )}

        </main>
    )
}
