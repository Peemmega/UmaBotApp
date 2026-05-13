import React from "react";
import { Badge, GameCard, SectionHeader, StatusChip } from "../../components/ui";
import "../../styles/tutorialsPage.css";

const quickFlow = [
  {
    icon: "🏟️",
    title: "เลือกสนาม",
    text: "เจ้าของห้องเลือกสนามจากระยะ Sprint, Mile, Medium หรือ Long แต่ละสนามมีจำนวนเทิร์นและ Path ต่างกัน",
  },
  {
    icon: "🏇",
    title: "เข้าร่วม",
    text: "ผู้เล่นกด Join ก่อนเกมเริ่ม แล้วเลือกสายวิ่ง Front, Pace, Late หรือ End",
  },
  {
    icon: "✨",
    title: "เตรียมเทิร์น",
    text: "ดู Phase, Path, คะแนน และเช็กว่า Skill หรือ Zone พร้อมใช้ไหม",
  },
  {
    icon: "🎲",
    title: "Run",
    text: "ระบบเลือกตารางเต๋าจากสายวิ่ง + Gold/White + Phase แล้วรวมโบนัสทั้งหมดเป็นคะแนน",
  },
  {
    icon: "✅",
    title: "ยืนยัน",
    text: "เมื่อทุกคนทอยแล้ว กดยืนยันเพื่อข้ามเทิร์น ลด cooldown ฟื้น Wit Mana และเริ่มเทิร์นถัดไป",
  },
];

const scoreRows = [
  ["ลูกเต๋า", "แต้มจากลูกที่ถูกเลือก ถ้ามี kh จะเลือกเฉพาะลูกสูงสุดตามจำนวนที่กำหนด"],
  ["Speed", "เพิ่มโบนัสรวมตอนทอย"],
  ["Power", "เพิ่มโบนัสรวม และเด่นบน Uphill เพราะ Power bonus ถูกคูณ"],
  ["Stamina", "เพิ่มโบนัสรวม และเป็น resource ที่ถูกใช้ตาม Path"],
  ["Gut", "ให้โบนัสเมื่ออยู่ในระยะ Gold กับผู้เล่นใกล้ ๆ และแรงขึ้นใน Phase 3-4"],
  ["Skill / Zone", "เพิ่ม d, kh, floor, cap, คะแนนรวม หรือผลอื่นตาม effect ที่ถูกใช้ก่อน Run"],
];

const diceRows = [
  ["Gold", "อยู่ใกล้ผู้เล่นอื่นในระยะ 20 คะแนน หรือระยะที่ Skill ปรับเพิ่ม/ลด"],
  ["White", "อยู่นอกระยะ Gold จากผู้เล่นที่ใกล้ที่สุด"],
  ["d", "จำนวนลูกเต๋าที่ทอย เช่น 4d คือทอย 4 ลูก"],
  ["kh", "keep highest เช่น 6dkh3 คือทอย 6 ลูก แล้วเลือก 3 ลูกที่สูงสุดมารวม"],
];

const styleRows = [
  {
    style: "Front",
    badge: "หนีต้นเกม",
    text: "เริ่มด้วย current speed สูงและ Gold Phase 1 แรง เหมาะกับการออกนำเร็ว แต่ต้องระวังช่วงท้าย",
    tip: "ใช้ Skill ต้นหรือกลางเกมเพื่อยืดระยะนำ",
  },
  {
    style: "Pace",
    badge: "สมดุล",
    text: "เล่นกลาง ๆ ได้ดี มี Skill หลายเงื่อนไข และตาราง Gold ดีขึ้นใน Phase 2-4",
    tip: "เหมาะกับผู้เล่นใหม่ที่อยากเล่นยืดหยุ่น",
  },
  {
    style: "Late",
    badge: "เร่งท้าย",
    text: "ต้นเกมไม่เด่นเท่าไร แต่ Phase 3-4 มีตารางเต๋าที่ดีขึ้น เหมาะกับการไล่ท้ายเกม",
    tip: "เก็บ Skill เพิ่ม d/kh ไว้ใช้ตอน Phase ที่เต๋าดี",
  },
  {
    style: "End",
    badge: "ปิดเกม",
    text: "เด่นมากช่วง Phase 4 และบาง Skill ต้องเข้า Last Spurt หรือทางตรงก่อนใช้",
    tip: "อย่าใช้ resource หมดก่อนช่วงปิดเกม",
  },
];

const pathRows = [
  ["Straight", "ใช้ Stamina 1"],
  ["Curve", "ใช้ Stamina 1, ลด cap ลูกเต๋า 5, เพิ่ม floor/cap ตาม Wit"],
  ["Uphill", "ใช้ Stamina 2, Power bonus x3, ลด current speed ครั้งแรกของช่วงขึ้นเนิน"],
  ["Downhill", "ไม่ใช้ Stamina, เพิ่ม floor/cap ตาม Wit x3"],
];

