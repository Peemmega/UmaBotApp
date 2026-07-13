import React from "react";
import { Badge, GameCard, SectionHeader, StatusChip } from "../../components/ui";
import "../../styles/tutorialsPage.css";

const startSteps = [
  ["1", "เข้าเว็บและสร้างโปรไฟล์", "ล็อกอินด้วย Discord ได้เลย หากยังไม่มีข้อมูล ระบบจะสร้างโปรไฟล์ผู้เล่นให้โดยอัตโนมัติ พร้อม Fans เริ่มต้น 1."],
  ["2", "เข้าห้องแข่ง", "ใน Discord ใช้ /game create เพื่อสร้างห้อง เลือกสนาม จากนั้นกด Join และเลือกสไตล์ Front, Pace, Late หรือ End."],
  ["3", "วางแผนก่อนทอย", "ดู Phase, Path, Stamina และตำแหน่งในเลนก่อน เลือกใช้ Skill, Zone หรือเปลี่ยนเลนเมื่อจังหวะเหมาะสม."],
  ["4", "ทอยและยืนยันเทิร์น", "ใช้ /game run เพื่อทอย ตรวจผล แล้วใช้ Reroll ได้หากยังมีสิทธิ์ เมื่อพร้อมให้กดยืนยันเพื่อเข้าสู่เทิร์นถัดไป."],
];

const commands = [
  ["/game create", "สร้างห้องแข่งและเลือกสนาม"],
  ["Join + เลือก Style", "เข้าร่วมการแข่งขันและกำหนดแนววิ่ง"],
  ["/game skill", "เปิดรายการสกิลที่ใช้ได้ในจังหวะปัจจุบัน"],
  ["/game lane target_lane:1-6", "ตั้งเลนสำหรับเทิร์นถัดไป ก่อนกดยืนยัน"],
  ["/game run", "ทอยเต๋าของเทิร์น"],
  ["/game mob_fast_mode enabled:true", "คำสั่งผู้ดูแล: ให้ Mob แสดงผลเต๋าแบบข้อความกระชับ"],
];

const mechanics = [
  {
    title: "เต๋าและคะแนน",
    icon: "🎲",
    text: "ผล Run เลือกตารางเต๋าจากสไตล์วิ่ง, Phase และสถานะ Gold/White แล้วรวมผลเต๋าที่เลือกกับโบนัสจากสเตตัส, สนาม, สกิล และ Zone เป็นคะแนนของเทิร์น.",
  },
  {
    title: "Stamina และ Path",
    icon: "⛰️",
    text: "ทุกเทิร์นมี Path เช่น ทางตรง โค้ง ขึ้นเนิน หรือลงเนิน ซึ่งมีผลต่อ Stamina และโบนัสการทอย จึงควรเช็ก Path ก่อนตัดสินใจใช้สกิลหรือเร่งเกม.",
  },
  {
    title: "Skill และ Wit Mana",
    icon: "✨",
    text: "สกิลใช้ Wit Mana ตามค่าใช้จ่าย และมีเงื่อนไข/คูลดาวน์ของตัวเอง ผลอาจเพิ่มเต๋า, เพิ่มคะแนน, ฟื้น Stamina, ปรับตำแหน่ง หรือรบกวนคู่แข่ง.",
  },
  {
    title: "Zone",
    icon: "🌟",
    text: "Zone คือความสามารถพิเศษของผู้เล่น ใช้ได้หนึ่งครั้งต่อการแข่งขัน เลือกจังหวะที่ตารางเต๋าและเงื่อนไขของคุณคุ้มค่าที่สุด.",
  },
];

const styles = [
  ["Front", "นำเกม", "ออกตัวและรักษาจังหวะตั้งแต่ต้น เหมาะกับคนที่อยากทำแต้มเร็ว แต่ต้องบริหารทรัพยากรให้ถึงท้ายเกม."],
  ["Pace", "สมดุล", "เล่นได้ยืดหยุ่น อ่านสถานการณ์ง่าย เหมาะสำหรับเริ่มต้นและปรับตาม Path ได้ดี."],
  ["Late", "เร่งช่วงท้าย", "เก็บจังหวะไว้รอช่วงท้าย ใช้สกิลและทรัพยากรให้เกิดผลใน Phase หลัง."],
  ["End", "ปิดเกม", "เน้นการเร่งทำแต้มในช่วงท้าย ควรวางแผน Wit Mana และ Stamina ไว้สำหรับจังหวะสำคัญ."],
];

const tips = [
  "ก่อน Run ให้ดู Path และ Stamina เสมอ เพราะผลของสนามอาจเปลี่ยนความคุ้มค่าของสกิล.",
  "เลนที่ตั้งไว้จะมีผลในเทิร์นถัดไป ใช้ /game lane ก่อนกดยืนยันผลเทิร์น.",
  "Reroll เป็นทรัพยากรจำกัด ใช้เมื่อผลเดิมไม่คุ้มและคุณยังมีโอกาสได้ผลที่ดีกว่า.",
  "WIT Reroll ใช้ได้เฉพาะเมื่อเข้าเงื่อนไขของผลทอยและยังมีจำนวนคงเหลือ.",
  "เมื่อผู้เล่นทอยครบ ระบบจะจัดการ Mob ที่เหลืออัตโนมัติ แล้วจึงแสดงสรุปผลของเทิร์น.",
  "Fans คือทรัพยากรผู้เล่นใหม่ เริ่มต้นที่ 1 และใช้แทน Uma Coin ในหน้าโปรไฟล์.",
];

function InfoRows({ rows }) {
  return <div className="tutorial-info-table">{rows.map(([name, detail]) => <div className="tutorial-info-row" key={name}><strong>{name}</strong><span>{detail}</span></div>)}</div>;
}

