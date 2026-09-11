import { Link } from "react-router-dom";
import { ImageIcon, Images } from "lucide-react";
import type { AdFormat } from "../types";
import { getStatusBadgeClasses, getStatusLabel } from "../utils/format";

interface FormatCardProps {
  format: AdFormat;
  index?: number;
}

export default function FormatCard({ format, index = 0 }: FormatCardProps) {
  const imageCount = format.case_images?.length || (format.image_url ? 1 : 0);

  return (
    <Link
      to={`/format/${format.id}`}
      className="card card-hover group block overflow-hidden animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200/60">
        {format.image_url ? (
          <img
            src={format.image_url}
            alt={format.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-slate-300" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Status badge */}
        <div className="absolute left-3 top-3">
          <span
            className={`badge backdrop-blur-md ${getStatusBadgeClasses(format.status)}`}
          >
            {getStatusLabel(format.status)}
          </span>
        </div>

        {/* Multi-image indicator */}
        {imageCount > 1 && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-700 shadow-soft backdrop-blur-md">
            <Images className="h-3 w-3" />
            {imageCount}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Formato as primary badge */}
        <div className="mb-2.5 flex items-center gap-2">
          <span className="badge bg-globo-50 text-globo-700">
            {format.format_type}
          </span>
          {format.vertical && format.vertical !== "Outros" && (
            <span className="badge bg-slate-100 text-slate-500">
              {format.vertical}
            </span>
          )}
        </div>

        <h3 className="mb-1.5 line-clamp-1 text-base font-semibold text-slate-900 transition-colors duration-200 group-hover:text-globo-700">
          {format.title}
        </h3>

        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
          {format.description || "Sem descrição"}
        </p>

        {format.cliente && (
          <p className="text-xs text-slate-400">{format.cliente}</p>
        )}
      </div>
    </Link>
  );
}