const statRows = [
  ["Speed", "เพิ่มโบนัสรวมตอนทอย"],
  ["Stamina", "ตั้งค่าเริ่มต้นเป็น 8 + Stamina, เพิ่มโบนัสรวม และใช้จ่ายตาม Path"],
  ["Power", "เพิ่มโบนัสรวม และมีผลมากบน Uphill"],
  ["Gut", "เพิ่มโบนัสเมื่ออยู่ใน Gold range กับผู้เล่นใกล้ ๆ"],
  ["Wit", "เพิ่ม Wit Mana เริ่มต้น, ฟื้น Mana ต่อเทิร์น, ช่วย WIT Reroll และช่วย floor/cap บาง Path"],
];

const skillFacts = [
  "Skill อยู่ใน slot 1-4 และโหลดตอนเริ่มเกม",
  "Skill ใช้ Wit Mana ตามค่า cost ถ้า Mana ไม่พอจะใช้ไม่ได้",
  "ใช้สำเร็จแล้วติด cooldown และ cooldown ลดเมื่อข้ามเทิร์น",
  "Skill หลายอันควรใช้ก่อน Run เพราะ effect จะไปอยู่ในการทอยครั้งถัดไป",
];

const skillTriggers = [
  "Path type",
  "Style",
  "Turn",
  "Phase",
  "Last Spurt",
  "Last Corner",
  "Position group",
  "Distance type",
  "Target distance",
  "Nearby count",
];

const zoneRows = [
  ["flat", "+25 คะแนนรวมต่อ 1 แต้ม build"],
  ["add_dkh", "+2 ลูกเต๋า และ +2 kh ต่อ 1 แต้ม build"],
  ["floor", "+7 แต้มขั้นต่ำลูกเต๋าต่อ 1 แต้ม build"],
  ["cap", "+7 แต้มสูงสุดลูกเต๋าต่อ 1 แต้ม build"],
  ["self_heal_stamina", "ฟื้น Stamina +1 ต่อ 1 แต้ม build"],
  ["modify_current_speed", "เพิ่ม current speed ผ่านระบบ acceleration ค่า 0.5 ต่อ 1 แต้ม build"],
];

const rerollRows = [
  ["Reroll ปกติ", "เริ่มเกมมี 2 ครั้ง ใช้แล้วลบคะแนน roll เดิมก่อนทอยใหม่"],
  ["WIT Reroll", "เริ่มเกมมี 2 ครั้ง ใช้ได้เมื่อ base roll ต่ำกว่า Wit x 5"],
  ["ข้อจำกัด", "ถ้าเทิร์นนั้นถูกห้าม reroll เช่นหลังใช้ Rush จะกด Reroll ไม่ได้"],
];

const turnSteps = [
  ["1", "ดู Phase / Path", "เช็กว่าเทิร์นนี้อยู่ Phase ไหน และ Path เป็น Straight, Curve, Uphill หรือ Downhill"],
  ["2", "ใช้ Skill / Zone", "ถ้าเงื่อนไขตรงและคุ้ม ให้ใช้ก่อน Run เพื่อเตรียม buff"],
  ["3", "Run", "ระบบทอยตาม Style + Gold/White + Phase แล้วรวมโบนัส stat/path/skill/zone"],
  ["4", "Reroll ถ้าจำเป็น", "ถ้าผลแย่มากและยังมีสิทธิ์ reroll ให้ตัดสินใจก่อนหมดจังหวะ"],
  ["5", "Confirm Turn", "เมื่อทุกคนทอยแล้ว กดยืนยันเพื่อไปเทิร์นถัดไป"],
];

const beginnerTips = [
  "ถ้ายังไม่รู้จะเล่นสายไหน Pace เป็นตัวเลือกที่ยืดหยุ่นและอ่านเกมง่าย",
  "ดู Path ก่อนใช้ Skill เพราะหลาย Skill ต้องการทางตรง โค้ง ขึ้นเนิน หรือลงเนิน",
  "อย่าใช้ Zone เร็วเกินไป ถ้า build ของคุณเน้น d/kh หรือ cap ให้รอเทิร์นที่เต๋าดี",
  "ระวัง Stamina ต่ำ เพราะถ้าจ่ายค่า Path ไม่พอจะโดนลด cap ลูกเต๋า 20",
  "Gold คือระยะใกล้ผู้เล่นอื่น ไม่ได้แปลว่าดีเสมอ ต้องดูตารางเต๋าของสายตัวเองด้วย",
  "เก็บ Wit Mana ไว้ใช้ Skill สำคัญช่วงท้าย โดยเฉพาะสาย Late และ End",
];