export default function TutorialsPage() {
  return (
    <section className="sheet-card tutorials-page">
      <div className="title-banner"><h2>คู่มือการเล่น</h2></div>
      <div className="padding-content tutorials-content">
        <GameCard className="tutorial-hero">
          <div>
            <SectionHeader kicker="UmaDnD Race · ระบบล่าสุด" title="เริ่มแข่งได้ในไม่กี่ขั้นตอน" action={<StatusChip status="live">อัปเดตล่าสุด</StatusChip>} />
            <p>คู่มือฉบับย่อสำหรับ Dashboard และ Discord Bot: สร้างโปรไฟล์ เข้าร่วมการแข่งขัน วางแผนสกิลและเลน ทอยเต๋า แล้วสะสมคะแนนเพื่อคว้าชัยชนะ</p>
            <div className="tutorial-chip-row"><Badge>Turn-based Race</Badge><Badge>Discord Login</Badge><Badge>Fans เริ่มต้น 1</Badge><Badge>Skill + Zone</Badge></div>
          </div>
          <div className="tutorial-hero-panel"><span>🏁</span><strong>จำง่าย ๆ</strong><p>ดูสนาม → วางแผน → Run → ยืนยัน</p></div>
        </GameCard>

        <section className="tutorial-section">
          <SectionHeader kicker="Quick Start" title="เริ่มเล่นจากเว็บจนถึงสนามแข่ง" />
          <div className="tutorial-flow-grid">
            {startSteps.map(([number, title, text]) => <GameCard className="tutorial-flow-card" key={number}><span className="tutorial-flow-step">{number}</span><div><h3>{title}</h3><p>{text}</p></div></GameCard>)}
          </div>
        </section>

        <div className="tutorial-grid two-col">
          <GameCard className="tutorial-card accent-gold">
            <SectionHeader kicker="Discord Commands" title="คำสั่งที่ใช้บ่อย" />
            <InfoRows rows={commands} />
            <div className="tutorial-callout tutorial-callout-warning"><strong>Mob Fast Mode</strong><span>โหมดนี้ลดภาพผลทอยของ Mob เพื่อให้ห้องวิ่งเร็วขึ้น แต่ยังบอกรายละเอียดเต๋า โบนัส Stamina และคะแนนเป็นข้อความ</span></div>
          </GameCard>
          <GameCard className="tutorial-card">
            <SectionHeader kicker="ชนะอย่างไร" title="คะแนนสูงสุดคือผู้ชนะ" />
            <p>คะแนนจากการ Run จะสะสมตลอดการแข่งขัน เมื่อจบสนาม ระบบเรียงอันดับตามคะแนนรวม ผู้ที่อยู่ลำดับหนึ่งเป็นผู้ชนะ</p>
            <div className="tutorial-callout"><strong>การยืนยันเทิร์น</strong><span>หลังตรวจผลแล้ว ให้กดยืนยัน เมื่อทุกคนยืนยัน ระบบจะลดคูลดาวน์ ฟื้นทรัพยากรตามกติกา และเริ่มเทิร์นใหม่</span></div>
          </GameCard>
        </div>

        <section className="tutorial-section">
          <SectionHeader kicker="Race Mechanics" title="ระบบสำคัญที่ควรรู้" />
          <div className="tutorial-mechanic-grid">{mechanics.map((item) => <GameCard className="tutorial-mechanic-card" key={item.title}><span>{item.icon}</span><h3>{item.title}</h3><p>{item.text}</p></GameCard>)}</div>
        </section>

        <section className="tutorial-section">
          <SectionHeader kicker="Running Style" title="เลือกสไตล์วิ่งให้เข้ากับแผน" />
          <div className="tutorial-style-grid">{styles.map(([name, label, text]) => <GameCard className="tutorial-style-card" key={name}><div className="tutorial-style-head"><h3>{name}</h3><StatusChip status="info">{label}</StatusChip></div><p>{text}</p></GameCard>)}</div>
        </section>

        <GameCard className="tutorial-card accent-blue">
          <SectionHeader kicker="หนึ่งเทิร์นทำอะไรบ้าง" title="ลำดับการตัดสินใจที่แนะนำ" />
          <ol className="tutorial-turn-flow">
            <li><strong>เช็กสถานการณ์</strong><span>ดู Phase, Path, Stamina, ตำแหน่ง และผลของคู่แข่ง</span></li>
            <li><strong>ใช้ Skill หรือ Zone</strong><span>ใช้เมื่อเงื่อนไขตรงและผลจะช่วยการทอยเทิร์นนี้หรือเทิร์นถัดไป</span></li>
            <li><strong>ตั้งเลนล่วงหน้า</strong><span>ใช้ <code>/game lane target_lane:1-6</code> ก่อนยืนยัน หากต้องการเปลี่ยนเลนในเทิร์นถัดไป</span></li>
            <li><strong>Run และตัดสินใจ Reroll</strong><span>ตรวจโบนัสและคะแนนจากผลทอยก่อนใช้สิทธิ์ Reroll หรือ WIT Reroll</span></li>
            <li><strong>ยืนยันผล</strong><span>เมื่อพร้อมแล้วกดยืนยันเพื่อให้การแข่งขันเดินต่อ</span></li>
          </ol>
        </GameCard>

        <GameCard className="tutorial-card">
          <SectionHeader kicker="Tips" title="คำแนะนำสำหรับผู้เล่นใหม่" />
          <div className="tutorial-tip-grid">{tips.map((tip) => <div className="tutorial-tip" key={tip}>{tip}</div>)}</div>
        </GameCard>
      </div>
    </section>
  );
}
