import { useState, useRef } from "react";
import {
  Loader2,
  X,
  ImagePlus,
  AlertCircle,
  Info,
  ImageIcon,
  Video,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  Monitor,
  BarChart3,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  VERTICALS,
  FORMAT_TYPES,
  PLATFORMS,
  STATUS_OPTIONS,
  METRIC_DEFS,
} from "../types";
import type { AdFormatInput } from "../types";

interface PendingImage {
  file: File;
  preview: string;
}

interface CaseModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (caseId: string) => void;
}

type Tab = "info" | "media" | "results" | "links";

const emptyForm: AdFormatInput = {
  title: "",
  vertical: "",
  format_type: "",
  description: "",
  status: "active",
  cliente: "",
  plataforma: "",
  publish_date: "",
  video_links: [],
  impressoes: null,
  alcance: null,
  cliques: null,
  ctr: null,
  visualizacoes: null,
  visualizacoes_completas: null,
  taxa_conclusao: null,
  engajamento: null,
  taxa_engajamento: null,
  conversoes: null,
  outros_resultados: "",
};

export default function CaseModal({ open, onClose, onCreated }: CaseModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [formData, setFormData] = useState<AdFormatInput>(emptyForm);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (
      name === "impressoes" ||
      name === "alcance" ||
      name === "cliques" ||
      name === "visualizacoes" ||
      name === "visualizacoes_completas" ||
      name === "engajamento" ||
      name === "conversoes"
    ) {
      setFormData({ ...formData, [name]: value ? Number(value) : null });
    } else if (
      name === "ctr" ||
      name === "taxa_conclusao" ||
      name === "taxa_engajamento"
    ) {
      setFormData({ ...formData, [name]: value ? Number(value) : null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validImages: PendingImage[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Por favor, selecione apenas arquivos de imagem.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Cada imagem deve ter no máximo 5MB.");
        continue;
      }
      validImages.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (validImages.length > 0) {
      setError(null);
      setPendingImages((prev) => [...prev, ...validImages]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    setPendingImages((prev) => {
      const newIndex = direction === "left" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [
        updated[newIndex],
        updated[index],
      ];
      return updated;
    });
  };

  const addLink = () => {
    const trimmed = linkInput.trim();
    if (trimmed && !formData.video_links?.includes(trimmed)) {
      setFormData({
        ...formData,
        video_links: [...(formData.video_links || []), trimmed],
      });
    }
    setLinkInput("");
  };

  const removeLink = (link: string) => {
    setFormData({
      ...formData,
      video_links: formData.video_links?.filter((l) => l !== link) || [],
    });
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setLinkInput("");
    setPendingImages([]);
    setError(null);
    setActiveTab("info");
  };

  const handleClose = () => {
    if (uploading) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.format_type.trim()) {
      setError("Formato publicitário é obrigatório.");
      setActiveTab("info");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];
      for (const img of pendingImages) {
        const fileExt = img.file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `formats/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("ad-formats")
          .upload(filePath, img.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("ad-formats")
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      const insertData = {
        title: formData.title.trim() || formData.format_type,
        vertical: formData.vertical || "Outros",
        format_type: formData.format_type,
        description: formData.description?.trim() || null,
        image_url: uploadedUrls[0] || null,
        tags: [],
        status: formData.status || "active",
        cliente: formData.cliente?.trim() || null,
        plataforma: formData.plataforma || null,
        publish_date: formData.publish_date || null,
        video_links: formData.video_links || [],
        impressoes: formData.impressoes || null,
        alcance: formData.alcance || null,
        cliques: formData.cliques || null,
        ctr: formData.ctr || null,
        visualizacoes: formData.visualizacoes || null,
        visualizacoes_completas: formData.visualizacoes_completas || null,
        taxa_conclusao: formData.taxa_conclusao || null,
        engajamento: formData.engajamento || null,
        taxa_engajamento: formData.taxa_engajamento || null,
        conversoes: formData.conversoes || null,
        outros_resultados: formData.outros_resultados?.trim() || null,
      };

      const { data, error: insertError } = await supabase
        .from("ad_formats")
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      if (uploadedUrls.length > 0) {
        const imageRecords = uploadedUrls.map((url, i) => ({
          format_id: data.id,
          image_url: url,
          sort_order: i,
        }));

        const { error: imagesError } = await supabase
          .from("case_images")
          .insert(imageRecords);

        if (imagesError) throw imagesError;
      }

      resetForm();
      onCreated(data.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao cadastrar case"
      );
    } finally {
      setUploading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Info }[] = [
    { id: "info", label: "Informações", icon: Info },
    { id: "media", label: "Mídia", icon: ImageIcon },
    { id: "results", label: "Resultados", icon: BarChart3 },
    { id: "links", label: "Vídeos e Links", icon: Video },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      <div className="animate-scale-in relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Adicionar novo case
          </h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100 px-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex flex-shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-globo-700"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-globo-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {activeTab === "info" && (
            <div className="space-y-4 animate-fade-in">
              {/* Formato publicitário */}
              <div>
                <label className="label-field">
                  Formato publicitário <span className="text-red-500">*</span>
                </label>
                <select
                  name="format_type"
                  value={formData.format_type}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Selecione um formato...</option>
                  {FORMAT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vertical + Plataforma */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Vertical</label>
                  <select
                    name="vertical"
                    value={formData.vertical}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Selecione...</option>
                    {VERTICALS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-400">
                    Informação complementar
                  </p>
                </div>
                <div>
                  <label className="label-field">Plataforma</label>
                  <select
                    name="plataforma"
                    value={formData.plataforma || ""}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Selecione...</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cliente + Data */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Cliente</label>
                  <input
                    type="text"
                    name="cliente"
                    value={formData.cliente || ""}
                    onChange={handleChange}
                    placeholder="Ex: Bebidas Frutas"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">Data de publicação</label>
                  <input
                    type="date"
                    name="publish_date"
                    value={formData.publish_date || ""}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="label-field">Descrição do case</label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Descreva o projeto, os resultados e os aprendizados..."
                  className="input-field resize-y"
                />
              </div>

              {/* Status */}
              <div>
                <label className="label-field">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="animate-fade-in">
              <div className="mb-4 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Imagens do case
                </label>
                {pendingImages.length > 0 && (
                  <span className="badge bg-globo-50 text-globo-700">
                    {pendingImages.length} imagem
                    {pendingImages.length > 1 ? "ns" : ""}
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              {pendingImages.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 transition-all duration-200 hover:border-globo-400 hover:bg-globo-50/50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-soft">
                    <ImagePlus className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    Clique para selecionar imagens
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Várias imagens — PNG, JPG ou WEBP até 5MB cada
                  </p>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {pendingImages.map((img, index) => (
                      <div
                        key={index}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={img.preview}
                          alt={`Preview ${index + 1}`}
                          className="aspect-video w-full object-cover"
                        />
                        {index === 0 && (
                          <span className="absolute left-2 top-2 rounded-full bg-globo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft">
                            Capa
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-slate-600 shadow-soft backdrop-blur-md transition-all hover:bg-white hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => moveImage(index, "left")}
                            disabled={index === 0}
                            className="flex h-6 w-7 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-soft backdrop-blur-md transition-all hover:bg-white disabled:opacity-30"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, "right")}
                            disabled={index === pendingImages.length - 1}
                            className="flex h-6 w-7 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-soft backdrop-blur-md transition-all hover:bg-white disabled:opacity-30"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 transition-all hover:border-globo-300 hover:bg-globo-50/50 hover:text-globo-600"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Adicionar mais imagens
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "results" && (
            <div className="animate-fade-in space-y-4">
              <p className="text-sm text-slate-500">
                Preencha apenas os indicadores que fizerem sentido para este
                case. Todos os campos são opcionais.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {METRIC_DEFS.map((metric) => (
                  <div key={metric.key}>
                    <label className="label-field">
                      {metric.label}
                      {metric.suffix && (
                        <span className="ml-1 text-xs font-normal text-slate-400">
                          ({metric.suffix})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      name={metric.key}
                      value={
                        formData[metric.key] != null
                          ? String(formData[metric.key])
                          : ""
                      }
                      onChange={handleChange}
                      placeholder={
                        metric.isPercentage ? "Ex: 1,28" : "Ex: 1200000"
                      }
                      step={metric.isPercentage ? "0.01" : "1"}
                      min="0"
                      className="input-field"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="label-field">
                  Outros resultados / Observações
                </label>
                <textarea
                  name="outros_resultados"
                  value={formData.outros_resultados || ""}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Descreva outros resultados ou informações relevantes..."
                  className="input-field resize-y"
                />
              </div>
            </div>
          )}

          {activeTab === "links" && (
            <div className="animate-fade-in space-y-4">
              <div>
                <label className="label-field">
                  <span className="inline-flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-slate-400" />
                    Links de vídeos e referências externas
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addLink();
                      }
                    }}
                    placeholder="Cole a URL do vídeo ou link externo"
                    className="input-field"
                  />
                  <button
                    type="button"
                    onClick={addLink}
                    className="btn-secondary flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </button>
                </div>
              </div>

              {formData.video_links && formData.video_links.length > 0 ? (
                <div className="space-y-2">
                  {formData.video_links.map((link, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <Video className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate text-sm text-globo-600 hover:text-globo-700 hover:underline"
                      >
                        {link}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeLink(link)}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                  <Video className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-400">
                    Nenhum link adicionado ainda
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
            {formData.cliente && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {formData.cliente}
              </span>
            )}
            {formData.plataforma && (
              <span className="inline-flex items-center gap-1">
                <Monitor className="h-3.5 w-3.5" />
                {formData.plataforma}
              </span>
            )}
            {formData.publish_date && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formData.publish_date}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="btn-primary"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Cadastrar case
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
