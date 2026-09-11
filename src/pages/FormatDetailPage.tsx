import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  ImageIcon,
  Calendar,
  Edit3,
  X,
  Save,
  AlertCircle,
  ExternalLink,
  ImagePlus,
  Plus,
  Video,
  Building2,
  Monitor,
  Link2,
  BarChart3,
  TrendingUp,
  Film,
  FileVideo,
  UploadCloud,
  Play,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { AdFormat, CaseImage, CaseVideo } from "../types";
import {
  VERTICALS,
  FORMAT_TYPES,
  PLATFORMS,
  STATUS_OPTIONS,
  METRIC_DEFS,
  HOME_DAY_FORMAT,
  OUTROS_FORMAT,
  isHomeDay,
  isOutros,
} from "../types";
import {
  getStatusBadgeClasses,
  getStatusLabel,
  formatDate,
  formatDateTime,
} from "../utils/format";
import Gallery from "../components/Gallery";

interface EditImage {
  id?: string;
  url: string;
  isNew?: boolean;
  file?: File;
  markedForDeletion?: boolean;
}

interface EditVideo {
  id?: string;
  url: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  isNew?: boolean;
  file?: File;
  markedForDeletion?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function FormatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [format, setFormat] = useState<AdFormat | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editData, setEditData] = useState<Partial<AdFormat>>({});
  const [linkInput, setLinkInput] = useState("");
  const [editImages, setEditImages] = useState<EditImage[]>([]);
  const [editVideos, setEditVideos] = useState<EditVideo[]>([]);
  const [showEditFormatDropdown, setShowEditFormatDropdown] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editVideoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchFormat() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("ad_formats")
          .select("*, case_images(*), case_videos(*)")
          .eq("id", id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          setError("Case não encontrado.");
          return;
        }

        const fmt = data as AdFormat;
        setFormat(fmt);

        // Build gallery images: prefer case_images, fallback to cover image_url
        const imgs =
          fmt.case_images && fmt.case_images.length > 0
            ? [...fmt.case_images]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((ci) => ci.image_url)
            : fmt.image_url
              ? [fmt.image_url]
              : [];
        setGalleryImages(imgs);
        setEditData(fmt);
        setEditVideos(
          fmt.case_videos
            ? [...fmt.case_videos]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((v) => ({
                  id: v.id,
                  url: v.video_url,
                  fileName: v.file_name,
                  fileSize: v.file_size ?? undefined,
                  mimeType: v.mime_type ?? undefined,
                  isNew: false,
                }))
            : []
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar case"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchFormat();
  }, [id]);

  const startEditing = () => {
    if (format) {
      setEditData({ ...format });
      const imgs =
        galleryImages.length > 0
          ? galleryImages.map((url, i) => ({
              id: format.case_images?.[i]?.id,
              url,
              isNew: false,
            }))
          : [];
      setEditImages(imgs);
      setEditing(true);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    if (format) setEditData({ ...format });
    setEditImages([]);
    setEditVideos(
      format?.case_videos
        ? [...format.case_videos]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((v) => ({
              id: v.id,
              url: v.video_url,
              fileName: v.file_name,
              fileSize: v.file_size ?? undefined,
              mimeType: v.mime_type ?? undefined,
              isNew: false,
            }))
        : []
    );
    setShowEditFormatDropdown(false);
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validImages: EditImage[] = [];
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
        url: URL.createObjectURL(file),
        isNew: true,
        file,
      });
    }

    if (validImages.length > 0) {
      setError(null);
      setEditImages((prev) => [...prev, ...validImages]);
    }

    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const removeEditImage = (index: number) => {
    setEditImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, markedForDeletion: !img.markedForDeletion } : img
      )
    );
  };

  const moveEditImage = (index: number, direction: "left" | "right") => {
    setEditImages((prev) => {
      const newIndex = direction === "left" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const numericKeys = [
      "impressoes",
      "alcance",
      "cliques",
      "ctr",
      "visualizacoes",
      "visualizacoes_completas",
      "taxa_conclusao",
      "engajamento",
      "taxa_engajamento",
      "conversoes",
    ];
    if (numericKeys.includes(name)) {
      setEditData({ ...editData, [name]: value ? Number(value) : null });
    } else {
      setEditData({ ...editData, [name]: value });
    }
  };

  const handleEditFormatTypeChange = (value: string) => {
    setEditData({
      ...editData,
      format_type: value,
      additional_formats: value === HOME_DAY_FORMAT ? (editData.additional_formats || []) : [],
      outros_formato_name: value === OUTROS_FORMAT ? (editData.outros_formato_name || "") : null,
    });
  };

  const addEditAdditionalFormat = (fmt: string) => {
    if (editData.additional_formats?.includes(fmt)) return;
    setEditData({
      ...editData,
      additional_formats: [...(editData.additional_formats || []), fmt],
    });
    setShowEditFormatDropdown(false);
  };

  const removeEditAdditionalFormat = (fmt: string) => {
    setEditData({
      ...editData,
      additional_formats: editData.additional_formats?.filter((f) => f !== fmt) || [],
    });
  };

  const availableEditAdditionalFormats = FORMAT_TYPES.filter(
    (f) =>
      f !== HOME_DAY_FORMAT &&
      f !== OUTROS_FORMAT &&
      !editData.additional_formats?.includes(f)
  );

  const handleEditVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const validVideos: EditVideo[] = [];
    for (const file of files) {
      if (!file.type.startsWith("video/")) {
        setError("Por favor, selecione apenas arquivos de vídeo.");
        continue;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError("Cada vídeo deve ter no máximo 100MB.");
        continue;
      }
      validVideos.push({
        url: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        isNew: true,
        file,
      });
    }
    if (validVideos.length > 0) {
      setError(null);
      setEditVideos((prev) => [...prev, ...validVideos]);
    }
    if (editVideoInputRef.current) editVideoInputRef.current.value = "";
  };

  const removeEditVideo = (index: number) => {
    setEditVideos((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, markedForDeletion: !v.markedForDeletion } : v
      )
    );
  };

  const addEditLink = () => {
    const trimmed = linkInput.trim();
    if (trimmed && !editData.video_links?.includes(trimmed)) {
      setEditData({
        ...editData,
        video_links: [...(editData.video_links || []), trimmed],
      });
    }
    setLinkInput("");
  };

  const removeEditLink = (link: string) => {
    setEditData({
      ...editData,
      video_links: editData.video_links?.filter((l) => l !== link) || [],
    });
  };

  const handleSave = async () => {
    if (!id || !editData.title?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      // Upload new images
      const uploadedUrls: string[] = [];
      const newImages = editImages.filter((img) => img.isNew && img.file && !img.markedForDeletion);
      for (const img of newImages) {
        if (!img.file) continue;
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
        img.url = urlData.publicUrl;
        img.isNew = false;
      }

      // Delete marked images from storage + DB
      const markedForDeletion = editImages.filter(
        (img) => img.markedForDeletion && img.id && !img.isNew
      );
      for (const img of markedForDeletion) {
        if (img.id) {
          await supabase.from("case_images").delete().eq("id", img.id);
        }
        // Try to remove from storage
        try {
          const url = new URL(img.url);
          const path = url.pathname.split("/").slice(-2).join("/");
          await supabase.storage.from("ad-formats").remove([path]);
        } catch {
          // ignore URL parse errors
        }
      }

      // Reorder and update existing images
      const remainingImages = editImages.filter(
        (img) => !img.markedForDeletion
      );

      // Update sort_order for existing images and insert new ones
      const imageRecords: { format_id: string; image_url: string; sort_order: number }[] = [];
      for (let i = 0; i < remainingImages.length; i++) {
        const img = remainingImages[i];
        if (img.id) {
          await supabase
            .from("case_images")
            .update({ sort_order: i })
            .eq("id", img.id);
        } else {
          imageRecords.push({
            format_id: id,
            image_url: img.url,
            sort_order: i,
          });
        }
      }

      if (imageRecords.length > 0) {
        const { error: insertError } = await supabase
          .from("case_images")
          .insert(imageRecords);
        if (insertError) throw insertError;
      }

      // Update cover image (first non-deleted image)
      const coverUrl = remainingImages.length > 0 ? remainingImages[0].url : null;

      // If all images removed, also remove the old cover
      if (!coverUrl && format?.image_url) {
        try {
          const oldUrl = new URL(format.image_url);
          const oldPath = oldUrl.pathname.split("/").slice(-2).join("/");
          await supabase.storage.from("ad-formats").remove([oldPath]);
        } catch {
          // ignore
        }
      }

      // Upload new videos
      const newVideos = editVideos.filter((v) => v.isNew && v.file && !v.markedForDeletion);
      for (const v of newVideos) {
        if (!v.file) continue;
        const fileExt = v.file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `videos/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("ad-formats")
          .upload(filePath, v.file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("ad-formats").getPublicUrl(filePath);
        v.url = urlData.publicUrl;
        v.isNew = false;
      }

      // Delete marked videos from storage + DB
      const markedVideos = editVideos.filter((v) => v.markedForDeletion && v.id && !v.isNew);
      for (const v of markedVideos) {
        if (v.id) await supabase.from("case_videos").delete().eq("id", v.id);
        try {
          const url = new URL(v.url);
          const path = url.pathname.split("/").slice(-2).join("/");
          await supabase.storage.from("ad-formats").remove([path]);
        } catch {
          // ignore URL parse errors
        }
      }

      // Reorder and update remaining videos
      const remainingVideos = editVideos.filter((v) => !v.markedForDeletion);
      const newVideoRecords: { format_id: string; video_url: string; file_name: string; file_size: number; mime_type: string; sort_order: number }[] = [];
      for (let i = 0; i < remainingVideos.length; i++) {
        const v = remainingVideos[i];
        if (v.id) {
          await supabase.from("case_videos").update({ sort_order: i }).eq("id", v.id);
        } else {
          newVideoRecords.push({
            format_id: id,
            video_url: v.url,
            file_name: v.fileName,
            file_size: v.fileSize ?? 0,
            mime_type: v.mimeType ?? "",
            sort_order: i,
          });
        }
      }
      if (newVideoRecords.length > 0) {
        const { error: insertVideoError } = await supabase.from("case_videos").insert(newVideoRecords);
        if (insertVideoError) throw insertVideoError;
      }

      const { data, error: updateError } = await supabase
        .from("ad_formats")
        .update({
          title: editData.title.trim(),
          vertical: editData.vertical,
          format_type: editData.format_type,
          description: editData.description?.trim() || null,
          status: editData.status,
          image_url: coverUrl,
          cliente: editData.cliente?.trim() || null,
          plataforma: editData.plataforma || null,
          publish_date: editData.publish_date || null,
          video_links: editData.video_links || [],
          additional_formats: isHomeDay(editData.format_type || "") ? (editData.additional_formats || []) : [],
          outros_formato_name: isOutros(editData.format_type || "") ? (editData.outros_formato_name?.trim() || null) : null,
          impressoes: editData.impressoes || null,
          alcance: editData.alcance || null,
          cliques: editData.cliques || null,
          ctr: editData.ctr || null,
          visualizacoes: editData.visualizacoes || null,
          visualizacoes_completas: editData.visualizacoes_completas || null,
          taxa_conclusao: editData.taxa_conclusao || null,
          engajamento: editData.engajamento || null,
          taxa_engajamento: editData.taxa_engajamento || null,
          conversoes: editData.conversoes || null,
          outros_resultados: editData.outros_resultados?.trim() || null,
        })
        .eq("id", id)
        .select("*, case_images(*), case_videos(*)")
        .single();

      if (updateError) throw updateError;
      setFormat(data as AdFormat);

      const imgs =
        data.case_images && data.case_images.length > 0
          ? [...data.case_images]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((ci) => ci.image_url)
          : data.image_url
            ? [data.image_url]
            : [];
      setGalleryImages(imgs);

      const vids =
        data.case_videos
          ? [...data.case_videos]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((v) => ({
                id: v.id,
                url: v.video_url,
                fileName: v.file_name,
                fileSize: v.file_size ?? undefined,
                mimeType: v.mime_type ?? undefined,
                isNew: false,
              }))
          : [];
      setEditVideos(vids);

      setEditImages([]);
      setShowEditFormatDropdown(false);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao atualizar case"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !format) return;
    setDeleting(true);
    try {
      // Remove all gallery images from storage
      if (galleryImages.length > 0) {
        const paths = galleryImages
          .map((url) => {
            try {
              const u = new URL(url);
              return u.pathname.split("/").slice(-2).join("/");
            } catch {
              return null;
            }
          })
          .filter(Boolean) as string[];
        if (paths.length > 0) {
          await supabase.storage.from("ad-formats").remove(paths);
        }
      }

      // Remove all videos from storage
      if (format.case_videos && format.case_videos.length > 0) {
        const videoPaths = format.case_videos
          .map((v) => {
            try {
              const u = new URL(v.video_url);
              return u.pathname.split("/").slice(-2).join("/");
            } catch {
              return null;
            }
          })
          .filter(Boolean) as string[];
        if (videoPaths.length > 0) {
          await supabase.storage.from("ad-formats").remove(videoPaths);
        }
      }

      const { error: deleteError } = await supabase
        .from("ad_formats")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao excluir case"
      );
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-globo-500" />
        <p className="mt-3 text-sm text-slate-500">Carregando case...</p>
      </div>
    );
  }

  if (error && !format) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm font-medium text-red-700">{error}</p>
          <Link to="/" className="btn-secondary mt-4">
            <ArrowLeft className="h-4 w-4" />
            Voltar aos cases
          </Link>
        </div>
      </div>
    );
  }

  if (!format) return null;

  return (
    <div className="animate-fade-in mx-auto max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-globo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos cases
        </Link>
        {!editing && (
          <div className="flex items-center gap-2">
            <button onClick={startEditing} className="btn-secondary">
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Excluir</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Image / Gallery */}
        <div className="lg:col-span-3">
          {editing ? (
            /* Edit mode gallery */
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Imagens do case
                </label>
                <span className="badge bg-globo-50 text-globo-700">
                  {editImages.filter((i) => !i.markedForDeletion).length} imagem(s)
                </span>
              </div>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleEditImageSelect}
                className="hidden"
              />

              {editImages.length === 0 ? (
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 transition-all hover:border-globo-400 hover:bg-globo-50/50"
                >
                  <ImagePlus className="h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-xs font-medium text-slate-600">
                    Selecionar imagens
                  </p>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {editImages.map((img, index) => (
                      <div
                        key={index}
                        className={`group relative overflow-hidden rounded-xl border bg-slate-50 transition-all ${
                          img.markedForDeletion
                            ? "border-red-300 opacity-40"
                            : "border-slate-200"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={`Edit ${index + 1}`}
                          className="aspect-video w-full object-cover"
                        />
                        {index === 0 && !img.markedForDeletion && (
                          <span className="absolute left-2 top-2 rounded-full bg-globo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft">
                            Capa
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeEditImage(index)}
                          className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg shadow-soft backdrop-blur-md transition-all ${
                            img.markedForDeletion
                              ? "bg-globo-600 text-white"
                              : "bg-white/90 text-slate-600 hover:bg-white hover:text-red-600"
                          }`}
                        >
                          {img.markedForDeletion ? (
                            <Plus className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                        {/* Reorder controls */}
                        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => moveEditImage(index, "left")}
                            disabled={index === 0}
                            className="flex h-6 w-7 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-soft backdrop-blur-md transition-all hover:bg-white disabled:opacity-30"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveEditImage(index, "right")}
                            disabled={index === editImages.length - 1}
                            className="flex h-6 w-7 items-center justify-center rounded-md bg-white/90 text-slate-600 shadow-soft backdrop-blur-md transition-all hover:bg-white disabled:opacity-30"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 transition-all hover:border-globo-300 hover:bg-globo-50/50 hover:text-globo-600"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Adicionar mais imagens
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* View mode gallery */
            <Gallery images={galleryImages} alt={format.title} />
          )}

          {/* External link (view mode only, single image) */}
          {!editing && galleryImages.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              {galleryImages.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-globo-600 transition-all hover:border-globo-300 hover:bg-globo-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Imagem {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            {editing ? (
              /* Edit Mode */
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Editar case
                </h2>

                <div>
                  <label className="label-field">Título</label>
                  <input
                    type="text"
                    name="title"
                    value={editData.title || ""}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">
                      Formato publicitário <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="format_type"
                      value={editData.format_type || ""}
                      onChange={(e) => handleEditFormatTypeChange(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Selecione...</option>
                      {FORMAT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-field">Vertical</label>
                    <select
                      name="vertical"
                      value={editData.vertical || ""}
                      onChange={handleEditChange}
                      className="input-field"
                    >
                      <option value="">Selecione...</option>
                      {VERTICALS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Outros: custom format name */}
                {isOutros(editData.format_type || "") && (
                  <div className="animate-fade-in rounded-xl border border-globo-100 bg-globo-50/40 p-4">
                    <label className="label-field">Nome do formato</label>
                    <input
                      type="text"
                      name="outros_formato_name"
                      value={editData.outros_formato_name || ""}
                      onChange={handleEditChange}
                      placeholder="Ex: Formato Especial XYZ"
                      className="input-field"
                    />
                  </div>
                )}

                {/* Home Day: additional formats */}
                {isHomeDay(editData.format_type || "") && (
                  <div className="animate-fade-in rounded-xl border border-globo-100 bg-globo-50/40 p-4">
                    <label className="label-field">Formatos incluídos</label>
                    {editData.additional_formats && editData.additional_formats.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {editData.additional_formats.map((fmt) => (
                          <span
                            key={fmt}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-globo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft"
                          >
                            {fmt}
                            <button
                              type="button"
                              onClick={() => removeEditAdditionalFormat(fmt)}
                              className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-globo-700 transition-colors hover:bg-globo-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {showEditFormatDropdown ? (
                      <select
                        autoFocus
                        value=""
                        onChange={(e) => {
                          if (e.target.value) addEditAdditionalFormat(e.target.value);
                        }}
                        onBlur={() => setShowEditFormatDropdown(false)}
                        className="input-field"
                      >
                        <option value="">Selecione um formato para adicionar...</option>
                        {availableEditAdditionalFormats.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowEditFormatDropdown(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-globo-300 bg-white px-4 py-2.5 text-sm font-medium text-globo-600 transition-all hover:border-globo-400 hover:bg-globo-50"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar formato
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Cliente</label>
                    <input
                      type="text"
                      name="cliente"
                      value={editData.cliente || ""}
                      onChange={handleEditChange}
                      placeholder="Ex: Bebidas Frutas"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-field">Plataforma</label>
                    <select
                      name="plataforma"
                      value={editData.plataforma || ""}
                      onChange={handleEditChange}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-field">Data de publicação</label>
                    <input
                      type="date"
                      name="publish_date"
                      value={editData.publish_date || ""}
                      onChange={handleEditChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-field">Status</label>
                    <select
                      name="status"
                      value={editData.status || "active"}
                      onChange={handleEditChange}
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

                <div>
                  <label className="label-field">Descrição</label>
                  <textarea
                    name="description"
                    value={editData.description || ""}
                    onChange={handleEditChange}
                    rows={4}
                    className="input-field resize-y"
                  />
                </div>

                {/* Edit Results */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <BarChart3 className="h-4 w-4 text-globo-600" />
                    Resultados
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
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
                            editData[metric.key] != null
                              ? String(editData[metric.key])
                              : ""
                          }
                          onChange={handleEditChange}
                          step={metric.isPercentage ? "0.01" : "1"}
                          min="0"
                          className="input-field"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="label-field">
                      Outros resultados / Observações
                    </label>
                    <textarea
                      name="outros_resultados"
                      value={editData.outros_resultados || ""}
                      onChange={handleEditChange}
                      rows={2}
                      className="input-field resize-y"
                    />
                  </div>
                </div>

                {/* Edit Video files */}
                <div>
                  <label className="label-field">
                    <span className="inline-flex items-center gap-1.5">
                      <Film className="h-4 w-4 text-slate-400" />
                      Vídeos do dispositivo
                    </span>
                  </label>
                  <input
                    ref={editVideoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleEditVideoSelect}
                    className="hidden"
                  />
                  {editVideos.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => editVideoInputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-8 transition-all hover:border-globo-400 hover:bg-globo-50/50"
                    >
                      <UploadCloud className="h-6 w-6 text-slate-400" />
                      <p className="mt-2 text-xs font-medium text-slate-600">Adicionar vídeo</p>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {editVideos.map((v, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                            v.markedForDeletion ? "border-red-300 bg-red-50/40 opacity-50" : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <FileVideo className="h-5 w-5 flex-shrink-0 text-globo-600" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-700">{v.fileName}</p>
                            {v.fileSize != null && (
                              <p className="text-[11px] text-slate-400">{formatFileSize(v.fileSize)}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEditVideo(index)}
                            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all ${
                              v.markedForDeletion ? "bg-globo-600 text-white" : "text-slate-400 hover:bg-red-50 hover:text-red-600"
                            }`}
                          >
                            {v.markedForDeletion ? <Plus className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => editVideoInputRef.current?.click()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-globo-300 hover:bg-globo-50/50 hover:text-globo-600"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar mais vídeos
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit Links */}
                <div>
                  <label className="label-field">
                    <span className="inline-flex items-center gap-1.5">
                      <Video className="h-4 w-4 text-slate-400" />
                      Links externos
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
                          addEditLink();
                        }
                      }}
                      placeholder="Cole a URL do vídeo ou link externo"
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={addEditLink}
                      className="btn-secondary flex-shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {editData.video_links && editData.video_links.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {editData.video_links.map((link, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                          <span className="flex-1 truncate text-xs text-slate-600">
                            {link}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeEditLink(link)}
                            className="text-slate-400 transition-colors hover:text-red-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={cancelEditing}
                    className="btn-secondary"
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge bg-globo-50 text-globo-700">
                    {isHomeDay(format.format_type) ? "Home Day" : format.format_type}
                  </span>
                  {format.vertical && format.vertical !== "Outros" && (
                    <span className="badge bg-slate-100 text-slate-500">
                      {format.vertical}
                    </span>
                  )}
                  <span
                    className={`badge ${getStatusBadgeClasses(format.status)}`}
                  >
                    {getStatusLabel(format.status)}
                  </span>
                </div>

                <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-900">
                  {format.title}
                </h1>

                {/* Format details: Home Day additional formats */}
                {isHomeDay(format.format_type) && format.additional_formats && format.additional_formats.length > 0 && (
                  <div className="rounded-xl border border-globo-100 bg-globo-50/40 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Formato principal
                    </p>
                    <p className="text-sm font-semibold text-globo-700">Home Day</p>
                    <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Formatos incluídos
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {format.additional_formats.map((fmt) => (
                        <span key={fmt} className="badge bg-white text-globo-700 border border-globo-100">
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Format details: Outros custom name */}
                {isOutros(format.format_type) && format.outros_formato_name && (
                  <div className="rounded-xl border border-globo-100 bg-globo-50/40 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Formato
                    </p>
                    <p className="text-sm font-semibold text-globo-700">{format.outros_formato_name}</p>
                  </div>
                )}

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                  {format.cliente && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{format.cliente}</span>
                    </div>
                  )}
                  {format.plataforma && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Monitor className="h-4 w-4 text-slate-400" />
                      {format.plataforma}
                    </div>
                  )}
                  {format.publish_date && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {formatDate(format.publish_date)}
                    </div>
                  )}
                </div>

                {format.description && (
                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Descrição
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                      {format.description}
                    </p>
                  </div>
                )}

                {/* Uploaded videos */}
                {format.case_videos && format.case_videos.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <Film className="h-3.5 w-3.5" />
                      Vídeos
                    </h3>
                    <div className="space-y-3">
                      {format.case_videos.map((video) => (
                        <div key={video.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <video controls className="w-full" preload="metadata">
                            <source src={video.video_url} type={video.mime_type || "video/mp4"} />
                          </video>
                          <div className="flex items-center gap-2 px-3 py-2">
                            <FileVideo className="h-4 w-4 flex-shrink-0 text-globo-600" />
                            <span className="flex-1 truncate text-xs text-slate-600">{video.file_name}</span>
                            {video.file_size != null && (
                              <span className="text-[11px] text-slate-400">{formatFileSize(video.file_size)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* External video links */}
                {format.video_links && format.video_links.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <Video className="h-3.5 w-3.5" />
                      Links externos
                    </h3>
                    <div className="space-y-2">
                      {format.video_links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-globo-600 transition-all hover:border-globo-300 hover:bg-globo-50"
                        >
                          <Link2 className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{link}</span>
                          <ExternalLink className="ml-auto h-3.5 w-3.5 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results display */}
                {(() => {
                  const filledMetrics = METRIC_DEFS.filter(
                    (m) => format[m.key] != null
                  );
                  const hasResults =
                    filledMetrics.length > 0 ||
                    (format.outros_resultados &&
                      format.outros_resultados.trim().length > 0);
                  if (!hasResults) return null;
                  return (
                    <div className="border-t border-slate-100 pt-4">
                      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Resultados
                      </h3>
                      {filledMetrics.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          {filledMetrics.map((metric) => (
                            <div
                              key={metric.key}
                              className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3.5"
                            >
                              <p className="text-xs font-medium text-slate-400">
                                {metric.label}
                              </p>
                              <p className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                                {format[metric.key] != null
                                  ? Number(format[metric.key]).toLocaleString("pt-BR")
                                  : ""}
                                {metric.suffix && (
                                  <span className="ml-0.5 text-sm font-semibold text-slate-500">
                                    {metric.suffix}
                                  </span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {format.outros_resultados &&
                        format.outros_resultados.trim().length > 0 && (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                            <p className="text-xs font-medium text-slate-400">
                              Outros resultados / Observações
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                              {format.outros_resultados}
                            </p>
                          </div>
                        )}
                    </div>
                  );
                })()}

                <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Adicionado em {formatDate(format.created_at)}
                  </div>
                  {format.updated_at !== format.created_at && (
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      Atualizado em {formatDateTime(format.updated_at)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />
          <div className="animate-scale-in relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Excluir case?
              </h3>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-slate-600">
              Tem certeza que deseja excluir <strong>"{format.title}"</strong>?
              Esta ação não pode ser desfeita e todas as imagens e vídeos serão removidos
              permanentemente.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger !border-red-600 !bg-red-600 !text-white hover:!bg-red-700"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
