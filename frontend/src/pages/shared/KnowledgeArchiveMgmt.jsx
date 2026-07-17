import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Tag,
  Spin,
  Empty,
  Drawer,
} from "antd";
import {
  Library,
  Sparkles,
  UploadCloud,
  Search,
  FileCode2,
  FileText,
  FileType,
  Eye,
  Trash2,
  RotateCw,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Globe,
  Lock,
  BrainCircuit,
  Inbox,
} from "lucide-react";
import axiosClient, { TokenService } from "../../services/api/axiosClient";
import clubApi from "../../services/api/clubs/clubApi";
import { decodeJwtPayload } from "../../utils/tokenGuard";
import { isCanceledRequest } from "../../utils/apiErrors";
import { useToast } from "../../contexts/ToastContext";
import { useConfirm } from "../../contexts/ConfirmContext";

const VALID_EXTENSIONS = [".md", ".txt", ".pdf"];
const POLL_INTERVAL_MS = 5000;

const STATUS_CONFIG = {
  Pending:    { color: "orange",  label: "Chờ xử lý",   icon: Clock },
  Processing: { color: "blue",    label: "Đang xử lý", icon: Loader2, spin: true },
  Success:    { color: "green",   label: "Thành công", icon: CheckCircle2 },
  Failed:     { color: "red",     label: "Thất bại",   icon: AlertCircle },
};

const STAT_CARDS = [
  { key: "total",        label: "Tổng tài liệu",       accent: "from-[#F37021]/15 to-orange-50", icon: Library },
  { key: "success",      label: "Đã index",            accent: "from-emerald-500/15 to-emerald-50", icon: CheckCircle2 },
  { key: "processing",   label: "Đang xử lý",          accent: "from-blue-500/15 to-blue-50", icon: Loader2 },
  { key: "failed",       label: "Thất bại",            accent: "from-red-500/15 to-red-50", icon: AlertCircle },
  { key: "public",       label: "Public",              accent: "from-violet-500/15 to-violet-50", icon: Globe },
  { key: "clubInternal", label: "ClubInternal",        accent: "from-slate-500/15 to-slate-50", icon: Lock },
];

function resolveKnowledgeClaims() {
  const payload = decodeJwtPayload(TokenService.getAccess());
  const parsedClubId = Number(payload?.clubId);

  return {
    roleName: payload?.roleName ?? null,
    clubRole: payload?.clubRole ?? null,
    clubId: Number.isInteger(parsedClubId) && parsedClubId > 0 ? parsedClubId : null,
  };
}
function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.content ?? data?.data ?? [];
}

function dedupeArchives(list) {
  const map = new Map();
  for (const item of list) {
    const id = item.archiveID ?? item.id;
    if (id != null) map.set(id, item);
  }
  return Array.from(map.values());
}

function isValidFile(file) {
  const name = (file?.name ?? "").toLowerCase();
  return VALID_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function buildArchiveFileHref(archiveID) {
  if (archiveID == null) return null;
  const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:8080/api").replace(/\/$/, "");
  return `${apiBaseUrl}/v1/knowledge-archive/${archiveID}/file`;
}
function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function contentPreview(text, max = 80) {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max)}…`;
}

function extractErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message
    ?? err?.response?.data?.error
    ?? err?.message
    ?? fallback
  );
}

function StatCard({ label, value, accent, icon: Icon }) {
  const num = Number(value) || 0;
  return (
    <div
      className={`rounded-2xl border border-white/80 bg-gradient-to-br ${accent} p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800 tabular-nums">{num}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-2 text-[#F37021]">
          <Icon size={20} aria-hidden />
        </div>
      </div>
    </div>
  );
}

function SourceFormatIcon({ format, size = 18 }) {
  const fmt = (format ?? "MD").toUpperCase();
  if (fmt === "PDF") return <FileType size={size} className="text-red-500 shrink-0" aria-hidden />;
  if (fmt === "TXT") return <FileText size={size} className="text-blue-500 shrink-0" aria-hidden />;
  return <FileCode2 size={size} className="text-[#F37021] shrink-0" aria-hidden />;
}

