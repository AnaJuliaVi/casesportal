import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import CaseModal from "./CaseModal";

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-globo-600 to-globo-800 shadow-soft transition-transform duration-200 group-hover:scale-105">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight text-slate-900">
                Cases de Formatos
              </p>
              <p className="text-xs leading-tight text-slate-500">
                Time de Formatos · Globo
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-auto hidden items-center gap-3 md:flex">
            <Link
              to="/"
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                pathname === "/"
                  ? "bg-globo-50 text-globo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Cases
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-globo-600 px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-all duration-200 hover:bg-globo-700 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Adicionar novo case
            </button>
          </nav>

          {/* Mobile add button */}
          <button
            onClick={() => setShowModal(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-globo-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:bg-globo-700 md:hidden"
          >
            <Plus className="h-4 w-4" />
            Novo case
          </button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/90 backdrop-blur-xl md:hidden">
        <Link
          to="/"
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
            pathname === "/" ? "text-globo-600" : "text-slate-500"
          }`}
        >
          <LayoutGrid className="h-5 w-5" />
          Cases
        </Link>
        <button
          onClick={() => setShowModal(true)}
          className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-globo-600"
        >
          <Plus className="h-5 w-5" />
          Novo case
        </button>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 md:pb-12 lg:px-8">
        <Outlet />
      </main>

      <CaseModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(caseId) => {
          setShowModal(false);
          navigate(`/format/${caseId}`);
        }}
      />
    </div>
  );
}
