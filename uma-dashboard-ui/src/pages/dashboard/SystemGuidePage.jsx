import { useEffect } from "react";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import { SYSTEM_TOPICS, getSystemTopic, followSystemLink } from "../../data/systemGuide";
import { StatsSkillsZoneGuide, RacesGuide, LanesGuide, RunningStylesGuide } from "../../components/SystemGuideContent";
import "../../styles/systemGuide.css";

const CONTENT = { "stats-skills-zone": StatsSkillsZoneGuide, races: RacesGuide, lanes: LanesGuide, "running-styles": RunningStylesGuide };

export default function SystemGuidePage({ topicId, onNavigate, onBack }) {
  const topic = getSystemTopic(topicId);
  const Content = CONTENT[topicId];
  useEffect(() => {
    const previous = document.title;
    document.title = `${topic?.label || "Race System"} | Tracen Academy`;
    const frame = requestAnimationFrame(() => {
      if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
      else document.getElementById("system-guide-title")?.focus({ preventScroll: true });
    });
    return () => { document.title = previous; cancelAnimationFrame(frame); };
  }, [topic]);

  if (!topic || !Content) return <main className="system-guide"><h1>ไม่พบหัวข้อระบบนี้</h1><button type="button" onClick={onBack}>กลับหน้าระบบ</button></main>;

  return <main className={`system-guide is-${topic.id}`}>
    <div className="system-guide-breadcrumb"><button type="button" onClick={onBack}><ArrowLeft size={16} />กลับหน้าระบบ</button><span>Race System</span><ChevronRight size={14} /><strong>{topic.label}</strong></div>
    <header className="system-guide-hero"><div className="system-guide-hero-copy"><span className="system-guide-hero-label"><BookOpen size={17} />{topic.label}</span><h1 id="system-guide-title" tabIndex={-1}>{topic.title}</h1><p>{topic.intro}</p><span className="system-guide-scope">คู่มือการแข่งขันแบบเทิร์น · Discord</span></div><div className={`system-guide-hero-art is-${topic.id}`}><img src={topic.image} alt={topic.imageAlt} /></div></header>
    <nav className="system-guide-topics" aria-label="หัวข้อคู่มือระบบ">{SYSTEM_TOPICS.map((item) => <a href={`/dashboard/system/${item.id}`} key={item.id} aria-current={item.id === topic.id ? "page" : undefined} onClick={(event) => followSystemLink(event, onNavigate, item.id)}>{item.label}</a>)}</nav>
    <div className="system-guide-layout"><aside className="system-guide-toc"><strong>ในหน้านี้</strong><nav aria-label="สารบัญหน้านี้">{topic.sections.map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}</nav></aside><article className="system-guide-article"><Content /><footer className="system-guide-footer"><p>อ่านต่อในหัวข้ออื่น เพื่อประกอบแผนก่อนลงสนาม</p><div>{SYSTEM_TOPICS.filter((item) => item.id !== topic.id).map((item) => <a href={`/dashboard/system/${item.id}`} key={item.id} onClick={(event) => followSystemLink(event, onNavigate, item.id)}>{item.label}<ChevronRight size={15} /></a>)}</div></footer></article></div>
  </main>;
}
