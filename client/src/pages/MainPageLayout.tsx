import { useState } from "react"
import { Users, Package, Factory, X } from "lucide-react"

import { ClientsRegistration } from "../components/ClientsRegistration"
import { ProductsRegistration } from "../components/ProductRegistration"
import { SuppliersRegistration } from "../components/SuppliersRegistration"


type SectionKey = "clients" | "products" | "suppliers"

type SectionConfig = {
    section: SectionKey
    label: string
    icon: React.ReactNode
    component: React.ReactNode
}

const sections: SectionConfig[] = [
    {
        section: "clients",
        label: "Clientes",
        icon: <Users className="h-8 w-8 mb-2" />,
        component: <ClientsRegistration />
    },
    {
        section: "products",
        label: "Produtos",
        icon: <Package className="h-8 w-8 mb-2" />,
        component: <ProductsRegistration />
    },
    {
        section: "suppliers",
        label: "Fornecedores",
        icon: <Factory className="h-8 w-8 mb-2" />,
        component: <SuppliersRegistration />
    }
]


export const MainPageLayout: React.FC = () => {
    const [openSection, setOpenSection] = useState<Partial<Record<SectionKey, boolean>>>({})

    function toggleSection(section: SectionKey) {
        setOpenSection(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    return (
        <main className="p-6 max-w-4xl mx-auto">

            {/* Cards */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {sections.map(({ section, label, icon }) => {
                    const isOpen = openSection[section]

                    return (
                        <div
                            key={section}
                            onClick={() => toggleSection(section)}
                            className={`cursor-pointer p-6 rounded-xl transition flex flex-col items-center text-center border relative
                                ${isOpen
                                    ? "bg-emerald-50 border-emerald-100 ring-2 ring-emerald-200"
                                    : "bg-white shadow hover:shadow-md border-gray-200"}`}
                        >
                            <div className={`transition ${isOpen ? "text-emerald-700" : "text-emerald-600"}`}>
                                {icon}
                            </div>

                            <p className={`text-lg font-semibold ${isOpen ? "text-emerald-800" : ""}`}>
                                {label}
                            </p>

                            <span className="text-sm text-gray-500">
                                Cadastrar ou visualizar
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Seções */}
            {sections.map(({ section, component }) => (
                openSection[section] && (
                    <section
                        key={section}
                        id={`${section}-section`}
                        className="relative bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8"
                    >
                        <button
                            type="button"
                            onClick={() => toggleSection(section)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            aria-label={`Fechar seção de ${section}`}
                        >
                            <X className="w-5 h-5 cursor-pointer" />
                        </button>

                        {component}
                    </section>
                )
            ))}
        </main>
    )
}
