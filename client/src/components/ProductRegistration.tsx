import { useState } from "react"


interface Product {
    name: string
    description: string
    price: string
    id?: number
}


export const ProductsRegistration: React.FC = () => {
    const defaultValues = {
        name: "",
        description: "",
        price: ""
    }

    const [form, setForm] = useState<Omit<Product, "id">>(defaultValues)
    const [errors, setErrors] = useState(defaultValues)
    const [products, setProducts] = useState<Product[]>([])
    const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)


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

        const allFieldsFilled = Object.values(updatedForm).every(field => field.trim() !== "")
        const noErrors = Object.values(validateFields).every(error => error === "")
        setIsReadyToSubmit(allFieldsFilled && noErrors)
    }

    function formValidation(form: Product) {
        const errors: Product = { name: "", description: "", price: "" }

        if (!form.name.trim()) errors.name = "Campo obrigatório"
        if (!form.description.trim()) errors.description = "Campo obrigatório"

        if (!form.price.trim()) {
            errors.price = "Campo obrigatório"
        } else if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
            errors.price = "Preço inválido"
        }

        return errors
    }

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        if (!isReadyToSubmit) return

        const newProduct: Product = {
            ...form,
            id: Date.now()
        }
        setProducts(prev => [...prev, newProduct])
        setForm(defaultValues)
        setErrors(defaultValues)
        setIsReadyToSubmit(false)
    }

    return (
        <main className="p-6 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Cadastro de Produtos</h2>

            <form onSubmit={handleSubmit} className="grid gap-4 mb-6" aria-label="Formulário de cadastro de produtos">

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
                        <div id="nameError" className="text-red-600 text-sm mt-1" aria-live="polite">{errors.name}</div>
                    )}
                </div>


                {/* Descrição */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea
                        id="description"
                        name="description"
                        placeholder="Descrição do produto"
                        value={form.description}
                        onChange={handleChange}
                        aria-describedby="descriptionError"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        rows={3}
                    />

                    {errors.description && (
                        <div id="descriptionError" className="text-red-600 text-sm mt-1" aria-live="polite">{errors.description}</div>
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
                        <div id="priceError" className="text-red-600 text-sm mt-1" aria-live="polite">{errors.price}</div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!isReadyToSubmit}
                    className="bg-emerald-600 text-white py-2 px-4 rounded-md transition hover:bg-emerald-700 disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed cursor-pointer"
                >
                    Salvar Produto
                </button>
            </form>

            <h3 className="text-lg font-semibold mb-2">Lista de Produtos</h3>

            <ul className="list-disc pl-6 text-gray-800 text-sm">
                {products.map(product => (
                    <li key={product.id} className="mb-1">
                        <span className="font-semibold text-green-800">Nome:</span> {product.name} |{" "}
                        <span className="font-semibold text-green-800">Descrição:</span> {product.description} |{" "}
                        <span className="font-semibold text-green-800">Preço:</span> R${Number(product.price).toFixed(2).replace(".", ",")}
                    </li>
                ))}
            </ul>
        </main>
    )
}

