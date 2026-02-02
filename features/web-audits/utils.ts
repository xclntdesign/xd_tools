export type LhCategoryKey = "performance" | "seo" | "best-practices";

export type LhAudit = {
  id: string;
  title: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
  details?: any;
};

export type LhAuditRow = {
  id: string;
  title: string;
  category: LhCategoryKey;
  group: string;
  weight: number;
  score: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
  detailsType?: string;
  audit: LhAudit;
};

export function lhScoreLabel(score: number | null, mode?: string) {
  if (mode === "notApplicable") return "N/A";
  if (mode === "informative") return "Info";
  if (mode === "manual") return "Manual";
  if (score == null) return "—";
  return `${Math.round(score * 100)}`;
}

export function lhScoreVariant(score: number | null, mode?: string) {
  if (mode === "informative" || mode === "manual" || mode === "notApplicable") return "outline";
  if (score == null) return "outline";
  if (score === 0) return "destructive";
  if (score === 1) return "secondary";
  return "outline";
}

export function psiToCategoryModel(payload: any, category: LhCategoryKey) {
  const lr = payload?.lighthouseResult;
  const cat = lr?.categories?.[category];
  const audits: Record<string, LhAudit> = lr?.audits ?? {};

  const categoryScore: number = cat.score * 100;

  const auditRefs = cat?.auditRefs ?? [];

  const rows: LhAuditRow[] = auditRefs
    .map((ref: any) => {
      const audit = audits[ref.id];
      if (!audit) return null;
      return {
        id: audit.id,
        title: audit.title,
        category,
        group: ref.group ?? "other",
        weight: ref.weight ?? 0,
        score: audit.score ?? null,
        scoreDisplayMode: audit.scoreDisplayMode,
        displayValue: audit.displayValue,
        numericValue: audit.numericValue,
        numericUnit: audit.numericUnit,
        detailsType: audit.details?.type,
        audit,
      } as LhAuditRow;
    })
    .filter(Boolean);

  return { categoryScore, rows };
}

export type StoredLhAuditRow = Omit<LhAuditRow, "audit"> & {
  audit: string | LhAudit | null; // JSON string
};

export function hydrateLhAuditRows(stored: StoredLhAuditRow[]): LhAuditRow[] {
  return stored.map((r) => {
    let auditObj: any = null;

    if (typeof r.audit === "string") {
      try {
        auditObj = r.audit ? JSON.parse(r.audit) : null;
      } catch {
        auditObj = null;
      }
    } else if (r.audit && typeof r.audit === "object") {
      auditObj = r.audit;
    } else {
      auditObj = null;
    }

    // Fall back to parsed audit if flattened fields missing
    const id = r.id ?? auditObj?.id ?? "";
    const title = r.title ?? auditObj?.title ?? id;

    return {
      ...r,
      id,
      title,
      score: r.score ?? auditObj?.score ?? null,
      scoreDisplayMode: r.scoreDisplayMode ?? auditObj?.scoreDisplayMode,
      displayValue: r.displayValue ?? auditObj?.displayValue,
      numericValue: r.numericValue ?? auditObj?.numericValue,
      numericUnit: r.numericUnit ?? auditObj?.numericUnit,
      detailsType: r.detailsType ?? auditObj?.details?.type,
      audit: auditObj, // <-- guaranteed object or null
    } as LhAuditRow;
  });
}

export function parseStoredRowsJson(rowsJson: string): LhAuditRow[] {
  const raw = JSON.parse(rowsJson) as StoredLhAuditRow[];
  const hydrated = hydrateLhAuditRows(raw);

  return hydrated.sort((a, b) => {
    const aScore = a.score ?? 1;
    const bScore = b.score ?? 1;

    // 1️⃣ score === 0 first
    if (aScore === 0 && bScore !== 0) return -1;
    if (bScore === 0 && aScore !== 0) return 1;

    // 2️⃣ then informative/manual after real failures
    const aInfo = a.scoreDisplayMode === "informative";
    const bInfo = b.scoreDisplayMode === "informative";
    if (aInfo && !bInfo) return 1;
    if (bInfo && !aInfo) return -1;

    // 3️⃣ then by weight (higher weight first)
    return (b.weight ?? 0) - (a.weight ?? 0);
  });
}

export function capitalizeFirstLetter(string: string): string {
  if (!string) {
    return string;
  }

  const firstLetter = string.charAt(0).toUpperCase();
  const restOfString = string.slice(1);

  return firstLetter + restOfString;
}