function IndexingStatusTag({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { color: "default", label: status ?? "—", icon: Clock };
  const Icon = cfg.icon;
  return (
    <Tag color={cfg.color} className="inline-flex items-center gap-1 m-0">
      <Icon size={12} className={cfg.spin ? "animate-spin" : ""} aria-hidden />
      {cfg.label}
    </Tag>
  );
}

function VisibilityTag({ scope }) {
  if (scope === "Public") {
    return (
      <Tag color="purple" className="inline-flex items-center gap-1 m-0">
        <Globe size={12} aria-hidden /> Public
      </Tag>
    );
  }
  return (
    <Tag color="default" className="inline-flex items-center gap-1 m-0">
      <Lock size={12} aria-hidden /> ClubInternal
    </Tag>
  );
}

function EmptyState({ onUpload }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white py-16 px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
      <div className="relative">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F37021]/20 to-orange-50 text-[#F37021]">
          <Inbox size={32} aria-hidden />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Chưa có tài liệu tri thức</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          Tải lên file Markdown, TXT hoặc PDF để xây dựng cơ sở tri thức cho AI chatbot.
        </p>
        <Button
          type="primary"
          className="mt-6 cursor-pointer"
          icon={<UploadCloud size={16} />}
          onClick={onUpload}
          style={{ background: "#F37021", borderColor: "#F37021" }}
        >
          Tải tài liệu lên
        </Button>
      </div>
    </div>
  );
}

function FilteredEmptyState({ onReset }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <Empty
        description="Không tìm thấy tài liệu phù hợp"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
      <Button className="mt-4 cursor-pointer" icon={<RotateCw size={16} />} onClick={onReset}>
        Xóa bộ lọc
      </Button>
    </div>
  );
}

function LoadErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/50 px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertCircle size={28} aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">Không thể tải kho tri thức</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">{message}</p>
      <Button className="mt-5 cursor-pointer" icon={<RotateCw size={16} />} onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  );
}

