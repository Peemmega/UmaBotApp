import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, CornerDownRight, MoveRight, Sparkles, Wind } from "lucide-react";
import rules from "../data/systemGuideRules.json";
import { RUNNING_STYLES } from "../data/systemGuide";
import { raceImageMap } from "../utils/raceSchedule";
import { IS_MAIN_WEB } from "../api/appConfig";
import { getGradeImage } from "../utils/grade";
import speedIcon from "../assets/icons/Speed.webp";
import staminaIcon from "../assets/icons/Stamina.webp";
import powerIcon from "../assets/icons/Power.webp";
import gutIcon from "../assets/icons/Gut.webp";
import witIcon from "../assets/icons/Wit.webp";
import skillGuideImage from "../assets/image/Skill.webp";
import zoneGuideImage from "../assets/image/Zone.webp";

const PHASES = ["Start", "Mid", "Late", "Last Spurt"];
const PATHS = [
  { id: 1, label: "ทางตรง", name: "Straight", Icon: MoveRight, detail: "ใช้ Stamina ตามฐานของเลน ไม่มีการปรับค่าเต๋าจากเส้นทางเพิ่มเติม", cost: "ฐานเลน ×1" },
  { id: 2, label: "ทางโค้ง", name: "Curve", Icon: CornerDownRight, detail: "แคปเต๋าลด 5 แล้วเพิ่ม Wit ให้ทั้งแคปและค่าต่ำสุดของเต๋าในเทิร์นนั้น", cost: "ฐานเลน ×1" },
  { id: 3, label: "เนินขึ้น", name: "Uphill", Icon: ArrowUpRight, detail: "โบนัส Power หลังความถนัด ×3 และลดความเร็วปัจจุบัน 5% หนึ่งครั้งในเทิร์นนั้น การ Reroll ในเทิร์นเดียวกันไม่หักความเร็วซ้ำ", cost: "ฐานเลน ×2" },
  { id: 4, label: "เนินลง", name: "Downhill", Icon: ArrowDownRight, detail: "เพิ่มทั้งแคปและค่าต่ำสุดของเต๋าเท่ากับ floor(Wit ×1.5) และยกเว้นต้นทุนพลังจากเลน", cost: "ฐานเลน ×0" },
];

export function GuideSection({ id, title, intro, children }) {
  return <section className="system-guide-section" id={id} aria-labelledby={`${id}-title`}><h2 id={`${id}-title`}>{title}</h2>{intro && <p className="system-guide-intro">{intro}</p>}{children}</section>;
}

function Note({ children, title }) {
  return <aside className="system-guide-note">{title && <strong>{title}</strong>}<div>{children}</div></aside>;
}

