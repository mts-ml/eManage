import { useState } from "react"


interface Supplier {
  name: string
  company: string
  phone: string
  id?: number
}


export const Payables: React.FC = () => {
  const defaultValues = {
    name: "",
    company: "",
    phone: ""
  }

  const [form, setForm] = useState<Omit<Supplier, "id">>(defaultValues)
  const [errors, setErrors] = useState(defaultValues)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.currentTarget as {
      name: keyof Supplier
      value: string
    }

    const updatedForm = { ...form, [name]: value }
    setForm(updatedForm)

    const validateFields = formValidation(updatedForm)
    setErrors(validateFields)

    const allFilled = Object.values(updatedForm).every(field => field.trim() !== "")
    const noErrors = Object.values(validateFields).every(error => error === "")
    setIsReadyToSubmit(allFilled && noErrors)
  }

  function formValidation(form: Supplier) {
    const errors: Supplier = defaultValues

    if (!form.name.trim()) errors.name = "Campo obrigatório"
    if (!form.company.trim()) errors.company = "Campo obrigatório"

    const phoneRegex = /^\d{2}\d{9}$/ // formato 11912345678
    if (!form.phone.trim()) {
      errors.phone = "Campo obrigatório"
    } else if (!phoneRegex.test(form.phone)) {
      errors.phone = "Formato inválido (somente números com DDD)"
    }

    return errors
  }

  function formatPhone(phone: string) {
    return phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!isReadyToSubmit) return

    const newSupplier: Supplier = {
      ...form,
      id: Date.now()
    }

    setSuppliers(prev => [...prev, newSupplier])
    setForm(defaultValues)
    setErrors(defaultValues)
    setIsReadyToSubmit(false)
  }

  
  return (
    <main className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cadastro de Fornecedores</h2>

      <form onSubmit={handleSubmit} className="grid gap-4 mb-6">
        {/* Nome */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Nome do responsável"
            value={form.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
          {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
        </div>

        {/* Empresa */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700">Empresa</label>
          <input
            type="text"
            id="company"
            name="company"
            placeholder="Nome da empresa"
            value={form.company}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
          {errors.company && <div className="text-red-600 text-sm mt-1">{errors.company}</div>}
        </div>

        {/* Telefone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="Apenas números, ex: 11912345678"
            value={form.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
          {errors.phone && <div className="text-red-600 text-sm mt-1">{errors.phone}</div>}
        </div>

        <button
          type="submit"
          disabled={!isReadyToSubmit}
          className="bg-emerald-600 text-white py-2 px-4 rounded-md transition hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Salvar Fornecedor
        </button>
      </form>

      <h3 className="text-lg font-semibold mb-2">Lista de Fornecedores</h3>
      <ul className="list-disc pl-6 text-gray-800 text-sm">
        {suppliers.map(s => (
          <li key={s.id} className="mb-1">
            <span className="font-semibold text-green-800">Nome:</span> {s.name} |{" "}
            <span className="font-semibold text-green-800">Empresa:</span> {s.company} |{" "}
            <span className="font-semibold text-green-800">Telefone:</span> {formatPhone(s.phone)}
          </li>
        ))}
      </ul>
    </main>
  )
}
