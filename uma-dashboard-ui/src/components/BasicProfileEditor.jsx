import { useEffect, useState } from "react";
import { Pencil, Save } from "lucide-react";
import { BOT_API_BASE } from "../api/playerApi";
import "../styles/basicProfileEditor.css";

const emptyProfile = {
  self_intro: "", name_th: "", name_en: "", division: "", birthday_day: "",
  birthday_month: "", height_cm: "", dorm: "", likes: "", dislikes: "",
  personality: "", biography: "", additional: "",
};

const isComplete = (profile) => Boolean(profile?.name_th && profile?.name_en && profile?.division && profile?.birthday_day && profile?.birthday_month && profile?.height_cm && profile?.dorm);

function countWords(value) {
  const text = String(value || "").trim();
  if (!text) return 0;
  if (typeof Intl.Segmenter === "function") return Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(text)).filter((part) => part.isWordLike).length;
  return text.split(/\s+/).length;
}

function dateLabel(profile) {
  if (!profile.birthday_day || !profile.birthday_month) return "—";
  return `${String(profile.birthday_day).padStart(2, "0")}/${String(profile.birthday_month).padStart(2, "0")}`;
}

export default function BasicProfileEditor({ userId }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`${BOT_API_BASE}/player/${encodeURIComponent(userId)}/basic-profile`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.detail || "โหลดข้อมูลพื้นฐานไม่สำเร็จ");
        return data?.profile;
      })
      .then((data) => {
        if (cancelled) return;
        const next = { ...emptyProfile, ...(data || {}) };
        for (const field of ["birthday_day", "birthday_month", "height_cm"]) next[field] = next[field] == null ? "" : String(next[field]);
        setProfile(next);
        setEditing(!isComplete(next));
        setLoading(false);
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(String(fetchError.message || fetchError));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [userId]);

  const change = (field) => (event) => {
    setProfile((current) => ({ ...current, [field]: event.target.value }));
    setNotice("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!isComplete(profile)) {
      setError("กรอกชื่อทั้งสองภาษา ชั้นปี วันเกิด ส่วนสูง และหอก่อนบันทึก");
      return;
    }
    if (countWords(profile.likes) > 60 || countWords(profile.dislikes) > 60 || countWords(profile.personality) > 200 || countWords(profile.biography) > 200 || countWords(profile.additional) > 200) {
      setError("Like และ Dislike จำกัด 60 คำ ส่วนบุคลิก ประวัติ และเพิ่มเติมจำกัดอย่างละ 200 คำ");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BOT_API_BASE}/player/${encodeURIComponent(userId)}/basic-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, birthday_day: Number(profile.birthday_day), birthday_month: Number(profile.birthday_month), height_cm: Number(profile.height_cm), word_counts: Object.fromEntries(["likes", "dislikes", "personality", "biography", "additional"].map((field) => [field, countWords(profile[field])])) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "บันทึกข้อมูลไม่สำเร็จ");
      const next = { ...emptyProfile, ...(data.profile || profile) };
      for (const field of ["birthday_day", "birthday_month", "height_cm"]) next[field] = String(next[field] ?? "");
      setProfile(next);
      setEditing(false);
      setNotice("บันทึกข้อมูลแล้ว");
    } catch (saveError) {
      setError(String(saveError.message || saveError));
    } finally {
      setSaving(false);
    }
  };

  const input = (label, field, { maxLength, maxWords, rows = 2, wide = false } = {}) => (
    <label className={`basic-profile-editor-field${wide ? " is-wide" : ""}`} key={field}>
      <span>{label}{maxLength ? <small>{profile[field].length}/{maxLength} ตัวอักษร</small> : null}{maxWords ? <small>{countWords(profile[field])}/{maxWords} คำ</small> : null}</span>
      {rows > 1 ? <textarea rows={rows} maxLength={maxLength} value={profile[field]} onChange={change(field)} /> : <input maxLength={maxLength} value={profile[field]} onChange={change(field)} />}
    </label>
  );

  return (
    <section className="basic-profile-editor" aria-labelledby="basic-profile-editor-title">
      <header className="basic-profile-editor-heading">
        <div><span>CHARACTER FILE</span><h2 id="basic-profile-editor-title">ข้อมูลพื้นฐาน</h2></div>
        {!loading && !editing && <button type="button" onClick={() => { setEditing(true); setNotice(""); }}><Pencil size={16} /> แก้ไขข้อมูล</button>}
      </header>
      {loading ? <p className="basic-profile-editor-message">กำลังโหลดข้อมูลพื้นฐาน…</p> : error ? <p className="basic-profile-editor-error">{error}</p> : editing ? (
        <form className="basic-profile-editor-form" onSubmit={submit}>
          {input("Self-Intro", "self_intro", { maxLength: 100, wide: true })}
          {input("ชื่อภาษาไทย *", "name_th", { rows: 1 })}
          {input("ชื่อภาษาอังกฤษ *", "name_en", { rows: 1 })}
          <label className="basic-profile-editor-field"><span>Class *</span><select required value={profile.division} onChange={change("division")}><option value="">เลือก Division</option><option>Junior Division</option><option>Senior Division</option></select></label>
          <label className="basic-profile-editor-field"><span>Birthday *</span><div className="basic-profile-editor-date"><select required value={profile.birthday_day} onChange={change("birthday_day")} aria-label="วันเกิด"><option value="">วัน</option>{Array.from({ length: 31 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select><b>/</b><select required value={profile.birthday_month} onChange={change("birthday_month")} aria-label="เดือนเกิด"><option value="">เดือน</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}</select></div></label>
          <label className="basic-profile-editor-field"><span>Height (cm.) *</span><input type="number" min="1" max="300" required value={profile.height_cm} onChange={change("height_cm")} /></label>
          <label className="basic-profile-editor-field"><span>Dorm *</span><select required value={profile.dorm} onChange={change("dorm")}><option value="">เลือกหอพัก</option><option>Ritto</option><option>Miho</option></select></label>
          <label className="basic-profile-editor-field"><span>Like <small>{countWords(profile.likes)}/60 คำ</small></span><textarea rows={2} value={profile.likes} onChange={change("likes")} /></label>
          <label className="basic-profile-editor-field"><span>Dislike <small>{countWords(profile.dislikes)}/60 คำ</small></span><textarea rows={2} value={profile.dislikes} onChange={change("dislikes")} /></label>
          {input("บุคลิก", "personality", { maxWords: 200, rows: 3, wide: true })}
          {input("ประวัติ", "biography", { maxWords: 200, rows: 5, wide: true })}
          {input("เพิ่มเติม", "additional", { maxWords: 200, rows: 3, wide: true })}
          {error && <p className="basic-profile-editor-error is-wide">{error}</p>}
          <div className="basic-profile-editor-actions is-wide"><button type="submit" disabled={saving}><Save size={16} /> {saving ? "กำลังบันทึก…" : "บันทึกข้อมูล"}</button>{isComplete(profile) && <button type="button" className="is-secondary" onClick={() => { setEditing(false); setError(""); }}>ยกเลิก</button>}</div>
        </form>
      ) : <>
        {profile.self_intro && <p className="basic-profile-editor-intro">“{profile.self_intro}”</p>}
        <div className="basic-profile-editor-overview">
          <article className="basic-profile-editor-personality"><h3>บุคลิก</h3><p>{profile.personality || "ยังไม่ได้ระบุ"}</p></article>
          <div className="basic-profile-editor-sidebar">
            <div className="basic-profile-editor-names"><div><span>ชื่อภาษาไทย</span><strong>{profile.name_th}</strong></div><div><span>English name</span><strong>{profile.name_en}</strong></div></div>
            <dl className="basic-profile-editor-facts"><div><dt>Class</dt><dd>{profile.division}</dd></div><div><dt>Birthday</dt><dd>{dateLabel(profile)}</dd></div><div><dt>Height</dt><dd>{profile.height_cm} cm.</dd></div><div><dt>Dorm</dt><dd>{profile.dorm}</dd></div></dl>
            <div className="basic-profile-editor-preferences"><article><h3>Like</h3><p>{profile.likes || "—"}</p></article><article><h3>Dislike</h3><p>{profile.dislikes || "—"}</p></article></div>
          </div>
        </div>
        <article className="basic-profile-editor-narrative"><h3>ประวัติ</h3><p>{profile.biography || "ยังไม่ได้ระบุ"}</p></article>
        <article className="basic-profile-editor-narrative basic-profile-editor-additional"><h3>เพิ่มเติม</h3><p>{profile.additional || "ยังไม่ได้ระบุ"}</p></article>
        {notice && <p className="basic-profile-editor-notice">{notice}</p>}
      </>}
    </section>
  );
}
