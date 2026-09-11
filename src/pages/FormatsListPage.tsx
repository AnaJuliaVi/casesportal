import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  LayoutGrid,
  SlidersHorizontal,
  X,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { AdFormat } from "../types";
import { VERTICALS, FORMAT_TYPES } from "../types";
import FormatCard from "../components/FormatCard";

export default function FormatsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formats, setFormats] = useState<AdFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get("q") || "";
  const formatType = searchParams.get("type") || "";
  const vertical = searchParams.get("vertical") || "";
  const status = searchParams.get("status") || "";

  useEffect(() => {
    async function fetchFormats() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from("ad_formats")
          .select("*, case_images(*)")
          .order("created_at", { ascending: false });

        if (search) {
          query = query.ilike("title", `%${search}%`);
        }
        if (formatType) {
          query = query.eq("format_type", formatType);
        }
        if (vertical) {
          query = query.eq("vertical", vertical);
        }
        if (status) {
          query = query.eq("status", status);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setFormats((data || []) as AdFormat[]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar cases"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchFormats();
  }, [search, formatType, vertical, status]);

  const hasActiveFilters = Boolean(formatType || vertical || status);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const formatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    formats.forEach((f) => {
      counts[f.format_type] = (counts[f.format_type] || 0) + 1;
    });
    return counts;
  }, [formats]);

  return (
    <div className="animate-fade-in">
      {/* Hero header (no add button — that's in the top nav) */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-globo-50/50 p-6 shadow-card sm:p-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-globo-50 px-3 py-1 text-xs font-medium text-globo-700">
          <Sparkles className="h-3.5 w-3.5" />
          Biblioteca de Cases
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Cases de Formatos
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Confira os projetos e cases desenvolvidos pelo time de Formatos
        </p>
      </div>

      {/* Search + Filter Toggle */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => updateFilter("q", e.target.value)}
            className="input-field pl-10"
          />
          {search && (
            <button
              onClick={() => updateFilter("q", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary ${hasActiveFilters ? "border-globo-300 bg-globo-50 text-globo-700" : ""}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-globo-600 text-[10px] font-bold text-white">
              {[formatType, vertical, status].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="animate-scale-in mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label-field">Formato publicitário</label>
              <select
                value={formatType}
                onChange={(e) => updateFilter("type", e.target.value)}
                className="input-field"
              >
                <option value="">Todos</option>
                {FORMAT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">
                Vertical
                <span className="ml-1 text-xs font-normal text-slate-400">
                  (complementar)
                </span>
              </label>
              <select
                value={vertical}
                onChange={(e) => updateFilter("vertical", e.target.value)}
                className="input-field"
              >
                <option value="">Todas</option>
                {VERTICALS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Status</label>
              <select
                value={status}
                onChange={(e) => updateFilter("status", e.target.value)}
                className="input-field"
              >
                <option value="">Todos</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="draft">Rascunho</option>
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm font-medium text-globo-600 transition-colors hover:text-globo-700"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Quick Format Filter Pills (primary filter) */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => updateFilter("type", "")}
          className={`badge transition-all duration-200 ${
            !formatType
              ? "bg-globo-600 text-white shadow-soft"
              : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
          }`}
        >
          <LayoutGrid className="mr-1 h-3 w-3" />
          Todos os formatos
        </button>
        {FORMAT_TYPES.map((t) => {
          const count = formatCounts[t] || 0;
          if (count === 0 && !formatType) return null;
          return (
            <button
              key={t}
              onClick={() => updateFilter("type", t)}
              className={`badge transition-all duration-200 ${
                formatType === t
                  ? "bg-globo-600 text-white shadow-soft"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {t}
              {count > 0 && (
                <span
                  className={`ml-1.5 ${formatType === t ? "text-globo-100" : "text-slate-400"}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="card overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="skeleton aspect-video" />
              <div className="p-4">
                <div className="skeleton mb-3 h-5 w-20" />
                <div className="skeleton mb-2 h-4 w-full" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      ) : formats.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <ImageIcon className="h-8 w-8 text-slate-400" />
          </div>
          <p className="mt-4 text-base font-medium text-slate-600">
            {search || hasActiveFilters
              ? "Nenhum case encontrado"
              : "Nenhum case cadastrado"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {search || hasActiveFilters
              ? "Tente ajustar a busca ou os filtros"
              : "Use o botão \"Adicionar novo case\" no menu superior"}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">
                {formats.length}
              </span>{" "}
              case{formats.length > 1 ? "s" : ""} encontrado
              {formats.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {formats.map((format, index) => (
              <FormatCard key={format.id} format={format} index={index} />
            ))}
          </div>
        </>
      )}

    </div>
  );
}