export default function KnowledgeArchiveMgmt() {
  const toast = useToast();
  const confirm = useConfirm();
  const { roleName, clubRole, clubId: userClubId } = resolveKnowledgeClaims();
  const isAdminOrIcpdp = roleName === "Admin" || roleName === "ICPDP";
  const isLeader = clubRole === "Leader" || clubRole === "ViceLeader";
  const canAccess = isAdminOrIcpdp || isLeader;

  const [archives, setArchives] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [openingFileId, setOpeningFileId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formatFilter, setFormatFilter] = useState("All");
  const [visibilityFilter, setVisibilityFilter] = useState("All");
  const [clubFilter, setClubFilter] = useState("All");

  const [uploadForm] = Form.useForm();
  const [uploadFileList, setUploadFileList] = useState([]);
  const pollRef = useRef(null);
  const archiveLoadQueueRef = useRef(Promise.resolve(false));
  const hasLoadedArchivesRef = useRef(false);
  const clubsRef = useRef([]);
  const detailRequestSequenceRef = useRef(0);
  const mountedRef = useRef(true);

  const clubNameMap = useMemo(() => {
    const map = new Map();
    for (const c of clubs) {
      const id = c.clubID ?? c.id;
      if (id != null) {
        const name = c.name ?? c.clubName ?? `CLB #${id}`;
        const status = c.clubStatus ?? c.status;
        const statusSuffix = status && status !== "Active" ? ` (${status})` : "";
        map.set(id, `${name}${statusSuffix}`);
      }
    }
    return map;
  }, [clubs]);

  const getClubLabel = useCallback(
    (clubID) => (clubID != null ? (clubNameMap.get(clubID) ?? `CLB #${clubID}`) : "—"),
    [clubNameMap],
  );

  const storeClubs = useCallback((clubList) => {
    clubsRef.current = clubList;
    if (mountedRef.current) setClubs(clubList);
  }, []);

  const loadClubList = useCallback(async () => {
    try {
      if (isAdminOrIcpdp) {
        const response = await clubApi.getAllForManagement();
        const clubList = normalizeList(response);
        storeClubs(clubList);
        return { ok: true, clubList };
      }

      if (!userClubId) {
        toast.error("Không tìm thấy câu lạc bộ trong thông tin đăng nhập.");
        return { ok: false, clubList: clubsRef.current };
      }

      const response = await clubApi.getById(userClubId);
      const club = response?.data ?? response;
      const clubList = club ? [club] : [];
      storeClubs(clubList);
      return { ok: true, clubList };
    } catch (err) {
      if (isCanceledRequest(err)) {
        return { ok: false, canceled: true, clubList: clubsRef.current };
      }
      toast.error(extractErrorMessage(err, "Không thể tải danh sách câu lạc bộ."));
      return { ok: false, clubList: clubsRef.current };
    }
  }, [isAdminOrIcpdp, storeClubs, toast, userClubId]);

  const performArchiveLoad = useCallback(async (clubList, { silent = false } = {}) => {
    if (!canAccess) return false;

    try {
      const publicResponse = await axiosClient.get("/v1/knowledge-archive/public");
      let merged = normalizeList(publicResponse);

      if (isAdminOrIcpdp) {
        const clubIds = [...new Set(clubList.map((club) => club.clubID ?? club.id).filter(Boolean))];
        const results = await Promise.allSettled(
          clubIds.map((id) => axiosClient.get(`/v1/knowledge-archive/club/${id}`)),
        );
        const rejected = results.filter((result) => result.status === "rejected");

        if (rejected.length > 0) {
          const realFailures = rejected.filter((result) => !isCanceledRequest(result.reason));
          if (realFailures.length === 0) return false;
          const loadMessage = `Chưa tải được tài liệu của ${realFailures.length} câu lạc bộ.`;
          if (mountedRef.current && !hasLoadedArchivesRef.current) {
            setLoadError(loadMessage);
          }

          if (!silent) {
            toast.warning(`Chưa tải được tài liệu của ${realFailures.length} câu lạc bộ. Dữ liệu cũ được giữ nguyên.`);
          }
          return false;
        }

        for (const result of results) {
          merged = merged.concat(normalizeList(result.value));
        }
      } else if (userClubId) {
        const clubResponse = await axiosClient.get(`/v1/knowledge-archive/club/${userClubId}`);
        merged = merged.concat(normalizeList(clubResponse));
      }

      hasLoadedArchivesRef.current = true;
      if (mountedRef.current) {
        setArchives(dedupeArchives(merged));
        setLoadError(null);
      }
      return true;
    } catch (err) {
      if (isCanceledRequest(err)) return false;
      if (!silent) toast.error(extractErrorMessage(err, "Không thể tải danh sách tài liệu."));
      if (mountedRef.current && !hasLoadedArchivesRef.current) {
        setLoadError(extractErrorMessage(err, "Không thể tải danh sách tài liệu."));
      }
      return false;
    }
  }, [canAccess, isAdminOrIcpdp, toast, userClubId]);

  const loadArchives = useCallback((clubList, options = {}) => {
    const queuedLoad = archiveLoadQueueRef.current
      .catch(() => false)
      .then(() => (
        mountedRef.current ? performArchiveLoad(clubList, options) : false
      ));
    archiveLoadQueueRef.current = queuedLoad;
    return queuedLoad;
  }, [performArchiveLoad]);

  const refreshData = useCallback(async ({ silent = false, reloadClubs = true } = {}) => {
    if (!canAccess) return false;
    if (!silent && mountedRef.current) setLoading(true);

    try {
      let clubList = clubsRef.current;
      if (reloadClubs) {
        const clubResult = await loadClubList();
        if (clubResult.canceled) return false;
        clubList = clubResult.clubList;
        if (!clubResult.ok && isAdminOrIcpdp) {
          if (mountedRef.current && !hasLoadedArchivesRef.current) {
            setLoadError("Không thể tải dữ liệu kho tri thức. Vui lòng thử lại.");
          }
          return false;
        }
      }
      const loaded = await loadArchives(clubList, { silent });
      if (!loaded && mountedRef.current && !hasLoadedArchivesRef.current) {
        setLoadError((current) => (
          current ?? "Không thể tải dữ liệu kho tri thức. Vui lòng thử lại."
        ));
      }
      return loaded;
    } finally {
      if (!silent && mountedRef.current) setLoading(false);
    }
  }, [canAccess, isAdminOrIcpdp, loadArchives, loadClubList]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      detailRequestSequenceRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!canAccess) return undefined;
    const startId = window.setTimeout(() => {
      void refreshData();
    }, 0);
    return () => window.clearTimeout(startId);
  }, [canAccess, refreshData]);

  const hasPendingOrProcessing = useMemo(
    () => archives.some((archive) => (
      archive.indexingStatus === "Pending" || archive.indexingStatus === "Processing"
    )),
    [archives],
  );

  useEffect(() => {
    let stopped = false;

    if (!hasPendingOrProcessing) {
      if (pollRef.current) {
        window.clearTimeout(pollRef.current);
        pollRef.current = null;
      }
      return undefined;
    }

    const poll = async () => {
      if (stopped) return;
      try {
        await loadArchives(clubsRef.current, { silent: true });
      } finally {
        if (!stopped) pollRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    pollRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      if (pollRef.current) {
        window.clearTimeout(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [hasPendingOrProcessing, loadArchives]);
  const stats = useMemo(() => ({
    total: archives.length,
    success: archives.filter((a) => a.indexingStatus === "Success").length,
    processing: archives.filter((a) => a.indexingStatus === "Processing" || a.indexingStatus === "Pending").length,
    failed: archives.filter((a) => a.indexingStatus === "Failed").length,
    public: archives.filter((a) => a.visibilityScope === "Public").length,
    clubInternal: archives.filter((a) => a.visibilityScope === "ClubInternal").length,
  }), [archives]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return archives.filter((a) => {
      if (statusFilter !== "All" && a.indexingStatus !== statusFilter) return false;
      if (formatFilter !== "All" && (a.sourceFormat ?? "").toUpperCase() !== formatFilter) return false;
      if (visibilityFilter !== "All" && a.visibilityScope !== visibilityFilter) return false;
      if (clubFilter !== "All" && String(a.clubID) !== String(clubFilter)) return false;
      if (!q) return true;
      const hay = `${a.title ?? ""} ${a.content ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [archives, search, statusFilter, formatFilter, visibilityFilter, clubFilter]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setFormatFilter("All");
    setVisibilityFilter("All");
    setClubFilter("All");
  };

  const canManage = useCallback(
    (record) => {
      if (isAdminOrIcpdp) return true;
      if (isLeader && userClubId != null) return Number(record.clubID) === userClubId;
      return false;
    },
    [isAdminOrIcpdp, isLeader, userClubId],
  );

  const openUpload = () => {
    uploadForm.resetFields();
    setUploadFileList([]);
    if (isLeader) {
      uploadForm.setFieldsValue({
        visibilityScope: "ClubInternal",
        clubID: userClubId,
      });
    }
    setUploadOpen(true);
  };

  const handleUpload = async () => {
    try {
      const values = await uploadForm.validateFields();
      const file = uploadFileList[0]?.originFileObj ?? uploadFileList[0];
      if (!file) {
        toast.error("Vui lòng chọn file (.md, .txt hoặc .pdf).");
        return;
      }
      if (!isValidFile(file)) {
        toast.error("Chỉ chấp nhận file .md, .txt hoặc .pdf.");
        return;
      }

      const clubID = isLeader ? userClubId : values.clubID;
      const visibilityScope = isLeader ? "ClubInternal" : values.visibilityScope;

      if (!clubID) {
        toast.error("Vui lòng chọn câu lạc bộ.");
        return;
      }

      // Đóng gói dữ liệu đầu vào (file, tiêu đề, ID CLB, phạm vi truy cập) vào FormData để gửi lên server.
      // Đầu ra mong đợi: Hệ thống tiếp nhận file, lưu tạm và trả về thông báo thành công trước khi tiến hành xử lý ngầm (vector hóa).
      const formData = new FormData();
      formData.append("title", values.title.trim());
      formData.append("file", file);
      formData.append("clubID", String(clubID));
      formData.append("visibilityScope", visibilityScope);

      setUploading(true);
      await axiosClient.post("/v1/knowledge-archive", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Tải tài liệu lên thành công. Đang chờ index…");
      setUploadOpen(false);
      uploadForm.resetFields();
      setUploadFileList([]);
      await loadArchives(clubsRef.current);
    } catch (err) {
      if (err?.errorFields) return;
      toast.error(extractErrorMessage(err, "Tải lên thất bại. Vui lòng thử lại."));
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (record) => {
    const requestSequence = detailRequestSequenceRef.current + 1;
    detailRequestSequenceRef.current = requestSequence;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);

    try {
      const data = await axiosClient.get(`/v1/knowledge-archive/${record.archiveID}`);
      if (requestSequence !== detailRequestSequenceRef.current || !mountedRef.current) return;
      setDetail(data?.data ?? data);
    } catch (err) {
      if (requestSequence !== detailRequestSequenceRef.current || isCanceledRequest(err)) return;
      setDetail(null);
      setDetailOpen(false);
      const status = err?.response?.status;
      if (status === 403) toast.error("Bạn không có quyền thực hiện thao tác này.");
      else if (status === 404) toast.error("Tài liệu không tồn tại hoặc đã bị xóa.");
      else toast.error(extractErrorMessage(err, "Không thể tải chi tiết tài liệu."));
    } finally {
      if (requestSequence === detailRequestSequenceRef.current && mountedRef.current) {
        setDetailLoading(false);
      }
    }
  };

  const handleCloseDetail = () => {
    detailRequestSequenceRef.current += 1;
    setDetailOpen(false);
    setDetailLoading(false);
    setDetail(null);
  };
  const handleOpenFile = async (archive) => {
    const fileHref = buildArchiveFileHref(archive?.archiveID);
    if (!fileHref) {
      toast.error("Không tìm thấy file gốc của tài liệu.");
      return;
    }

    const fileWindow = window.open("", "_blank");
    if (!fileWindow) {
      toast.error("Trình duyệt đã chặn tab mới. Vui lòng cho phép popup để mở file.");
      return;
    }

    setOpeningFileId(archive.archiveID);
    try {
      const fileBlob = await axiosClient.get(fileHref, { responseType: "blob" });
      const objectUrl = URL.createObjectURL(fileBlob);
      fileWindow.opener = null;
      fileWindow.location.replace(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err) {
      fileWindow.close();
      const status = err?.response?.status;
      if (status === 403) toast.error("Bạn không có quyền mở file này.");
      else if (status === 404) toast.error("Không tìm thấy file gốc của tài liệu.");
      else toast.error(extractErrorMessage(err, "Không thể mở file. Vui lòng thử lại."));
    } finally {
      setOpeningFileId(null);
    }
  };
  const handleDelete = async (record) => {
    if (activeAction) return;
    if (!(await confirm(`Xóa tài liệu "${record.title}"? Hành động này không thể hoàn tác.`))) return;
    setActiveAction({ archiveID: record.archiveID, type: "delete" });
    try {
      await axiosClient.delete(`/v1/knowledge-archive/${record.archiveID}`);
      toast.success("Đã xóa tài liệu.");
      await loadArchives(clubsRef.current);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) toast.error("Bạn không có quyền thực hiện thao tác này.");
      else toast.error(extractErrorMessage(err, "Xóa tài liệu thất bại."));
    } finally {
      if (mountedRef.current) setActiveAction(null);
    }
  };

  const handleReindex = async (record) => {
    if (activeAction) return;
    setActiveAction({ archiveID: record.archiveID, type: "reindex" });
    try {
      await axiosClient.post(`/v1/knowledge-archive/${record.archiveID}/reindex`);
      toast.success("Đã gửi yêu cầu index lại.");
      await loadArchives(clubsRef.current);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) toast.error("Bạn không có quyền thực hiện thao tác này.");
      else toast.error(extractErrorMessage(err, "Index lại thất bại."));
    } finally {
      if (mountedRef.current) setActiveAction(null);
    }
  };
  const columns = [
    {
      title: "Tài liệu",
      key: "title",
      render: (_, r) => (
        <div className="flex items-start gap-2 min-w-[180px]">
          <SourceFormatIcon format={r.sourceFormat} />
          <div className="min-w-0">
            <p className="font-medium text-slate-800 truncate">{r.title ?? "—"}</p>
            {r.content && (
              <p className="text-xs text-slate-400 truncate">{contentPreview(r.content)}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Phạm vi",
      dataIndex: "visibilityScope",
      key: "scope",
      width: 130,
      render: (v) => <VisibilityTag scope={v} />,
    },
    {
      title: "CLB sở hữu",
      dataIndex: "clubID",
      key: "club",
      width: 140,
      render: (id) => <span className="text-slate-600 text-sm">{getClubLabel(id)}</span>,
    },
    {
      title: "Định dạng",
      dataIndex: "sourceFormat",
      key: "format",
      width: 90,
      render: (v) => <Tag className="m-0">{(v ?? "MD").toUpperCase()}</Tag>,
    },
    {
      title: "Trạng thái index",
      dataIndex: "indexingStatus",
      key: "status",
      width: 140,
      render: (v) => <IndexingStatusTag status={v} />,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (v) => <span className="text-sm text-slate-500">{formatDate(v)}</span>,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, r) => {
        const manage = canManage(r);
        return (
          <div className="flex items-center gap-1">
            <Button
              type="text"
              size="small"
              className="cursor-pointer"
              aria-label="Xem chi tiết"
              icon={<Eye size={16} />}
              onClick={() => handleView(r)}
            />
            {manage && r.indexingStatus === "Failed" && (
              <Button
                type="text"
                size="small"
                className="cursor-pointer text-[#F37021]"
                aria-label="Thử index lại"
                icon={<RotateCw size={16} />}
                loading={activeAction?.archiveID === r.archiveID && activeAction.type === "reindex"}
                disabled={Boolean(activeAction)}
                onClick={() => handleReindex(r)}
              />
            )}
            {manage && (
              <Button
                type="text"
                size="small"
                danger
                className="cursor-pointer"
                aria-label="Xóa tài liệu"
                icon={<Trash2 size={16} />}
                loading={activeAction?.archiveID === r.archiveID && activeAction.type === "delete"}
                disabled={Boolean(activeAction)}
                onClick={() => handleDelete(r)}
              />
            )}
          </div>
        );
      },
    },
  ];

  if (!canAccess) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-white border border-slate-100 p-8">
        <Empty description="Bạn không có quyền truy cập trang này." />
      </div>
    );
  }

  const detailFileHref = buildArchiveFileHref(detail?.archiveID);
  const isPdfDetail = (detail?.sourceFormat ?? "").toUpperCase() === "PDF";

  return (
    <div className="space-y-6 ka-fade-in motion-reduce:opacity-100">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-white via-orange-50/40 to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-[#F37021] text-white shadow-md">
              <Library size={24} aria-hidden />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-800">Kho Tri Thức</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F37021]/10 px-2.5 py-0.5 text-xs font-semibold text-[#E6430A]">
                  <Sparkles size={12} aria-hidden /> AI Knowledge Base
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 flex items-center gap-1.5">
                <BrainCircuit size={14} className="text-[#F37021]" aria-hidden />
                Quản lý tài liệu dùng cho AI chatbot / RAG
              </p>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<UploadCloud size={18} />}
            onClick={openUpload}
            className="cursor-pointer shadow-sm"
            style={{ background: "#F37021", borderColor: "#F37021" }}
          >
            Tải tài liệu lên
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STAT_CARDS.map(({ key, label, accent, icon }) => (
          <StatCard key={key} label={label} value={stats[key]} accent={accent} icon={icon} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <Input
            allowClear
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder="Tìm theo tiêu đề hoặc nội dung…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="min-w-[140px]"
            options={[
              { value: "All", label: "Tất cả trạng thái" },
              { value: "Pending", label: "Pending" },
              { value: "Processing", label: "Processing" },
              { value: "Success", label: "Success" },
              { value: "Failed", label: "Failed" },
            ]}
          />
          <Select
            value={formatFilter}
            onChange={setFormatFilter}
            className="min-w-[120px]"
            options={[
              { value: "All", label: "Tất cả định dạng" },
              { value: "MD", label: "MD" },
              { value: "TXT", label: "TXT" },
              { value: "PDF", label: "PDF" },
            ]}
          />
          <Select
            value={visibilityFilter}
            onChange={setVisibilityFilter}
            className="min-w-[140px]"
            options={[
              { value: "All", label: "Tất cả phạm vi" },
              { value: "Public", label: "Public" },
              { value: "ClubInternal", label: "ClubInternal" },
            ]}
          />
          {isAdminOrIcpdp && clubs.length > 0 && (
            <Select
              value={clubFilter}
              onChange={setClubFilter}
              className="min-w-[160px]"
              showSearch
              optionFilterProp="label"
              options={[
                { value: "All", label: "Tất cả CLB" },
                ...clubs.map((c) => {
                  const id = c.clubID ?? c.id;
                  return { value: String(id), label: getClubLabel(id) };
                }),
              ]}
            />
          )}
          <Button
            icon={<RotateCw size={16} />}
            onClick={() => refreshData()}
            className="cursor-pointer ml-auto"
            loading={loading}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading && archives.length === 0 ? (
          <div className="flex justify-center py-20">
            <Spin indicator={<Loader2 className="animate-spin text-[#F37021]" size={32} />} />
          </div>
        ) : loadError && archives.length === 0 ? (
          <div className="p-6">
            <LoadErrorState message={loadError} onRetry={() => refreshData()} />
          </div>
        ) : archives.length === 0 ? (
          <div className="p-6">
            <EmptyState onUpload={openUpload} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <FilteredEmptyState onReset={resetFilters} />
          </div>
        ) : (
          <Table
            rowKey={(r) => r.archiveID}
            columns={columns}
            dataSource={filtered}
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} tài liệu` }}
            scroll={{ x: 960 }}
            className="knowledge-archive-table"
            rowClassName={() => "hover:bg-orange-50/30 transition-colors duration-150"}
          />
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        title="Tải tài liệu lên Kho Tri Thức"
        open={uploadOpen}
        onCancel={() => !uploading && setUploadOpen(false)}
        onOk={handleUpload}
        okText="Tải lên"
        cancelText="Huỷ"
        confirmLoading={uploading}
        forceRender
        width={520}
        okButtonProps={{ style: { background: "#F37021", borderColor: "#F37021" } }}
      >
        <Form form={uploadForm} layout="vertical" className="mt-4">
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tiêu đề." }]}
          >
            <Input placeholder="VD: Quy chế hoạt động CLB 2025" maxLength={200} />
          </Form.Item>

          <Form.Item label="File tài liệu" required>
            <Upload.Dragger
              accept=".md,.txt,.pdf"
              maxCount={1}
              fileList={uploadFileList}
              beforeUpload={(file) => {
                if (!isValidFile(file)) {
                  toast.error("Chỉ chấp nhận file .md, .txt hoặc .pdf.");
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
              onChange={({ fileList }) => setUploadFileList(fileList.slice(-1))}
              onRemove={() => setUploadFileList([])}
            >
              <p className="ant-upload-drag-icon flex justify-center text-[#F37021]">
                <UploadCloud size={40} />
              </p>
              <p className="ant-upload-text">Kéo thả hoặc bấm để chọn file</p>
              <p className="ant-upload-hint text-slate-400">
                Hỗ trợ .md, .txt, .pdf — tối đa 5MB (backend kiểm tra)
              </p>
            </Upload.Dragger>
          </Form.Item>

          {isAdminOrIcpdp ? (
            <>
              <Form.Item
                name="visibilityScope"
                label="Phạm vi hiển thị"
                initialValue="ClubInternal"
                rules={[{ required: true, message: "Vui lòng chọn phạm vi." }]}
              >
                <Select
                  options={[
                    { value: "Public", label: "Public — tất cả người dùng đã đăng nhập" },
                    { value: "ClubInternal", label: "ClubInternal — nội bộ CLB" },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="clubID"
                label="Chọn CLB sở hữu"
                extra="Tài liệu Public vẫn phải gắn với CLB sở hữu; điều này không giới hạn người đã đăng nhập xem tài liệu."
                rules={[{ required: true, message: "Vui lòng chọn CLB sở hữu (bắt buộc kể cả Public)." }]}
              >
                <Select
                  showSearch
                  placeholder="Select Club"
                  optionFilterProp="label"
                  options={clubs.map((c) => {
                    const id = c.clubID ?? c.id;
                    return { value: id, label: getClubLabel(id) };
                  })}
                />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item label="CLB sở hữu">
                <Input readOnly value={getClubLabel(userClubId)} />
              </Form.Item>
              <Form.Item label="Phạm vi hiển thị">
                <Input readOnly value="ClubInternal (nội bộ CLB)" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={detail?.title ?? "Chi tiết tài liệu"}
        open={detailOpen}
        onClose={handleCloseDetail}
        width={Math.min(640, typeof window !== "undefined" ? window.innerWidth - 32 : 640)}
      >
        {detailLoading ? (
          <div className="flex justify-center py-12">
            <Spin indicator={<Loader2 className="animate-spin text-[#F37021]" size={28} />} />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <IndexingStatusTag status={detail.indexingStatus} />
              <VisibilityTag scope={detail.visibilityScope} />
              <Tag>{(detail.sourceFormat ?? "MD").toUpperCase()}</Tag>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-400">CLB sở hữu</span>
                <p className="font-medium text-slate-700">{getClubLabel(detail.clubID)}</p>
              </div>
              <div>
                <span className="text-slate-400">Ngày tạo</span>
                <p className="font-medium text-slate-700">{formatDate(detail.createdAt)}</p>
              </div>
            </div>

            {isPdfDetail && detailFileHref ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm text-slate-600 mb-3">File PDF gốc — mở trong tab mới để xem.</p>
                <Button
                  type="primary"
                  icon={<FileType size={16} aria-hidden />}
                  loading={openingFileId === detail.archiveID}
                  onClick={() => handleOpenFile(detail)}
                  className="cursor-pointer"
                  style={{ background: "#F37021", borderColor: "#F37021" }}
                >
                  Mở file PDF
                </Button>
              </div>
            ) : detail.content ? (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase mb-2">Nội dung preview</p>
                <pre className="max-h-80 overflow-auto rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-700 whitespace-pre-wrap">
                  {detail.content}
                </pre>
              </div>
            ) : (
              <Empty description="Không có nội dung preview." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        ) : null}
      </Drawer>

      <style>{`
        @keyframes kaFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ka-fade-in {
          animation: kaFadeIn 0.25s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .ka-fade-in { animation: none; }
        }
      `}</style>
    </div>
  );
}
