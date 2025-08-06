import { useEffect, useState } from "react"
import { Users, Truck, Package, ShoppingCart, ShoppingBag, X, ArrowDownCircle, ArrowUpCircle, BarChart3, History, Building2 } from "lucide-react"

import { Clients } from "../components/Clients"
import { Suppliers } from "../components/Suppliers"
import { Products } from "../components/Products"
import { Sales } from "../components/Sales"
import { SalesHistory } from "../components/SalesHistory"
import { Purchases } from "../components/Purchases"
import { PurchasesHistory } from "../components/PurchasesHistory"
import { Receivables } from "../components/Receivables"
import { Expenses } from "../components/Expenses"
import { Payables } from "../components/Payables"
import { Caixa } from "../components/Caixa"


type SectionKey = "clients" | "suppliers" | "products" | "sales" | "purchases" | "receivables" | "payables" | "expenses" | "salesHistory" | "purchasesHistory" | "caixa"

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
        icon: <Users className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />,
        component: <Clients />
    },
    {
        section: "suppliers",
        sectionName: "Fornecedores",
        icon: <Truck className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />,
        component: <Suppliers />
    },
    {
        section: "products",
        sectionName: "Produtos",
        icon: <Package className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />,
        component: <Products />
    },
    {
        section: "sales",
        sectionName: "Vendas",
        icon: <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />,
        component: <Sales />
    },
    {
        section: "purchases",
        sectionName: "Compras",
        icon: <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />,
        component: <Purchases />
    },
    {
        section: "receivables",
        sectionName: "Contas a receber",
        icon: <ArrowDownCircle className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />,
        component: <Receivables />
    },
    {
        section: "payables",
        sectionName: "Contas a pagar",
        icon: <ArrowUpCircle className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />,
        component: <Payables />
    },
    {
        section: "expenses",
        sectionName: "Despesas",
        icon: <ArrowUpCircle className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />,
        component: <Expenses />
    },
    {
        section: "salesHistory",
        sectionName: "Histórico de Vendas",
        icon: <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />,
        component: <SalesHistory />
    },
    {
        section: "purchasesHistory",
        sectionName: "Histórico de Compras",
        icon: <History className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />,
        component: <PurchasesHistory />
    },
    {
        section: "caixa",
        sectionName: "Caixa",
        icon: <Building2 className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />,
        component: <Caixa />
    }
]


export const Home: React.FC = () => {
    const [openSection, setOpenSection] = useState<SectionKey | null>(null);

    function toggleSection(section: SectionKey) {
        setOpenSection(prev => (prev === section ? null : section))
    }

    useEffect(() => {
        if (openSection) {
            const sectionEl = document.getElementById(`${openSection}-section`);
            if (sectionEl) {
                sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    }, [openSection]);


    return (
        <main className="p-4 sm:p-6 lg:p-8 max-w-[87.5rem] mx-auto bg-gradient-to-br from-emerald-50/10 via-emerald-50/5 to-emerald-50/20 min-h-screen">
            {/* Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-10">
                {sectionsArray.map(({ section, sectionName, icon }) => {
                    const isOpen = openSection === section

                    return (
                        <article
                            key={section}
                            onClick={() => toggleSection(section)}
                            className={`group cursor-pointer p-4 sm:p-6 lg:p-8 rounded-2xl transition-all duration-500 ease-out flex flex-col items-center text-center border-2 relative hover:-translate-y-2 hover:scale-105
                                    ${isOpen
                                    ? "bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-300 ring-4 ring-emerald-200/50 shadow-2xl"
                                    : "bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl border-gray-200/50 hover:border-emerald-200"}`}
                        >
                            <header className={`p-2 sm:p-4 rounded-full mb-2 sm:mb-4 transition-all duration-300 ${isOpen
                                ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg"
                                : "bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-600 group-hover:from-emerald-200 group-hover:to-green-200"}`}>
                                {icon}
                            </header>

                            <h2 className={`text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 transition-colors duration-300 ${isOpen ? "text-emerald-800" : "text-gray-800"}`}>
                                {sectionName}
                            </h2>

                            <p className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                                Cadastrar ou visualizar
                            </p>
                        </article>
                    )
                })}
            </section>

            {/* Seções */}
            {sectionsArray.map(({ section, component }) => (
                openSection === section && (
                    <section
                        key={section}
                        id={`${section}-section`}
                        className="relative bg-white/90 backdrop-blur-sm border-2 border-emerald-200/50 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-xl"
                    >
                        <button
                            type="button"
                            onClick={() => toggleSection(section)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:scale-110 transition-all duration-200 p-2 rounded-full hover:bg-gray-100"
                            aria-label={`Fechar seção de ${section}`}
                        >
                            <X className="w-6 h-6 cursor-pointer" />
                        </button>

                        {component}
                    </section>
                )
            ))}
        </main>
    )
}
