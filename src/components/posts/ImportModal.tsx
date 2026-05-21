import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { postsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_ROWS   = 50;
const MAX_BYTES  = 10 * 1024 * 1024; // 10 MB
const ACCEPT_EXT = '.xlsx, .xls, .csv';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'preview' | 'importing' | 'results';

interface ParsedRow { [col: string]: string }

interface NormalizedImportRow {
  rowNo: number;
  content: string;
  post_type: 'text' | 'image' | 'link' | 'video';
  link_url: string;
  scheduled_at: string;
  publish_now: 'true' | 'false';
  image_url: string;
  video_url: string;
}

interface ClientIssue {
  row: number;
  message: string;
}

interface ImportResult {
  imported: number;
  failed:   number;
  total:    number;
  posts:    unknown[];
  warnings: { row?: number; message: string }[];
  errors:   { row?: number; message: string }[];
}

// ── File parser ───────────────────────────────────────────────────────────────

function parseSpreadsheet(file: File): Promise<{ headers: string[]; rows: ParsedRow[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const raw      = e.target?.result;
        const workbook = XLSX.read(raw, { type: 'binary', cellDates: true });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const json     = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
          raw:    false, // format dates as strings
        });

        if (json.length === 0) {
          reject(new Error('The file is empty — no rows found.'));
          return;
        }

        const headers = Object.keys(json[0]);
        const rows: ParsedRow[] = json.map((r) =>
          Object.fromEntries(headers.map((h) => [h, String(r[h] ?? '')]))
        );

        resolve({ headers, rows });
      } catch {
        reject(new Error('Could not parse the file. Make sure it is a valid Excel or CSV file.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsBinaryString(file);
  });
}

// ── Client-side validation + normalization ──────────────────────────────────

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function csvEscape(value: string): string {
  const v = value ?? '';
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function parseFlexibleScheduledAt(input: string): string | null {
  const raw = input.trim();
  if (!raw) return '';

  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && numeric > 1000 && numeric < 100000) {
    const parsed = XLSX.SSF.parse_date_code(numeric);
    if (parsed) {
      const date = new Date(
        parsed.y,
        parsed.m - 1,
        parsed.d,
        parsed.H ?? 0,
        parsed.M ?? 0,
        Math.floor(parsed.S ?? 0),
      );
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
  }

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  // dd/mm/yyyy [hh:mm[:ss]] OR mm/dd/yyyy [hh:mm[:ss]]
  const m = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    let p1 = Number(m[1]);
    let p2 = Number(m[2]);
    const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
    const hh = Number(m[4] ?? 0);
    const mm = Number(m[5] ?? 0);
    const ss = Number(m[6] ?? 0);

    // Prefer day-first when unambiguous.
    const dayFirst = p1 > 12 || (p1 <= 12 && p2 <= 12);
    const day = dayFirst ? p1 : p2;
    const month = dayFirst ? p2 : p1;

    const d = new Date(year, month - 1, day, hh, mm, ss);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  return null;
}

function normalizeBoolean(value: string): 'true' | 'false' {
  const v = value.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes' || v === 'y') return 'true';
  return 'false';
}

function buildCanonicalImport(rows: ParsedRow[]): { normalizedRows: NormalizedImportRow[]; issues: ClientIssue[] } {
  const issues: ClientIssue[] = [];
  const normalizedRows: NormalizedImportRow[] = [];

  rows.forEach((raw, idx) => {
    const rowNo = idx + 2; // +2 because spreadsheet rows are 1-based and row 1 is headers
    const map = new Map<string, string>();
    Object.entries(raw).forEach(([k, v]) => map.set(normalizeHeader(k), String(v ?? '').trim()));

    const content = map.get('content') ?? map.get('post_content') ?? map.get('text') ?? '';
    const rawType = (map.get('post_type') ?? map.get('type') ?? '').toLowerCase();
    const linkUrl = map.get('link_url') ?? map.get('url') ?? map.get('link') ?? '';
    const scheduledRaw =
      map.get('scheduled_at') ??
      map.get('schedule_at') ??
      map.get('publish_at') ??
      map.get('publish_date') ??
      '';
    const publishNow = normalizeBoolean(map.get('publish_now') ?? 'false');
    const imageUrl = map.get('image_url') ?? '';
    const videoUrl = map.get('video_url') ?? '';

    if (!content) {
      issues.push({ row: rowNo, message: 'Missing required "content".' });
      return;
    }

    const postType: NormalizedImportRow['post_type'] =
      rawType === 'image' || rawType === 'link' || rawType === 'video' || rawType === 'text'
        ? rawType
        : (linkUrl ? 'link' : 'text');

    if (linkUrl) {
      try {
        new URL(linkUrl);
      } catch {
        issues.push({ row: rowNo, message: 'Invalid link_url format.' });
        return;
      }
    }

    if (imageUrl) {
      try {
        new URL(imageUrl);
      } catch {
        issues.push({ row: rowNo, message: 'Invalid image_url format.' });
        return;
      }
    }

    if (videoUrl) {
      try {
        new URL(videoUrl);
      } catch {
        issues.push({ row: rowNo, message: 'Invalid video_url format.' });
        return;
      }
    }

    const scheduledAtIso = parseFlexibleScheduledAt(scheduledRaw);
    if (scheduledAtIso === null) {
      issues.push({ row: rowNo, message: 'Invalid scheduled_at format. Use a valid date/time.' });
      return;
    }

    normalizedRows.push({
      rowNo,
      content,
      post_type: postType,
      link_url: linkUrl,
      scheduled_at: scheduledAtIso,
      publish_now: publishNow,
      image_url: imageUrl,
      video_url: videoUrl,
    });
  });

  return { normalizedRows, issues };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DownloadTemplateButton() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      await postsAPI.downloadTemplate();
      toast.success('Template downloaded.');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Could not download template. Check your connection.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-[13px]"
      onClick={handleDownload}
      disabled={loading}
    >
      {loading
        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        : <Download  className="h-3.5 w-3.5" />}
      Download Template
    </Button>
  );
}

