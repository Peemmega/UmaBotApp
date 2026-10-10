import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { BOT_API_BASE } from "../../api/playerApi";
import { NewsDetailsContent } from "../../components/NewsDetailsModal";
import { getNewsKind } from "../../utils/newsItems";
import "../../styles/newsPage.css";

function itemName(item) {
  return String(item?.name || item?.title || item?.id || "").trim();
}

export default function NewsDetailsPage({ name, kind, initialItem, userId, profileType, onBack }) {
  const [items, setItems] = useState(initialItem ? [initialItem] : []);
  const [loading, setLoading] = useState(!initialItem);

  useEffect(() => {
    if (initialItem) {
      setItems([initialItem]);
      setLoading(false);
      return undefined;
    }

    setItems([]);
    setLoading(true);
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/news`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((error) => { if (error.name !== "AbortError") console.error(error); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [initialItem, name, kind]);

  const item = items.find((candidate) => (
    getNewsKind(candidate) === kind && itemName(candidate).toLocaleLowerCase() === String(name || "").toLocaleLowerCase()
  ));

  return <main className="news-detail-page">
    <button type="button" className="news-detail-back" onClick={onBack}>
      <ArrowLeft size={18} aria-hidden="true" />
      กลับไปหน้าข่าวสาร
    </button>
    {item ? <article className="news-detail-page-card">
      <NewsDetailsContent item={item} userId={userId} profileType={profileType} />
    </article> : <section className="news-detail-state" aria-live="polite">
      {loading ? <><LoaderCircle className="news-detail-loader" size={24} aria-hidden="true" />กำลังโหลดรายละเอียด…</> : "ไม่พบรายการนี้ หรือรายการอาจถูกนำออกแล้ว"}
    </section>}
  </main>;
}
