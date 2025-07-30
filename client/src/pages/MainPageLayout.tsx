import { useState } from "react"
import { Users, Truck, Package, Wallet, ShoppingCart, ShoppingBag, X, ArrowDownCircle, ArrowUpCircle } from "lucide-react"

import { Clients } from "../components/Clients"
import { Suppliers } from "../components/Suppliers"
import { Products } from "../components/Products"
import { Sales } from "../components/Sales"
import { Purchases } from "../components/Purchases"
import { Receivables } from "../components/Receivables"
import { Expenses } from "../components/Expenses"
import { Payables } from "../components/Payables"
import { BankAccountsRegistration } from "../components/BankAccountRegistration"


type SectionKey = "clients" | "suppliers" | "products" | "sales" | "purchases" | "receivables" | "payables" | "expenses" | "bankAccount"

type SectionConfig = {
    section: SectionKey
    sectionName: string
    icon: React.ReactNode
    component: React.ReactNode
}

const sectionsArray: SectionConfig[] = [
    {
        section: "clients",
        sectionName: "Clientes",
        icon: <Users className="h-8 w-8 mb-2" />,
        component: <Clients />
    },
    {
        section: "suppliers",
        sectionName: "Fornecedores",
        icon: <Truck className="h-8 w-8 mb-2" />,
        component: <Suppliers />
    },
    {
        section: "products",
        sectionName: "Produtos",
        icon: <Package className="h-8 w-8 mb-2" />,
        component: <Products />
    },
    {
        section: "sales",
        sectionName: "Vendas",
        icon: <ShoppingCart className="h-8 w-8 mb-2" />,
        component: <Sales />
    },
    {
        section: "purchases",
        sectionName: "Compras",
        icon: <ShoppingBag className="h-8 w-8 mb-2" />,
        component: <Purchases />
    },
    {
        section: "receivables",
        sectionName: "Contas a receber",
        icon: <ArrowDownCircle className="h-8 w-8 mb-2" />,
        component: <Receivables />
    },
    {
        section: "payables",
        sectionName: "Contas a pagar",
        icon: <ArrowUpCircle className="h-8 w-8 mb-2" />,
        component: <Payables />
    },
    {
        section: "expenses",
        sectionName: "Despesas",
        icon: <ArrowUpCircle className="h-8 w-8 mb-2" />,
        component: <Expenses />
    },
    {
        section: "bankAccount",
        sectionName: "Conta Bancaria",
        icon: <Wallet className="h-8 w-8 mb-2" />,
        component: <BankAccountsRegistration />
    }
]


export const MainPageLayout: React.FC = () => {
    const [openSection, setOpenSection] = useState<SectionKey | null>(null);

    function toggleSection(section: SectionKey) {
        setOpenSection(prev => (prev === section ? null : section))
    }


    return (
        <main className="p-6 max-w-[87.5rem] mx-auto">
            {/* Cards */}
            <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {sectionsArray.map(({ section, sectionName, icon }) => {
                    const isOpen = openSection === section

                    return (
                        <div
                            key={section}
                            onClick={() => toggleSection(section)}
                            className={`group cursor-pointer p-6 rounded-xl transition-all duration-300 ease-in-out flex flex-col items-center text-center border relative hover:-translate-y-1
                                    ${isOpen
                                    ? "bg-emerald-50 border-emerald-100 ring-2 ring-emerald-200"
                                    : "bg-white shadow hover:shadow-lg border-gray-200"}`}
                        >
                            <div className={`${isOpen ? "text-emerald-700" : "text-emerald-600"}`}>
                                {icon}
                            </div>

                            <p className={`text-lg font-semibold ${isOpen ? "text-emerald-800" : ""}`}>
                                {sectionName}
                            </p>

                            <span className="text-sm text-gray-500">
                                Cadastrar ou visualizar
                            </span>
                        </div>
                    )
                })}
            </section>

            {/* Seções */}
            {sectionsArray.map(({ section, component }) => (
                openSection === section && (
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