// ── Drop zone ─────────────────────────────────────────────────────────────────

interface DropZoneProps {
  onParsed: (headers: string[], rows: ParsedRow[], file: File) => void;
}

function DropZone({ onParsed }: DropZoneProps) {
  const [error,   setError]   = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[], rejected: import('react-dropzone').FileRejection[]) => {
      setError(null);

      if (rejected.length > 0) {
        const code = rejected[0].errors[0]?.code;
        if (code === 'file-too-large') {
          setError(`File is too large. Maximum size is 10 MB.`);
        } else {
          setError('Invalid file type. Please upload an .xlsx, .xls, or .csv file.');
        }
        return;
      }

      const file = accepted[0];
      if (!file) return;

      setParsing(true);
      try {
        const { headers, rows } = await parseSpreadsheet(file);

        if (rows.length > MAX_ROWS) {
          setError(
            `File contains ${rows.length} rows. Maximum allowed is ${MAX_ROWS} rows. ` +
            `Please trim your file and try again.`
          );
          return;
        }

        onParsed(headers, rows, file);
      } catch (err: any) {
        setError(err.message ?? 'Failed to parse the file.');
      } finally {
        setParsing(false);
      }
    },
    [onParsed]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel':                                           ['.xls'],
      'text/csv':                                                            ['.csv'],
      'application/csv':                                                     ['.csv'],
    },
    maxSize:   MAX_BYTES,
    multiple:  false,
    disabled:  parsing,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50',
          parsing && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          {parsing
            ? <RefreshCw className="h-5 w-5 text-primary animate-spin" />
            : <FileSpreadsheet className="h-5 w-5 text-primary" />}
        </div>

        {isDragActive ? (
          <p className="text-sm font-medium text-primary">Drop the file here…</p>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-foreground">
                {parsing ? 'Parsing file…' : 'Drag & drop a file, or click to browse'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Accepts {ACCEPT_EXT} · Max {MAX_ROWS} rows · Max 10 MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ── Preview table ─────────────────────────────────────────────────────────────

interface PreviewTableProps {
  headers: string[];
  rows:    ParsedRow[];
}

function PreviewTable({ headers, rows }: PreviewTableProps) {
  const getColWidth = (header: string): string => {
    const h = header.toLowerCase();
    if (h === 'content' || h === 'post_content' || h === 'text') return 'max-w-[200px]';
    if (h === 'image_url' || h === 'video_url' || h === 'link_url' || h === 'url' || h === 'link' || h === 'image' || h === 'video') return 'max-w-[140px]';
    if (h === 'scheduled_at' || h === 'schedule_at' || h === 'publish_at' || h === 'publish_date') return 'max-w-[100px]';
    return 'max-w-[80px]';
  };

  return (
    <div className="overflow-x-auto overflow-y-auto rounded-lg border border-border max-h-64">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
          <tr>
            <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-8">#</th>
            {headers.map((h) => (
              <th
                key={h}
                className="px-2 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap text-[10px]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                'border-t border-border',
                i % 2 === 0 ? 'bg-background' : 'bg-muted/20'
              )}
            >
              <td className="px-2 py-2 text-muted-foreground font-mono text-[10px]">{i + 1}</td>
              {headers.map((h) => (
                <td
                  key={h}
                  className={cn('px-2 py-2 text-foreground truncate', getColWidth(h))}
                  title={row[h]}
                >
                  {row[h] || <span className="text-muted-foreground/50 italic">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Results view ──────────────────────────────────────────────────────────────

interface ResultsViewProps {
  result:  ImportResult;
  onClose: () => void;
  onReset: () => void;
}

function ResultsView({ result, onClose, onReset }: ResultsViewProps) {
  const allOk = result.failed === 0;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          <div>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">
              {result.imported}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500">
              Imported successfully
            </p>
          </div>
        </div>

        <div className={cn(
          'flex items-center gap-3 rounded-lg border px-4 py-3',
          result.failed > 0
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
            : 'border-border bg-muted/30'
        )}>
          <XCircle className={cn(
            'h-5 w-5 shrink-0',
            result.failed > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-muted-foreground'
          )} />
          <div>
            <p className={cn(
              'text-xl font-bold',
              result.failed > 0
                ? 'text-red-700 dark:text-red-400'
                : 'text-muted-foreground'
            )}>
              {result.failed}
            </p>
            <p className={cn(
              'text-xs',
              result.failed > 0
                ? 'text-red-600 dark:text-red-500'
                : 'text-muted-foreground'
            )}>
              Failed
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">
          Total rows processed: <span className="font-semibold text-foreground">{result.total}</span>
        </p>
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Warnings
          </p>
          <div className="max-h-48 overflow-auto rounded-lg border border-amber-200 dark:border-amber-800 space-y-0 divide-y divide-amber-100 dark:divide-amber-900">
            {result.warnings.map((warn, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 px-3 py-2.5 text-sm bg-amber-50/40 dark:bg-amber-950/20"
              >
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] px-1.5 py-0 h-4 font-mono border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                >
                  {warn.row ? `Row ${warn.row}` : 'Warning'}
                </Badge>
                <span className="text-amber-800 dark:text-amber-300 leading-snug">{warn.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error list */}
      {result.errors && result.errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Errors
          </p>
          <div className="max-h-48 overflow-auto rounded-lg border border-border space-y-0 divide-y divide-border">
            {result.errors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 px-3 py-2.5 text-sm bg-background"
              >
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] px-1.5 py-0 h-4 font-mono badge-error"
                >
                  {err.row ? `Row ${err.row}` : 'Error'}
                </Badge>
                <span className="text-muted-foreground leading-snug">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        {!allOk && (
          <Button variant="outline" size="sm" onClick={onReset}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import another file
          </Button>
        )}
        <Button size="sm" onClick={onClose}>
          {allOk ? 'Done' : 'Close'}
        </Button>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface ImportModalProps {
  open:           boolean;
  onOpenChange:   (open: boolean) => void;
  onImportDone:   () => void; // called after successful import to refresh posts
}

export function ImportModal({ open, onOpenChange, onImportDone }: ImportModalProps) {
  const [step,    setStep]    = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows,    setRows]    = useState<ParsedRow[]>([]);
  const [normalizedRows, setNormalizedRows] = useState<NormalizedImportRow[]>([]);
  const [clientIssues, setClientIssues] = useState<ClientIssue[]>([]);
  const [file,    setFile]    = useState<File | null>(null);
  const [result,  setResult]  = useState<ImportResult | null>(null);

  const reset = () => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setNormalizedRows([]);
    setClientIssues([]);
    setFile(null);
    setResult(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleParsed = (h: string[], r: ParsedRow[], f: File) => {
    const { normalizedRows: validRows, issues } = buildCanonicalImport(r);
    setHeaders(h);
    setRows(r);
    setNormalizedRows(validRows);
    setClientIssues(issues);
    setFile(f);
    setStep('preview');
  };

  const handleImport = async () => {
    if (!file) return;
    if (normalizedRows.length === 0) {
      toast.error('No rows found to import.');
      return;
    }
    if (clientIssues.length > 0) {
      toast.error('Some rows are invalid. Please fix the highlighted issues before importing.');
      return;
    }
    setStep('importing');

    try {
      const csvHeader = 'content,post_type,link_url,scheduled_at,publish_now,image_url,video_url';
      const csvRows = normalizedRows.map((r) =>
        [
          r.content,
          r.post_type,
          r.link_url,
          r.scheduled_at,
          r.publish_now,
          r.image_url,
          r.video_url,
        ].map(csvEscape).join(',')
      );
      const canonicalCsv = [csvHeader, ...csvRows].join('\n');
      const canonicalFile = new File([canonicalCsv], 'posts_import.csv', { type: 'text/csv;charset=utf-8' });

      const data = await postsAPI.importPosts(canonicalFile, canonicalFile.name);
      setResult({
        imported: data.imported ?? 0,
        failed: data.failed ?? 0,
        total: data.total ?? normalizedRows.length,
        posts: data.posts ?? [],
        warnings: data.warnings ?? [],
        errors: data.errors ?? [],
      });
      setStep('results');

      if ((data.imported ?? 0) > 0) {
        onImportDone();
        toast.success(`${data.imported} post${data.imported === 1 ? '' : 's'} imported.`);
      }

      if ((data.warnings?.length ?? 0) > 0) {
        toast.warning(`Import completed with ${data.warnings?.length} warning${data.warnings?.length === 1 ? '' : 's'}.`);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error   ||
        err.message                 ||
        'Import failed. Please try again.';
      toast.error(msg);
      setStep('preview'); // let them retry
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="icon-container-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
            </div>
            Import Posts from File
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to bulk-import posts. Max {MAX_ROWS} rows per file.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-5">

          {/* ── Upload step ── */}
          {step === 'upload' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Don't have a template?{' '}
                  <span className="text-foreground font-medium">Download one below.</span>
                </p>
                <DownloadTemplateButton />
              </div>

              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Required Bulk Import Columns
                </p>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  <Badge variant="outline" className="text-[10px]">content (required)</Badge>
                  <Badge variant="outline" className="text-[10px]">post_type</Badge>
                  <Badge variant="outline" className="text-[10px]">link_url</Badge>
                  <Badge variant="outline" className="text-[10px]">scheduled_at</Badge>
                  <Badge variant="outline" className="text-[10px]">publish_now</Badge>
                  <Badge variant="outline" className="text-[10px]">image_url (optional)</Badge>
                  <Badge variant="outline" className="text-[10px]">video_url (optional)</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Use the downloaded template for exact backend-supported columns and formats.
                </p>
              </div>

              <DropZone onParsed={handleParsed} />
            </>
          )}

          {/* ── Preview step ── */}
          {step === 'preview' && file && (
            <>
              {/* File info bar */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground truncate max-w-[280px]">
                    {file.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {rows.length} row{rows.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {normalizedRows.length} valid
                  </Badge>
                  {clientIssues.length > 0 && (
                    <Badge variant="outline" className="text-[10px] shrink-0 badge-error">
                      {clientIssues.length} row issue{clientIssues.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={reset}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <PreviewTable headers={headers} rows={rows} />

              {clientIssues.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-destructive mb-1.5">
                    Fix These Rows Before Import
                  </p>
                  <div className="space-y-1 max-h-36 overflow-auto">
                    {clientIssues.slice(0, 12).map((issue, i) => (
                      <p key={i} className="text-xs text-destructive">
                        Row {issue.row}: {issue.message}
                      </p>
                    ))}
                    {clientIssues.length > 12 && (
                      <p className="text-xs text-destructive/80">
                        +{clientIssues.length - 12} more issue{clientIssues.length - 12 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={reset}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleImport} disabled={normalizedRows.length === 0 || clientIssues.length > 0}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Import {normalizedRows.length} post{normalizedRows.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </>
          )}

          {/* ── Importing step ── */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Importing posts…</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This may take a moment.
                </p>
              </div>
            </div>
          )}

          {/* ── Results step ── */}
          {step === 'results' && result && (
            <ResultsView
              result={result}
              onClose={() => handleClose(false)}
              onReset={reset}
            />
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