function Table({ title, headings, rows }) {
  return <div className="system-guide-table-scroll" role="region" aria-label={title} tabIndex={0}><table className="system-guide-table"><caption>{title}</caption><thead><tr>{headings.map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th scope="row" key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

export function StatsSkillsZoneGuide() {
  const stats = [
    { name: "Speed", icon: speedIcon, color: "#289ed0", summary: "ขยายเพดานความเร็วและเพิ่มแต้มทุกครั้งที่วิ่ง", items: ["โบนัสผล Run +2 × Speed", "เพดานความเร็วใช้ Speed หลังคูณ Distance aptitude และปัดเป็นจำนวนเต็ม", "ความเร็วเริ่มต้นยังเป็นค่าของสายวิ่ง แล้วค่อยเร่งขึ้นถึงเพดาน"], example: "Speed 5 → โบนัส Run +10; ถ้าความถนัดระยะ G เพดานเพิ่ม +5" },
    { name: "Stamina", icon: staminaIcon, color: "#e5787b", summary: "พลังสำรองที่พาคุณวิ่งจนถึงเทิร์นสุดท้าย", items: ["Stamina เริ่มต้น = 800 + (100 × Stamina)", "โบนัสผล Run +1 × Stamina", "เมื่อพลังไม่พอจ่าย Run จะถูกลดผลตามค่า Guts แต่ยังวิ่งต่อได้"], example: "Stamina 5 → เริ่มแข่งด้วยพลัง 1,300 และโบนัส Run +5" },
    { name: "Power", icon: powerIcon, color: "#dd9a27", summary: "เร่งความเร็ว ฝ่าเลนแออัด และรับมือกับเนินขึ้น", items: ["Power ที่ใช้แข่ง = round(Power × Track aptitude)", "เพิ่มโบนัส Run ตาม Power ที่ใช้แข่ง; บนเนินขึ้นโบนัสนี้ ×3", "ลดโทษ Blocked 1 จุดเปอร์เซ็นต์ต่อ Power ที่ใช้แข่ง 1 แต้ม", "ความเร่งต่อครั้ง = 0.3 + (ค่าสายวิ่ง × Power ที่ใช้แข่ง ×1.5 ×ระดับความเร่ง)"], example: "Power ที่ใช้แข่ง 5 → โทษถูกบัง 1 คนลดจาก 10% เหลือ 5%" },
    { name: "Guts", icon: gutIcon, color: "#d974ab", summary: "แรงฮึดช่วงท้ายและการรับมือเมื่อพลังเริ่มหมด", items: ["ตั้งแต่ Phase 3 ได้โบนัส Run +2 × Guts", "เมื่อ In Pack เพิ่มอีก +2 × Guts ×จำนวนคู่แข่งใกล้เคียง (นับสูงสุด 2 คน)", "โทษ Fatigue = max(0, 25 − Guts)%"], example: "Guts 5, Phase 3, คู่แข่งใกล้ 2 คน → โบนัสรวม +30; Fatigue ลดผล 20%" },
    { name: "Wit", icon: witIcon, color: "#20a993", summary: "ทรัพยากรสกิล โอกาสแก้เต๋า และการอ่านเส้นทาง", items: ["Mana เริ่มต้น = 100 + (10 × Wit)", "ฟื้น Mana ต่อเทิร์น = round((10 + 2 × Wit) × Style aptitude)", "Wit Reroll 2 สิทธิ์ต่อการแข่ง ใช้ได้เมื่อผลรวมเต๋าที่เลือก ก่อนโบนัส ต่ำกว่า round(25 × Wit × Style aptitude)", "Wit เพิ่ม floor / cap ของเต๋าบนโค้งและเนินลง"], example: "Wit 5, ความถนัดสาย G → Mana 150, ฟื้น 20 ต่อเทิร์น, เกณฑ์ Reroll ต่ำกว่า 125" },
  ];
  const zoneRows = [
    ["เพิ่มผล Run", `+${rules.zoneValue.flat} ต่อระดับ`, "รอการวิ่งครั้งถัดไป"],
    ["เพิ่ม d / kh", `+${rules.zoneValue.add_dkh} ทั้งคู่ต่อระดับ`, "เพิ่มลูกเต๋าและจำนวนที่เก็บ; ถ้ากติกาไม่มี kh จะรวมทุกลูก"],
    ["เพิ่ม Floor / Cap", `+${rules.zoneValue.cap_floor} ทั้งคู่ต่อระดับ`, "รอการวิ่งครั้งถัดไป"],
    ["ฟื้น Stamina", `+${rules.zoneValue.self_heal_stamina}% ต่อระดับ`, "ฟื้นทันที ไม่เกิน Stamina สูงสุด"],
    ["เพิ่มความเร่ง", `+${rules.zoneValue.modify_current_speed} ระดับ`, "เพิ่มความเร็วปัจจุบันทันทีตามสูตรของสายวิ่ง"],
    ["เพิ่ม Speed ในรัน", `+${rules.zoneValue.race_speed} ต่อระดับ`, "เพิ่ม Stat Speed เฉพาะการแข่งนี้ แล้วคำนวณค่าที่ใช้แข่งใหม่"],
  ];
  return <>
    <GuideSection id="stats" title="ค่าสถานะทั้ง 5" intro="Stats เป็นฐานของนักวิ่ง แต่ผลที่เกิดจริงยังขึ้นกับความถนัด เส้นทาง และจังหวะของการแข่งขัน">
      <div className="system-stat-list">{stats.map(({ name, icon, color, summary, items, example }) => <div className="system-stat-entry" key={name} style={{ "--stat-color": color }}><div className="system-stat-name"><span><img src={icon} alt="" /></span><h3>{name}</h3></div><div><p>{summary}</p><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul><div className="system-guide-example">{example}</div></div></div>)}</div>
      <Note title="Stats กับทรัพยากรระหว่างแข่ง">ค่า Stamina และ Wit ในโปรไฟล์เป็น Stat ส่วน Stamina ที่เหลือและ Mana เป็นทรัพยากรที่ลดหรือฟื้นได้ระหว่างแข่ง สกิลบางชนิดปรับ Stat เฉพาะการแข่งโดยไม่เปลี่ยนโปรไฟล์ถาวร</Note>
    </GuideSection>
    <GuideSection id="aptitudes" title="ความถนัดที่ตรงสนาม" intro="ระบบเลือกใช้ความถนัดตามพื้นสนาม ระยะ และสายวิ่งที่เลือกในการแข่งขันนั้น">
      <div className="system-aptitude-ranks">{Object.entries(rules.aptitudeModifier).map(([rank, modifier]) => <div key={rank}><img src={getGradeImage(rank)} alt={`Rank ${rank}`} /><span>+{Math.round((modifier - 1) * 100)}%</span></div>)}</div>
      <Table title="ความถนัดส่งผลกับอะไร" headings={["ประเภท", "ค่าที่นำไปปรับ", "ตัวอย่าง"]} rows={[["Track · Turf / Dirt", "คูณ Power ก่อนใช้กับคะแนน ความเร่ง และการลด Blocked", "Power 5, Turf C → round(5 ×1.20) = 6"], ["Distance · Sprint / Mile / Medium / Long", "คูณ Speed สำหรับเพดาน และเพิ่มเปอร์เซ็นต์ผล Run ก่อนโทษเลน/พลัง", "Medium B → Speed ×1.25 และผลรวม Run +25%"], ["Style · Front / Pace / Late / End", "คูณ Mana ที่ฟื้นและเกณฑ์ Wit Reroll", "Wit 5, Pace A → ฟื้น round(20 ×1.30) = 26"]]} />
      <p>ถ้าแข่ง Turf / Medium และเลือก End จะใช้ความถนัด Turf, Medium และ End เท่านั้น ความถนัดระยะอื่นหรือสายที่ไม่ได้เลือกไม่มีผลในรอบนี้</p>
    </GuideSection>
    <GuideSection id="skills" title="สกิล: เลือกจังหวะให้ตรงเงื่อนไข" intro="เตรียมสกิล 4 ช่องก่อนแข่ง แล้วใช้สกิลที่พร้อมทำงานในเทิร์นนั้น">
      <div className="system-skill-parts">{[["Cooldown", "รอกี่เทิร์นก่อนใช้ซ้ำ"], ["Mana", "Wit Mana ที่ต้องจ่าย"], ["Target", "ส่งผลกับใคร"], ["Trigger", "ใช้ได้เมื่อไร"], ["Effect", "เกิดผลอะไร"]].map(([name, detail]) => <div key={name}><strong>{name}</strong><span>{detail}</span></div>)}</div>
      <p>ระบบตรวจคูลดาวน์ ตามด้วยเงื่อนไข และ Mana ก่อนใช้ผลสกิล สกิลที่กดสำเร็จจ่าย Mana ทันที กดหลายสกิลในเทิร์นเดียวได้เมื่อมีทรัพยากรพอและผ่านทุกเงื่อนไข โดยใช้ก่อน Run ของตัวเอง</p>
      <div className="system-guide-two-col"><div><h3>ผลที่รอการวิ่ง</h3><p>เพิ่มคะแนน จำนวนเต๋า จำนวนที่เก็บ ค่าต่ำสุด หรือแคปเต๋า ระบบเก็บเป็นบัฟไว้ใช้ในการทอย แล้วล้างผลสำหรับรอบนั้นหลังใช้</p></div><div><h3>ผลที่เกิดทันที</h3><p>ฟื้นหรือลด Stamina เพิ่มความเร็ว ย้ายไปเลนที่จอง ขยายระยะ In Pack บังคับ Rush หรือปรับ Stat ระหว่างแข่ง ตามเอฟเฟกต์ของสกิล</p></div></div>
      <figure className="system-guide-image-example"><img src={skillGuideImage} alt="ตัวอย่างหน้ารายละเอียดสกิล Masterful Gambit พร้อมเงื่อนไขและผลของสกิล" loading="lazy" /><figcaption><strong>ตัวอย่างรายละเอียดสกิล</strong><p>การ์ดสกิลแสดงเงื่อนไขการทำงานและผลที่เกิดขึ้น เพื่อใช้ประกอบการวางแผนก่อนแข่ง</p></figcaption></figure>
      <p>Trigger อาจกำหนดสายวิ่ง Phase พื้นสนาม ระยะ หรือชนิดเส้นทาง สกิล Debuff ที่ติดแท็กจะเลือกคู่แข่งในเลนเดียวกัน ส่วน Passive ทำงานอัตโนมัติครั้งแรกที่ผ่านเงื่อนไขในช่วงเริ่มเทิร์น โดยยังตรวจ Mana และกติกาห้อง อ่านรายละเอียดสกิลที่เลือกก่อนจัด Loadout เสมอ</p>
    </GuideSection>
    <GuideSection id="zone" title="Zone ที่คุณประกอบเอง" intro={`Zone เป็นความสามารถพิเศษอีกชุด แยกจากสกิล 4 ช่อง มีแต้มเริ่มต้น ${rules.zonePoints} แต้ม ทุกทางใช้ 1 แต้มต่อระดับ`}>
      <div className="system-zone-banner"><Sparkles size={30} /><div><strong>หนึ่งครั้งที่เปลี่ยนจังหวะของการแข่งขัน</strong><p>จัด Build ก่อนลงสนาม ใช้ก่อน Run และใช้ได้ 1 ครั้งต่อการแข่งขัน</p></div></div>
      <figure className="system-guide-image-example is-zone"><img src={zoneGuideImage} alt="ตัวอย่างหน้า Zone ในโปรไฟล์ แสดงสนามที่เลือกและโบนัสจาก Zone" loading="lazy" /><figcaption><strong>Zone ที่เลือกใช้ในโปรไฟล์</strong><p>Zone มีทั้งเอฟเฟกต์จากสนามที่เลือกและทางเลือกเสริมสำหรับปรับแผนการวิ่ง</p></figcaption></figure>
      <Table title="เอฟเฟกต์ Zone ทั้ง 6 ทาง" headings={["ทางเลือก", "ผลต่อระดับ", "เวลาที่เกิดผล"]} rows={zoneRows} />
      <div className="system-guide-two-col"><div className="system-guide-build"><h3>เน้นผลวิ่ง</h3><p>เพิ่มผล Run 3 ระดับ + d / kh 2 ระดับ</p><strong>ผล Run +60, d +2, kh +2</strong></div><div className="system-guide-build"><h3>เน้นยืนระยะ</h3><p>ฟื้น Stamina 3 ระดับ + ความเร่ง 2 ระดับ</p><strong>ฟื้นพลัง +300, เร่ง 2 ระดับ</strong></div></div>
      <p>ผลคะแนนและเต๋ามีผลกับ Run ถัดไป ส่วนการฟื้นพลังและเร่งความเร็วเกิดทันที เลือกเทิร์นที่สายวิ่งได้เปรียบ หรือใช้ฟื้นพลังให้ทันก่อนเกิด Fatigue</p>
    </GuideSection>
    <GuideSection id="preparation" title="เตรียมพร้อมก่อนวิ่ง">
      <ol className="system-guide-flow"><li>จัด Stats และความถนัดให้เข้ากับสนาม</li><li>เตรียมสกิล 4 ช่องและ Build Zone</li><li>อ่านเส้นทาง เลน และ Stamina ก่อนใช้ Skill / Zone</li><li>Run แล้วดูผล; ใช้ Reroll เมื่อจำเป็นและมีสิทธิ์</li><li>หลังทุกคนวิ่ง เลือกเลนของเทิร์นถัดไป แล้ว Confirm</li></ol>
    </GuideSection>
  </>;
}

export function RacesGuide() {
  const [raceId, setRaceId] = useState("TakarazukaKinen");
  const race = rules.raceExamples.find((item) => item.id === raceId);
  return <>
    <GuideSection id="course" title="สนามหนึ่งแห่งมีอะไรบ้าง" intro="ข้อมูลสนามบอกทั้งทรัพยากรที่ต้องใช้และเงื่อนไขของสกิลที่คุณเตรียมไป">
      <dl className="system-course-parts">{[["ชื่อรายการ / สถานที่", "บอกว่าแข่งรายการไหน ที่สนามใด และเกรดของการแข่งขัน"], ["พื้นสนาม", "Turf (สนามหญ้า) หรือ Dirt (สนามดิน) เลือกความถนัด Track ที่นำมาใช้"], ["ระยะทาง / ทิศทาง", "ระยะเป็นเมตรและทิศทางวิ่งของ Course ระยะกำหนดประเภทความถนัด Distance"], ["ลำดับเส้นทาง", "ทางตรง โค้ง เนินขึ้น และเนินลง ถูกเรียงไว้ล่วงหน้าทีละเทิร์น"], ["Fans / กติกาห้อง", "เงื่อนไขเข้าร่วม รางวัล และตัวเลือกที่เจ้าของห้องกำหนด"]].map(([name, detail]) => <div key={name}><dt>{name}</dt><dd>{detail}</dd></div>)}</dl>
    </GuideSection>
    <GuideSection id="distance" title="ระยะทาง จำนวนเทิร์น และ Phase">
      <Table title="การแบ่งระยะจาก Course ในระบบ" headings={["ระยะ", "ระยะทาง", "เทิร์นที่พบบ่อย", "Phase ละ"]} rows={[["Sprint", "ไม่เกิน 1,400 m", "8", "2 เทิร์น"], ["Mile", "มากกว่า 1,400 ถึง 1,800 m", "8", "2 เทิร์น"], ["Medium", "มากกว่า 1,800 ถึง 2,400 m", "12", "3 เทิร์น"], ["Long", "มากกว่า 2,400 m", "16", "4 เทิร์น"]]} />
      <Note title="จำนวนเทิร์นจริงดูจากลำดับเส้นทาง">ระบบใช้จำนวนช่องใน Path เป็นจำนวนเทิร์น สนามปัจจุบันใช้รูปแบบ 8 / 12 / 16 ตามตาราง สำหรับสนามที่กำหนดเอง ให้ยึดจำนวนช่อง Path ของสนามนั้นเป็นหลัก</Note>
      <div className="system-phase-strip">{PHASES.map((phase, index) => <div key={phase}><span>Phase {index + 1}</span><strong>{phase}</strong></div>)}</div>
      <p>แบ่งสนามเป็น 4 Phase จากจำนวนเทิร์นทั้งหมด: Phase = ceil(เทิร์นปัจจุบัน ÷ (จำนวนเทิร์นทั้งหมด ÷4)) ตัวอย่างสนาม 12 เทิร์น: P1 เทิร์น 1–3, P2 เทิร์น 4–6, P3 เทิร์น 7–9 และ P4 เทิร์น 10–12</p>
    </GuideSection>
    <GuideSection id="paths" title="สี่รูปแบบเส้นทาง" intro="ผลของเส้นทางใช้กับ Run ในเทิร์นนั้น วางสกิลและพลังให้พร้อมก่อนถึงช่วงสำคัญ">
      <div className="system-path-list">{PATHS.map(({ id, label, name, Icon, detail, cost }) => <div key={id}><span className={`system-path-icon is-path-${id}`}><Icon size={25} /></span><div><h3>{label} <small>{name}</small></h3><p>{detail}</p><strong>ต้นทุนพลัง: {cost}</strong></div></div>)}</div>
      <p>ค่าเต๋าใช้ความเร็วปัจจุบันปัดเศษลงเป็นฐาน แล้วปรับแคปด้วยเส้นทางและบัฟ ค่าต่ำสุดเริ่มที่ floor(แคปหลังปรับ ×0.25) ก่อนเพิ่ม floor จาก Wit และสกิล ส่วนแดดจัดเพิ่มต้นทุนพลังได้แม้เป็นเนินลง</p>
    </GuideSection>
    <GuideSection id="course-example" title="ลองอ่านเส้นทางจริง">
      <label className="system-guide-field" htmlFor="system-race-example">เลือกสนามตัวอย่าง<select id="system-race-example" value={raceId} onChange={(event) => setRaceId(event.target.value)}>{rules.raceExamples.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <div className="system-race-example"><img src={raceImageMap[race.id]} alt={race.name} loading="lazy" /><div><h3>{race.name}</h3><p>{race.course.venue} · {race.track === "turf" ? "Turf" : "Dirt"} · {race.course.distance_m.toLocaleString()} m</p><strong>{race.distanceType} / {race.turns} เทิร์น</strong><p>ทิศทาง {race.course.direction === "right" ? "วนขวา" : race.course.direction === "left" ? "วนซ้าย" : "ทางตรง"}</p></div></div>
      <div className="system-course-path" aria-label={`เส้นทาง ${race.name}`}>{race.path.map((id, index) => {
        const path = PATHS.find((item) => item.id === id);
        const Icon = path.Icon;
        return <div key={`${race.id}-${index}`} className={`is-path-${id}`}><span>Turn {index + 1}</span><Icon size={23} /><strong>{path.label}</strong><small>P{Math.min(4, Math.ceil((index + 1) / (race.turns / 4)))}</small></div>;
      })}</div>
    </GuideSection>
    <GuideSection id="weather" title="อากาศและกติกาห้อง">
      <div className="system-guide-two-col"><div><h3>แดดและฝน</h3><p>แดดจัดเพิ่มการใช้ Stamina +{rules.sunnyCost} ต่อ Run ก่อนลดด้วย Draft ส่วนฝนจะสุ่ม 2 เลนเปียกสำหรับเทิร์นถัดไป เลนเปียกลดความเร่งของเทิร์นนั้น 50% โดยไม่ลดผลคะแนนที่วิ่งไปแล้ว</p></div><div><h3>อ่านกติกาก่อนเข้าร่วม</h3><p>ห้องอาจปิด Skill / Zone, ห้าม Debuff หรือเปิด Dream Mode ซึ่งทำให้ Stats หลักทั้ง 5 เป็น 8 เฉพาะการแข่งนั้น แต่ความถนัดยังคงมีผล</p></div></div>
    </GuideSection>
  </>;
}

export function LanesGuide() {
  const [lane, setLane] = useState(2);
  const [power, setPower] = useState(5);
  const [blockers, setBlockers] = useState(1);
  const maxBasePower = rules.maxCoreStats[IS_MAIN_WEB ? "main" : "test"];
  const maxEffectivePower = Math.round(maxBasePower * rules.aptitudeModifier.S);
  const blockPercent = Math.min(rules.blockCap * 100, Math.max(0, blockers * rules.blockStep * 100 - power));
  const displayedBlockPercent = Math.round(blockPercent);
  return <>
    <GuideSection id="lane-basics" title="เลนคือพื้นที่ของแผนวิ่ง" intro="สนามแบบเทิร์นมี 6 เลน จากวงใน (1) ไปวงนอก (6) เลนส่งผลต่อพลัง การเข้าใกล้กลุ่ม และพื้นที่ที่ใช้แซง">
      <p>เลนเริ่มต้นจัดจากลำดับออกตัว หลังทุกคน Run แล้ว คุณเลือกเลน 1–6 ที่จะใช้ในเทิร์นถัดไป ระบบย้ายให้เมื่อเริ่มเทิร์นใหม่ สกิลย้ายเลนบางชนิดสามารถย้ายไปเลนที่จองไว้ได้ทันที</p>
      <div className="system-lane-map" aria-label="เลือกเลนเพื่อดูต้นทุน Stamina"><div className="system-lane-map-heading"><span>วงใน</span><span>ตำแหน่งนักวิ่งเป็นตัวอย่าง</span></div>{Object.entries(rules.laneCosts).map(([number, cost]) => <button type="button" className={Number(number) === lane ? "is-selected" : ""} key={number} aria-pressed={Number(number) === lane} onClick={() => setLane(Number(number))}><b>{number}</b><span className="system-lane-line"><i className="system-lane-demo-runner">คุณ</i>{Number(number) === 2 && <i className="system-lane-demo-opponent">คู่แข่ง</i>}</span><strong>{cost} STA</strong></button>)}<div className="system-lane-map-heading"><span>วงนอก</span><span>เลือกเลนเพื่อเปรียบเทียบพลัง</span></div></div>
    </GuideSection>
    <GuideSection id="lane-cost" title="พลังที่ใช้ในเลน" intro="วงในใช้พลังน้อยกว่า วงนอกเปิดพื้นที่แต่มีต้นทุนมากขึ้น เลือกให้เข้ากับแผนและพลังที่เหลือ">
      <div className="system-lane-cost-summary" aria-live="polite"><span>Lane {lane}</span><strong>{rules.laneCosts[lane]} <small>STA / Run บนทางตรง</small></strong><p>บนเนินขึ้น {rules.laneCosts[lane] * 2} STA · เนินลง 0 STA ก่อนอากาศและ Draft</p></div>
      <Note title="เทิร์นแรกและการปรับต้นทุน">เทิร์น 1 ใช้ฐาน 100 STA ทุกเลนก่อนคูณเส้นทาง จากเทิร์น 2 จึงใช้ฐานเลนปัจจุบัน แดดจัดเพิ่ม +10 แล้วค่อยลดต้นทุนรวม 10% หากได้ Draft ปัดเป็นจำนวนเต็ม</Note>
      <p>เมื่อพลังเหลือไม่พอจ่าย Run จะเกิด Fatigue และลดผลวิ่ง max(0, 25 − Guts)% หลังคิดโทษการบัง พลังลดได้ถึง 0 และยังวิ่งต่อได้</p>
    </GuideSection>
    <GuideSection id="draft" title="Draft: เก็บแรงหลังคู่แข่ง">
      <div className="system-draft-illustration"><Wind size={32} /><span>คุณ</span><i /><span>คู่แข่งด้านหน้า</span></div>
      <p>อยู่ตามหลังในเลนเดียวกัน และคู่แข่งอยู่ในระยะ In Pack ของคุณ จะลดพลังที่ต้องจ่ายใน Run ลง {Math.round((1 - rules.draftFactor) * 100)}% เช่น Lane 2 บนทางตรง 100 → 90 STA (ไม่มีผลอากาศ) การอยู่เลนติดกันอาจเป็น In Pack ได้ แต่ไม่ได้ Draft</p>
    </GuideSection>
    <GuideSection id="blocked" title="Blocked: เมื่อจังหวะแซงถูกบัง" intro="เกิดอัตโนมัติเมื่อผล Run ของคุณจะผ่านตำแหน่งคู่แข่งที่อยู่ข้างหน้าในเลนเดียวกัน โดยเทียบตำแหน่งก่อนวิ่ง">
      <div className="system-guide-formula">โทษ = min(20%, max(0, จำนวนคนที่บัง ×10% − Power ที่ใช้แข่ง ×1%))</div>
      <div className="system-block-demo"><div><label htmlFor="system-block-power">Power หลัง Track aptitude <strong>{power}</strong></label><input id="system-block-power" type="range" min="0" max={maxEffectivePower} value={Math.min(power, maxEffectivePower)} onChange={(event) => setPower(Number(event.target.value))} /><small>สูงสุด {maxEffectivePower} (Power {maxBasePower} × Track S {rules.aptitudeModifier.S} ปัดเป็นจำนวนเต็ม)</small><label htmlFor="system-block-count">คู่แข่งในเลนที่จะแซงผ่าน<select id="system-block-count" value={blockers} onChange={(event) => setBlockers(Number(event.target.value))}>{[0, 1, 2, 3].map((number) => <option value={number} key={number}>{number} คน</option>)}</select></label></div><output aria-live="polite"><small>โทษต่อผล Run</small><strong>−{displayedBlockPercent}%</strong><span>ผล Run 100 → {Math.round(100 - blockPercent)} คะแนน</span></output></div>
      <p>Power ช่วยลดโทษก่อนนำไปจำกัดเพดาน โดยใช้ค่าหลังคูณ Track aptitude เช่น มีคู่แข่ง 3 คนและ Power 6 จะคิด 30% − 6% = 24% แล้วจำกัดเหลือโทษสูงสุด 20% การวางเลนให้โล่งก่อนเร่งแซงช่วยเลี่ยงการถูกบัง</p>
    </GuideSection>
    <GuideSection id="block-action" title="Block และ Rush ในช่วงสรุปเทิร์น">
      <div className="system-guide-two-col"><div><h3>Block · ถอยเข้าหากลุ่ม</h3><p>ลด Score ของผู้ใช้เพื่อกลับเข้าสู่ระยะ In Pack กับคู่แข่งด้านหลังที่ใกล้ที่สุดในเลนเดียวกันหรือเลนติดกัน ใช้เมื่อยังอยู่นอกระยะของคู่แข่งด้านหลัง และต้องถอยไม่เกิน 20 คะแนน ใช้ได้ 1 ครั้งต่อเทิร์น</p><div className="system-guide-example">คุณ 150, คู่แข่ง 120, ระยะ In Pack 20 → ถอย 10 คะแนน คุณเหลือ 140</div></div><div><h3>Rush · ขยับขึ้นหน้า</h3><p>เพิ่ม Score +20 ทันที แลก Stamina 5% ของพลังสูงสุด (ปัดเป็นจำนวนเต็ม อย่างน้อย 1) ใช้ได้ 1 ครั้งต่อการแข่งขัน ต้องมีพลังพอ และใช้ในช่วงสรุปเทิร์น</p><div className="system-guide-example">Stamina สูงสุด 1,300 → จ่าย 65 STA เพื่อเพิ่ม Score +20</div></div></div>
      <Note>แอ็กชัน Block คือการจัดตำแหน่งด้วยการถอยคะแนนของตัวเอง ส่วน Blocked คือโทษการบังที่คำนวณอัตโนมัติขณะ Run หลังเลือก Block / Rush แล้วจะล็อกแอ็กชันช่วงสรุปเทิร์นของผู้เล่น</Note>
    </GuideSection>
  </>;
}

const diceLabel = (rule) => `${rule.d}d${rule.kh === undefined ? "" : `kh${rule.kh}`}`;

export function RunningStylesGuide() {
  const [styleId, setStyleId] = useState("Front");
  const [keep, setKeep] = useState(2);
  const style = RUNNING_STYLES.find((item) => item.id === styleId);
  const caps = rules.maxSpeedPhase[styleId];
  const scales = rules.accelerationScale[styleId];
  const rolls = [7, 19, 11, 16];
  const selected = [...rolls].sort((a, b) => b - a).slice(0, keep);
  return <>
    <GuideSection id="style-selector" title="เลือกสายวิ่งของคุณ">
      <div className="system-style-selector" aria-label="เลือกสายวิ่ง">{RUNNING_STYLES.map((item) => <button type="button" key={item.id} className={styleId === item.id ? "is-selected" : ""} style={{ "--style-color": item.color }} aria-pressed={styleId === item.id} onClick={() => setStyleId(item.id)}><strong>{item.id}</strong><span>{item.thai}</span></button>)}</div>
      <div className="system-style-story" style={{ "--style-color": style.color }} aria-live="polite"><span className="system-style-emblem">{style.id.slice(0, 1)}</span><div><h3>{style.name} <small>{style.thai}</small></h3><p>{style.summary}</p><dl><div><dt>จังหวะได้เปรียบ</dt><dd>{style.strengths}</dd></div><div><dt>แผนการเล่น</dt><dd>{style.strategy}</dd></div><div><dt>สิ่งที่ต้องดู</dt><dd>{style.caution}</dd></div></dl></div></div>
    </GuideSection>
    <GuideSection id="style-phases" title={`ความเร็วและโบนัสของ ${styleId}`}>
        <div className="system-speed-phases">{[caps.start, caps.mid, caps.late, caps.last_spurt].map((cap, index) => <div key={index} style={{ "--style-color": style.color }}><span>{index === 0 ? "เริ่มต้น" : `Phase ${index + 1}`}</span><strong>{cap}</strong><div><i style={{ width: `${cap / 25 * 100}%` }} /></div><small>{PHASES[index]}</small></div>)}</div>
        <Note title="ความเร็วเริ่มต้นกับเพดานระหว่าง Phase">ค่าตัวแรกเป็นความเร็วตอนออกตัว ใน Phase 1 และ 2 เพดานใช้ค่า Mid + Speed หลังความถนัดระยะ เมื่อเข้า Phase 3 / 4 จึงเปลี่ยนเป็น Late / Last Spurt + Speed หลังความถนัดระยะ ความเร็วค่อย ๆ เร่งถึงเพดาน ไม่ได้กระโดดเป็นค่าตารางทันที</Note>
        <Table title={`สูตรลูกเต๋าและความเร่ง ${styleId}`} headings={["Phase", "เพดานพื้นฐาน", "ค่าสายวิ่ง", "Off Pack", "In Pack"]} rows={PHASES.map((phase, index) => [<span key={phase}>P{index + 1} · {phase}</span>, index < 2 ? caps.mid : index === 2 ? caps.late : caps.last_spurt, scales[index].toFixed(2), diceLabel(rules.dicePreset[styleId].White[index + 1]), diceLabel(rules.dicePreset[styleId].Gold[index + 1])])} />
        <div className="system-guide-formula">ความเร่งต่อครั้ง = 0.3 + (ค่าสายวิ่ง × Power ที่ใช้แข่ง ×1.5 ×ระดับความเร่ง)</div>
        <p>ระดับความเร่งปกติคือ 1; Skill / Zone อาจเรียกการเร่งด้วยระดับที่สูงขึ้น ถ้า Power ที่ใช้แข่ง 5 ใน Phase 1 ของ {styleId} จะเพิ่มความเร็ว {Number((0.3 + scales[0] * 5 * 1.5).toFixed(3))} ต่อครั้ง โดยไม่เกินเพดาน เลนเปียกลดค่าความเร่งที่ได้ลง 50%</p>
        <Note>โบนัสคะแนนพื้นฐานใช้ร่วมกันทุกสาย: Speed ×2 + Stamina + Power ที่ใช้แข่ง; ตั้งแต่ Phase 3 เพิ่ม Guts ×2 และโบนัส Guts ตามคนใกล้เคียงเมื่อ In Pack ความต่างของแต่ละสายอยู่ที่เพดาน ความเร่ง และตารางเต๋า</Note>
    </GuideSection>
    <GuideSection id="dice" title="อ่านลูกเต๋า d และ kh" intro="d คือจำนวนลูกเต๋าที่ทอย และ kh คือ Keep Highest หรือจำนวนลูกที่เก็บผลสูงที่สุดมารวม">
      <div className="system-dice-example"><div className="system-dice-heading"><strong>4dkh{keep}</strong><label htmlFor="system-dice-keep">เลือกจำนวนที่เก็บ<select id="system-dice-keep" value={keep} onChange={(event) => setKeep(Number(event.target.value))}>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>kh{value}</option>)}</select></label></div><div className="system-dice-rolls">{rolls.map((roll) => <span className={selected.includes(roll) ? "is-kept" : ""} key={roll}><strong>{roll}</strong><small>{selected.includes(roll) ? "เก็บ" : "ไม่เก็บ"}</small></span>)}</div><p>ทอย 4 ลูก เก็บ {keep} ลูกสูงสุด: <strong>{selected.join(" + ")} = {selected.reduce((total, value) => total + value, 0)}</strong></p><small>ตัวเลขตัวอย่างสำหรับอธิบาย ยังไม่รวมโบนัส Stats และเอฟเฟกต์</small></div>
      <p>4dkh2 หรือที่ย่อว่า 4kh2 หมายถึงทอย 4 ลูกแล้วเก็บ 2 ลูก ถ้าไม่มี kh เช่น 2d จะรวมทุกลูกที่ทอย Skill / Zone ที่เพิ่ม d +1 และ kh +1 ทำให้ 4dkh2 กลายเป็น 5dkh3 โดยจำนวนที่เก็บจะไม่เกินจำนวนที่ทอย</p>
      <p>หน้าของเต๋าไม่ได้ตายตัวเป็น d6 หรือ d20: ระบบใช้ความเร็วปัจจุบันปัดลงเป็นฐานแคป แล้วปรับด้วยเส้นทางและบัฟ ก่อนสุ่มในช่วง floor ถึง cap ของแต่ละลูก จึงต้องดูทั้งจำนวนลูกเต๋าและความเร็วที่สะสมมา</p>
    </GuideSection>
    <GuideSection id="pack" title="In Pack และ Off Pack" intro="สถานะกลุ่มใช้เลือกตารางเต๋าของสายวิ่ง และสัมพันธ์กับโบนัส Guts และ Draft">
      <div className="system-pack-rule"><strong>ระยะ Score ≤ {rules.packRange}</strong><span>และ</span><strong>ต่างเลน ≤ {rules.packLaneTolerance}</strong></div>
      <p>มีคู่แข่งอย่างน้อย 1 คนผ่านทั้งสองเงื่อนไข จึงเป็น In Pack โดยใช้คะแนน ณ ต้นเทิร์นร่วมกัน ระยะเลนและคะแนนที่นับว่าใกล้ปรับได้ด้วยสกิล คู่แข่งใกล้ที่ใช้คิดโบนัส Guts นับได้สูงสุด 2 คน</p>
      <div className="system-guide-two-col"><div><h3>In Pack · อยู่กับกลุ่ม</h3><p>ใช้ตาราง Gold ของสายวิ่ง ได้โบนัส Guts เพิ่มใน Phase 3–4 และอาจได้ Draft หากตามหลังในเลนเดียวกัน</p></div><div><h3>Off Pack · แยกจากกลุ่ม</h3><p>ใช้ตาราง White ของสายวิ่ง ไม่ได้โบนัส Guts จากคนใกล้ แต่ยังได้โบนัส Guts พื้นฐานใน Phase 3–4 สาย Front มีจังหวะที่ได้เปรียบเมื่อแยกกลุ่ม</p></div></div>
      <Note>ผู้เล่นที่แข่งเพียงคนเดียว ระบบลูกเต๋าจัดเป็น In Pack แต่จำนวนคู่แข่งใกล้เป็น 0 จึงไม่มีโบนัส Guts จากคู่แข่ง</Note>
    </GuideSection>
  </>;
}
