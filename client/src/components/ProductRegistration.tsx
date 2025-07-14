import { useState } from "react"
import { axiosPrivate } from "../api/axios"


interface Product {
    id?: number
    name: string
    description: string
    price: string
    stock: string
}


export const ProductsRegistration: React.FC = () => {
    const defaultValues = {
        name: "",
        description: "",
        price: "",
        stock: ""
    }

    const [form, setForm] = useState<Product>(defaultValues)
    const [errors, setErrors] = useState<Product>(defaultValues)
    const [products, setProducts] = useState<Product[]>([])
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)
    const [editingProductId, setEditingProductId] = useState<number | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [showForm, setShowForm] = useState<boolean>(false)


    function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = event.currentTarget as {
            name: keyof Product,
            value: string
        }

        const formattedValue = name === "price" ? value.replace(',', '.') : value

        const updatedForm = { ...form, [name]: formattedValue }
        setForm(updatedForm)

        const validateFields = formValidation(updatedForm)
        setErrors(validateFields)

        const allFieldsFilled = Object.values(updatedForm).every(field => String(field).trim() !== "")
        const noErrors = Object.values(validateFields).every(error => error === "")
        setIsReadyToSubmit(allFieldsFilled && noErrors)
    }

    function formValidation(form: Product) {
        const errors: Product = defaultValues

        if (!form.name.trim()) errors.name = "Campo obrigatório"
        if (!form.description.trim()) errors.description = "Campo obrigatório"

        if (!form.price.trim()) {
            errors.price = "Campo obrigatório"
        } else if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
            errors.price = "Preço inválido"
        }
        if (!form.stock.trim()) {
            errors.stock = "Campo obrigatório"
        } else if (!/^\d+$/.test(form.stock) || Number(form.stock) < 0) {
            errors.stock = "Estoque inválido"
        }


        return errors
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        if (!isReadyToSubmit) return

        try {
            if (editingProductId) {
                const response = await axiosPrivate.put(`/products/${editingProductId}`, form)
                const updatedProduct: Product = { ...response.data, id: response.data._id }

                setProducts(prev =>
                    prev.map(product => product.id === editingProductId ? updatedProduct : product)
                )
                setEditingProductId(null)
            } else {
                const response = await axiosPrivate.post('/products', form)
                const newProduct: Product = { ...response.data, id: response.data._id }

                setProducts(prev => [...prev, newProduct])
            }
        } catch (error) {
            console.log(error)
            setErrorMessage("Erro inesperado. Tente novamente mais tarde.")
        }

        setForm(defaultValues)
        setErrors(defaultValues)
        setIsReadyToSubmit(false)
    }

    return (
        <main className="p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Cadastro de Produtos</h2>

            {!showForm && (
                <div className="text-center mb-6">
                    <button
                        onClick={() => {
                            setForm(defaultValues)
                            setEditingProductId(null)
                            setShowForm(true)
                            setErrors(defaultValues)
                        }}
                        className="bg-emerald-600 cursor-pointer text-white px-4 py-2 rounded-md hover:bg-emerald-700"
                    >
                        Novo Produto
                    </button>
                </div>
            )}


            {showForm && (
                <section className="border rounded-lg p-6 bg-gray-50 shadow-sm">
                    <form
                        onSubmit={handleSubmit}
                        className="grid gap-4 mb-6"
                        aria-label="Formulário de cadastro de produtos"
                    >

                        {/* Nome */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>

                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Nome do produto"
                                value={form.name}
                                onChange={handleChange}
                                aria-describedby="nameError"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            {errors.name && (
                                <div
                                    id="nameError"
                                    aria-live="polite"
                                    className="text-red-600 text-sm mt-1"
                                >
                                    {errors.name}
                                </div>
                            )}
                        </div>

                        {/* Descrição */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Descrição do produto, g ou kg."
                                value={form.description}
                                onChange={handleChange}
                                aria-describedby="descriptionError"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                                rows={3}
                            />

                            {errors.description && (
                                <div
                                    id="descriptionError"
                                    aria-live="polite"
                                    className="text-red-600 text-sm mt-1"
                                >
                                    {errors.description}
                                </div>
                            )}
                        </div>

                        {/* Preço */}
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço</label>

                            <input
                                type="text"
                                id="price"
                                name="price"
                                placeholder="0.00"
                                value={form.price}
                                onChange={handleChange}
                                aria-describedby="priceError"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                            />

                            {errors.price && (
                                <div
                                    id="priceError"
                                    aria-live="polite"
                                    className="text-red-600 text-sm mt-1"
                                >
                                    {errors.price}
                                </div>
                            )}
                        </div>

                        {/* Estoque */}
                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Estoque</label>
                            <input
                                type="text"
                                id="stock"
                                name="stock"
                                placeholder="0.00"
                                value={form.stock}
                                onChange={handleChange}
                                aria-describedby="stockError"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            {errors.stock && (
                                <div
                                    id="stockError"
                                    className="text-red-600 text-sm mt-1"
                                    aria-live="polite"
                                >
                                    {errors.stock}
                                </div>
                            )}
                        </div>
                    </form>


                    <div className="flex gap-4 justify-center items-center mx-auto">
                        <button
                            type="button"
                            onClick={() => {
                                setForm(defaultValues)
                                setEditingProductId(null)
                                setShowForm(false)
                                setErrors(defaultValues)
                            }}
                            className="px-4 py-2 cursor-pointer border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={!isReadyToSubmit}
                            className={`px-4 py-2 rounded-md transition ${isReadyToSubmit ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer" : "bg-gray-400 text-gray-200 cursor-not-allowed"}`}
                        >
                            {editingProductId ? "Atualizar" : "Salvar"} Cliente
                        </button>

                        {errorMessage && (
                            <div
                                id="stockError"
                                className="text-red-600 text-sm mt-1"
                                aria-live="polite"
                            >
                                {errorMessage}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {products.length > 0 && (
                <>
                    <h3 className="text-lg font-semibold mb-2">Lista de Produtos</h3>

                    <table className="w-full border-collapse border text-center border-gray-300 text-sm">
                        <thead className="bg-emerald-600 text-white">
                            <tr>
                                <th className="p-2 border">Nome</th>
                                <th className="p-2 border">Preço</th>
                                <th className="p-2 border">Estoque</th>
                                <th className="p-2 border">Descrição</th>
                            </tr>
                        </thead>

                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} className="odd:bg-white even:bg-gray-100">
                                    <td className="p-2 border">{product.name}</td>
                                    <td className="p-2 border">R${Number(product.price).toFixed(2).replace('.', ',')}</td>
                                    <td className="p-2 border">{product.stock}</td>
                                    <td className="p-2 border">{product.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </main>
    )
}