function InfoTable({ rows, compact = false }) {
  return (
    <div className={`tutorial-info-table ${compact ? "is-compact" : ""}`}>
      {rows.map(([label, text]) => (
        <div className="tutorial-info-row" key={label}>
          <strong>{label}</strong>
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}

function Callout({ type = "tip", title, children }) {
  return (
    <div className={`tutorial-callout tutorial-callout-${type}`}>
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  );
}

export default function TutorialsPage() {
  return (
    <section className="sheet-card tutorials-page">
      <div className="title-banner">
        <h2>Tutorial ภาษาไทย</h2>
      </div>

      <div className="padding-content tutorials-content">
        <GameCard className="tutorial-hero">
          <div className="tutorial-hero-copy">
            <SectionHeader
              kicker="คู่มือผู้เล่นใหม่"
              title="UmaDnD Race เล่นยังไง"
              action={<StatusChip status="live">อิงจาก code จริง</StatusChip>}
            />
            <p>
              คู่มือสรุประบบแข่งแบบเทิร์น: เลือกสายวิ่ง ใช้ Skill/Zone ให้ถูกจังหวะ
              ทอยเต๋า เก็บคะแนน และจบเกมด้วยอันดับคะแนนรวม
            </p>
            <div className="tutorial-chip-row">
              <Badge>Turn-based Race</Badge>
              <Badge>Skill ใช้ Wit Mana</Badge>
              <Badge>Zone ใช้ได้ 1 ครั้ง</Badge>
              <Badge>คะแนนสูงสุดชนะ</Badge>
            </div>
          </div>
          <div className="tutorial-hero-panel">
            <span>🏁</span>
            <strong>เริ่มต้นง่าย ๆ</strong>
            <p>ดู Phase และ Path ก่อนทุกครั้ง แล้วค่อยตัดสินใจว่าจะใช้ Skill, Zone หรือ Run ทันที</p>
          </div>
        </GameCard>

        <section className="tutorial-section">
          <SectionHeader kicker="Quick Start" title="เกมเล่นยังไง" />
          <div className="tutorial-flow-grid">
            {quickFlow.map((item) => (
              <GameCard className="tutorial-flow-card" key={item.title}>
                <div className="tutorial-flow-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </GameCard>
            ))}
          </div>
        </section>

        <div className="tutorial-grid two-col">
          <GameCard className="tutorial-card accent-gold">
            <SectionHeader kicker="Win Condition" title="วิธีชนะ" />
            <ul className="tutorial-list">
              <li>คะแนนของผู้เล่นเก็บในค่า score</li>
              <li>คะแนนเพิ่มจากผลรวมการทอย และ Skill บางประเภทที่ปรับคะแนนโดยตรง</li>
              <li>เมื่อจบเกม ระบบเรียงอันดับจาก score มากไปน้อย</li>
              <li>ผู้เล่นอันดับ 1 คือผู้ชนะ</li>
            </ul>
            <Callout type="note" title="TODO">
              ยังไม่พบ logic tie-break เฉพาะตอนคะแนนเท่ากันใน backend ปัจจุบัน จึงอธิบายตามการ sort ด้วย score เท่านั้น
            </Callout>
          </GameCard>

          <GameCard className="tutorial-card">
            <SectionHeader kicker="Scoring" title="ระบบคะแนน" />
            <p>คะแนนทอยมาจากลูกเต๋าที่เลือก รวมกับโบนัสจาก stat, Path, Skill และ Zone</p>
            <InfoTable rows={scoreRows} />
          </GameCard>
        </div>

        <div className="tutorial-grid two-col">
          <GameCard className="tutorial-card">
            <SectionHeader kicker="Dice" title="ระบบเต๋า Gold / White / kh" />
            <p>ทุกครั้งที่ Run ระบบเลือกตารางเต๋าจากสายวิ่ง + Gold/White + Phase ปัจจุบัน</p>
            <InfoTable rows={diceRows} />
            <Callout title="ตัวอย่าง">
              6dkh3 คือทอย 6 ลูก แล้วเลือก 3 ลูกที่สูงสุดมารวมเป็น base roll
            </Callout>
          </GameCard>

          <GameCard className="tutorial-card">
            <SectionHeader kicker="Phase" title="จังหวะของการแข่งขัน" />
            <p>
              สนามถูกแบ่งเป็น 4 Phase จากจำนวนเทิร์นทั้งหมด เช่น 8 เทิร์นจะประมาณ Phase ละ 2 เทิร์น
            </p>
            <div className="tutorial-phase-row">
              <StatusChip status="live">Phase 1 ต้นเกม</StatusChip>
              <StatusChip status="scheduled">Phase 2 กลางเกม</StatusChip>
              <StatusChip status="open">Phase 3 ท้ายเกม</StatusChip>
              <StatusChip status="danger">Phase 4 ปิดเกม</StatusChip>
            </div>
            <Callout type="warning" title="สำคัญ">
              Phase มีผลกับตารางเต๋า และเป็นเงื่อนไขของ Skill หลายอัน
            </Callout>
          </GameCard>
        </div>

        <section className="tutorial-section">
          <SectionHeader kicker="Running Style" title="สายการเล่น Front / Pace / Late / End" />
          <div className="tutorial-style-grid">
            {styleRows.map((item) => (
              <GameCard className="tutorial-style-card" key={item.style}>
                <div className="tutorial-style-head">
                  <h3>{item.style}</h3>
                  <StatusChip status="info">{item.badge}</StatusChip>
                </div>
                <p>{item.text}</p>
                <small>{item.tip}</small>
              </GameCard>
            ))}
          </div>
        </section>

        <div className="tutorial-grid two-col">
          <GameCard className="tutorial-card">
            <SectionHeader kicker="Track" title="ระบบสนามและ Path" />
            <p>แต่ละสนามกำหนดระยะ จำนวนเทิร์น และลำดับ Path ของทุกเทิร์นไว้ใน race preset</p>
            <InfoTable rows={pathRows} />
            <Callout type="warning" title="ระวัง Stamina">
              ถ้า Stamina ไม่พอจ่ายค่า Path จะโดนลด cap ลูกเต๋า 20
            </Callout>
          </GameCard>

          <GameCard className="tutorial-card">
            <SectionHeader kicker="Stats" title="ค่าสเตตัสที่ต้องรู้" />
            <InfoTable rows={statRows} />
          </GameCard>
        </div>

        <GameCard className="tutorial-card accent-green">
          <SectionHeader kicker="Skill System" title="ระบบ Skill" />
          <div className="tutorial-split">
            <div>
              <p>Skill คือความสามารถที่ใส่ไว้ใน slot และกดใช้ระหว่างเกม ส่วนมากควรใช้ก่อน Run</p>
              <ul className="tutorial-list">
                {skillFacts.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>เงื่อนไขที่พบใน code</h3>
              <div className="tutorial-tag-cloud">
                {skillTriggers.map((trigger) => (
                  <Badge key={trigger}>{trigger}</Badge>
                ))}
              </div>
            </div>
          </div>
          <Callout title="Effect ที่พบ">
            เพิ่มคะแนนรวม, เพิ่ม d/kh, เพิ่ม floor/cap, ฟื้นหรือลด Stamina, ปรับ Gold range, debuff เทิร์นถัดไป และเพิ่ม current speed
          </Callout>
        </GameCard>

        <div className="tutorial-grid two-col">
          <GameCard className="tutorial-card">
            <SectionHeader kicker="Zone System" title="ระบบ Zone" />
            <p>Zone เป็น build พิเศษของผู้เล่น ใช้ในเกมได้ 1 ครั้ง แล้วใส่ buff ให้การทอยหรือฟื้นฟูทันทีตามชนิด build</p>
            <InfoTable rows={zoneRows} compact />
            <Callout title="Tip">
              ถ้า Zone เน้น d/kh หรือ cap ให้เก็บไว้ใช้ตอนตารางเต๋าของสายคุณกำลังดี
            </Callout>
          </GameCard>

          <GameCard className="tutorial-card">
            <SectionHeader kicker="Reroll System" title="ระบบ Reroll" />
            <InfoTable rows={rerollRows} />
            <Callout type="warning" title="Warning">
              Rush จะตั้ง no_reroll_this_turn ทำให้เทิร์นนั้น Reroll ไม่ได้
            </Callout>
          </GameCard>
        </div>

        <GameCard className="tutorial-card accent-blue">
          <SectionHeader kicker="Example Turn" title="ตัวอย่างการเล่น 1 เทิร์น" />
          <div className="tutorial-turn-flow">
            {turnSteps.map(([num, title, text]) => (
              <div className="tutorial-turn-step" key={num}>
                <span>{num}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </GameCard>

        <GameCard className="tutorial-card">
          <SectionHeader kicker="New Player Tips" title="Tips สำหรับมือใหม่" />
          <div className="tutorial-tip-grid">
            {beginnerTips.map((tip) => (
              <div className="tutorial-tip" key={tip}>
                {tip}
              </div>
            ))}
          </div>
        </GameCard>
      </div>
    </section>
  );
}
