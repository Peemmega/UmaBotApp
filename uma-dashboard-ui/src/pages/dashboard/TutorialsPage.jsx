import React from "react";
import { Badge, GameCard, SectionHeader, StatusChip } from "../../components/ui";
import "../../styles/tutorialsPage.css";

const flowSteps = [
  {
    title: "1. สร้างห้องแข่ง",
    text: "ห้องแข่งอิงจาก Race Preset ที่กำหนดสนาม ระยะ จำนวนเทิร์น และลำดับทางวิ่ง เช่น ทางตรง โค้ง ขึ้นเนิน ลงเนิน",
  },
  {
    title: "2. เข้าร่วมและเลือกสายวิ่ง",
    text: "ผู้เล่นเข้าห้องก่อนเกมเริ่ม และเลือก Style ได้เฉพาะ Front, Pace, Late หรือ End ตามที่ backend อนุญาต",
  },
  {
    title: "3. เริ่มเกม",
    text: "เมื่อเริ่มเกม ระบบโหลด stat, skill slot, zone และตั้งค่าเริ่มต้น เช่น Reroll 2 ครั้ง, WIT Reroll 2 ครั้ง, Stamina และ Wit Mana",
  },
  {
    title: "4. เล่นเป็นเทิร์น",
    text: "ในแต่ละเทิร์นผู้เล่นใช้ Skill หรือ Zone ได้ก่อนทอย จากนั้นทอยเต๋าเพื่อเพิ่มคะแนนของเทิร์นนั้น",
  },
  {
    title: "5. ยืนยันจบเทิร์น",
    text: "เมื่อทุกคนทอยแล้ว ผู้เล่นกดยืนยันเพื่อไปเทิร์นถัดไป ถ้าหมดเวลาแต่ยังมีคนไม่ทอย ระบบยังไม่ข้ามเทิร์นอัตโนมัติ",
  },
];

const statRows = [
  ["Speed", "เพิ่มโบนัสรวมตอนทอย โดยถูกคูณตามผลของสภาพทางบางประเภท"],
  ["Stamina", "ตั้งค่า Stamina เริ่มต้นเป็น 8 + ค่า Stamina และให้โบนัสรวมตอนทอย"],
  ["Power", "ให้โบนัสรวมตอนทอย และเด่นขึ้นบนทางขึ้นเนินที่คูณผล Power"],
  ["Gut", "ให้โบนัสเมื่ออยู่ในระยะ Gold กับผู้เล่นใกล้ ๆ และ phase 3-4 จะคูณผลนี้มากขึ้น"],
  ["Wit", "เพิ่ม Wit Mana เริ่มต้น, ฟื้น Wit Mana ต่อเทิร์น, ช่วย WIT Reroll และเพิ่ม floor/cap บางสภาพทาง"],
];

const pathRows = [
  ["Straight", "ใช้ Stamina 1"],
  ["Curve", "ใช้ Stamina 1, ลด cap ลูกเต๋า 5, เพิ่ม floor/cap ตาม Wit"],
  ["Uphill", "ใช้ Stamina 2, Power bonus x3, ลด current speed ครั้งแรกของช่วงขึ้นเนิน"],
  ["Downhill", "ไม่ใช้ Stamina, เพิ่ม floor/cap ตาม Wit x3"],
];

const zoneRows = [
  ["flat", "+25 ผลรวมต่อ 1 แต้ม build"],
  ["add_dkh", "+2 จำนวนลูกเต๋าและ +2 keep-highest ต่อ 1 แต้ม build"],
  ["floor", "+7 แต้มขั้นต่ำลูกเต๋าต่อ 1 แต้ม build"],
  ["cap", "+7 แต้มสูงสุดลูกเต๋าต่อ 1 แต้ม build"],
  ["self_heal_stamina", "ฟื้น Stamina +1 ต่อ 1 แต้ม build"],
  ["modify_current_speed", "เพิ่ม current speed ผ่านสูตร acceleration ค่า 0.5 ต่อ 1 แต้ม build"],
];

const tips = [
  "Front เหมาะกับการหนีตั้งแต่ต้น เพราะตารางเต๋า Gold phase 1 ให้จำนวนลูกเยอะ แต่ช่วงท้ายต้องระวังโดนไล่",
  "Pace เล่นกลาง ๆ ได้ดี ใช้เงื่อนไข skill หลายแบบ และตาราง Gold ดีขึ้นใน phase 2-4",
  "Late และ End มักรอจังหวะ phase 3-4 หรือ Last Spurt ก่อนระเบิดความเร็ว",
  "ดู path ของเทิร์นปัจจุบันก่อนใช้ skill เพราะหลาย skill ต้องการ Straight, Curve, Uphill หรือ Downhill",
  "อย่าใช้ Zone แบบสุ่ม ถ้า build เน้น dice/cap/floor ควรกดก่อนทอยในเทิร์นสำคัญ",
  "Wit Mana คือทรัพยากรของ skill ใช้หมดแล้ว skill จะกดไม่ได้ แม้ cooldown จะพร้อม",
];

const diceRows = [
  ["Gold", "อยู่ใกล้ผู้เล่นอื่นในระยะ 20 แต้ม หรือตามระยะที่ skill ปรับเพิ่ม/ลด"],
  ["White", "อยู่นอกระยะ Gold จากผู้เล่นที่ใกล้ที่สุด"],
  ["d", "จำนวนลูกเต๋าที่ทอย เช่น 4d คือทอย 4 ลูก"],
  ["kh", "keep highest เช่น 6dkh3 คือทอย 6 ลูกแล้วเลือก 3 ลูกที่มากที่สุด"],
];

export default function TutorialsPage() {
  return (
    <section className="sheet-card tutorials-page">
      <div className="title-banner">
        <h2>Tutorial ภาษาไทย</h2>
      </div>

      <div className="padding-content tutorials-content">
        <GameCard className="tutorial-hero">
          <SectionHeader
            kicker="อิงจาก backend UmaDnDBot"
            title="คู่มือเริ่มเล่น UmaDnD Race"
            action={<StatusChip status="info">ไม่เปลี่ยน gameplay</StatusChip>}
          />
          <p>
            หน้านี้สรุประบบจาก code จริงของ race, skill, zone, dice และ scoring
            เพื่อให้ผู้เล่นใหม่รู้ว่าต้องดูอะไรในแต่ละเทิร์นก่อนกดทอย
          </p>
          <div className="tutorial-chip-row">
            <Badge>Turn-based race</Badge>
            <Badge>Skill uses Wit Mana</Badge>
            <Badge>Zone ใช้ได้ 1 ครั้งต่อเกม</Badge>
            <Badge>คะแนนมากสุดนำ</Badge>
          </div>
        </GameCard>

        <div className="tutorial-grid tutorial-grid-steps">
          {flowSteps.map((step) => (
            <GameCard key={step.title} className="tutorial-card">
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </GameCard>
          ))}
        </div>

        <GameCard className="tutorial-card">
          <SectionHeader kicker="Win Condition" title="ใครชนะ และคะแนนตัดสินยังไง" />
          <ul className="tutorial-list">
            <li>คะแนนของผู้เล่นเก็บในค่า `score` และเพิ่มจากผลรวมการทอยหรือผลของ skill บางประเภท</li>
            <li>เมื่อจัดอันดับ ระบบเรียงผู้เล่นด้วย `score` จากมากไปน้อย ผู้ที่คะแนนรวมสูงกว่าจะอยู่ลำดับบนกว่า</li>
            <li>การแข่งขันเดินไปตาม `max_turn` ของสนาม เช่น 8, 12, 16 หรือมากกว่านั้นตาม race preset</li>
            <li className="tutorial-note">
              TODO: ยังไม่พบ tie-break เฉพาะสำหรับกรณีคะแนนเท่ากันใน backend; code ปัจจุบัน sort ด้วยคะแนนอย่างเดียว
            </li>
          </ul>
        </GameCard>

        <div className="tutorial-grid">
          <GameCard className="tutorial-card">
            <SectionHeader kicker="Phase / Style" title="จังหวะของการแข่งขัน" />
            <p>
              ทุกสนามถูกแบ่งเป็น 4 phase จากจำนวนเทิร์นทั้งหมดด้วยสูตร
              `ceil(turn / (max_turn / 4))` แล้วจำกัดค่าไว้ระหว่าง 1-4
            </p>
            <div className="tutorial-chip-row">
              <StatusChip status="live">Phase 1: ต้นเกม</StatusChip>
              <StatusChip status="scheduled">Phase 2: กลางเกม</StatusChip>
              <StatusChip status="open">Phase 3: ท้ายเกม</StatusChip>
              <StatusChip status="danger">Phase 4: Last Spurt ได้บางเงื่อนไข</StatusChip>
            </div>
            <p>
              Style มีผลกับตารางเต๋าและเพดานความเร็ว: Front เด่นต้นเกม, Pace สมดุล,
              Late เร่งช่วงท้าย, End เด่นมากตอน Last Spurt
            </p>
          </GameCard>

          <GameCard className="tutorial-card">
            <SectionHeader kicker="Dice" title="Gold, White และ kh" />
            <div className="tutorial-table">
              {diceRows.map(([name, desc]) => (
                <div key={name}>
                  <strong>{name}</strong>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </GameCard>
        </div>

        <GameCard className="tutorial-card">
          <SectionHeader kicker="Scoring" title="การทอยเต๋าและการเก็บคะแนน" />
          <ul className="tutorial-list">
            <li>ระบบเลือกกฎเต๋าจาก Style + Gold/White + Phase ของเทิร์นนั้น</li>
            <li>แต้มลูกเต๋าสุ่มตั้งแต่ floor ถึง cap โดย cap มาจาก current speed และผลของ path/skill</li>
            <li>ถ้ามีกฎ `kh` ระบบเลือกเฉพาะลูกที่มากที่สุดตามจำนวน kh แล้วค่อยรวมคะแนน</li>
            <li>คะแนนรวมของการทอยเพิ่มโบนัสจาก Speed, Power, Stamina, Gut และผล skill/zone ที่ค้างอยู่</li>
            <li>หลังทอย ระบบเพิ่ม `total` เข้า `score` ของผู้เล่นทันที</li>
          </ul>
        </GameCard>

        <div className="tutorial-grid">
          <GameCard className="tutorial-card">
            <SectionHeader kicker="Stats" title="ค่าสเตตัสสำคัญ" />
            <div className="tutorial-table">
              {statRows.map(([name, desc]) => (
                <div key={name}>
                  <strong>{name}</strong>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </GameCard>

          <GameCard className="tutorial-card">
            <SectionHeader kicker="Track Path" title="สภาพทางในแต่ละเทิร์น" />
            <div className="tutorial-table">
              {pathRows.map(([name, desc]) => (
                <div key={name}>
                  <strong>{name}</strong>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </GameCard>
        </div>

        <GameCard className="tutorial-card">
          <SectionHeader kicker="Skill" title="Skill คืออะไร และใช้ได้เมื่อไหร่" />
          <ul className="tutorial-list">
            <li>ผู้เล่นมี skill slot 1-4 ที่โหลดตอนเริ่มเกม จากนั้นกดใช้จากเมนู Skill ในเทิร์นของตัวเอง</li>
            <li>Skill ใช้ `cost` เป็น Wit Mana ถ้า Wit Mana ไม่พอจะใช้ไม่ได้</li>
            <li>หลังใช้สำเร็จ skill จะติด `cooldown` และ cooldown ลดลงเมื่อข้ามเทิร์น</li>
            <li>Trigger ที่พบใน code มี path type, style, turn, phase, Last Spurt, Last Corner, position group, distance type, surface, target distance, front blocked และ nearby count</li>
            <li>ผลของ skill มีทั้งเพิ่มแต้มรวม, เพิ่ม d/kh, เพิ่ม floor/cap, ฟื้นหรือลด Stamina, ปรับ Gold range, debuff เทิร์นถัดไป และเพิ่ม current speed</li>
          </ul>
        </GameCard>

        <div className="tutorial-grid">
          <GameCard className="tutorial-card">
            <SectionHeader kicker="Zone" title="Zone คืออะไร" />
            <p>
              Zone เป็น build พิเศษของผู้เล่น ใช้ในเกมได้ 1 ครั้งผ่านปุ่ม Zone
              แล้วผลจะถูกใส่เป็น buff สำหรับการทอยหรือฟื้นฟูทันทีตามชนิด build
            </p>
            <div className="tutorial-table compact">
              {zoneRows.map(([name, desc]) => (
                <div key={name}>
                  <strong>{name}</strong>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </GameCard>

          <GameCard className="tutorial-card">
            <SectionHeader kicker="Reroll" title="Reroll คืออะไร" />
            <ul className="tutorial-list">
              <li>เมื่อทอยแล้ว ระบบเปิดปุ่ม Reroll ถ้าผู้เล่นยังไม่ถูกห้าม reroll ในเทิร์นนั้น</li>
              <li>Reroll ปกติเริ่มต้น 2 ครั้งต่อเกม และใช้เพื่อลบคะแนนทอยเดิมก่อนทอยใหม่</li>
              <li>WIT Reroll เริ่มต้น 2 ครั้ง ใช้ได้เมื่อ base roll ต่ำกว่า `wit * 5`</li>
              <li>Rush จะตั้ง `no_reroll_this_turn` และทำให้เทิร์นนั้น reroll ไม่ได้</li>
            </ul>
          </GameCard>
        </div>

        <GameCard className="tutorial-card">
          <SectionHeader kicker="Example Turn" title="ตัวอย่างการเล่น 1 รอบ" />
          <ol className="tutorial-steps">
            <li>ดูว่าตอนนี้อยู่เทิร์นไหน phase ไหน และ path เป็น Straight, Curve, Uphill หรือ Downhill</li>
            <li>เช็ก Wit Mana, cooldown, trigger ของ skill และดูว่า Zone ยังเหลือไหม</li>
            <li>ถ้าเงื่อนไขตรง ใช้ skill หรือ Zone เพื่อเตรียม buff ให้การทอย</li>
            <li>กดทอย ระบบเลือกตารางเต๋าจาก Style + Gold/White + Phase แล้วรวมโบนัส stat/skill/path</li>
            <li>คะแนนที่ได้ถูกบวกเข้า score รวม จากนั้นเลือกว่าจะ Reroll ได้หรือไม่</li>
            <li>เมื่อทุกคนทอยแล้ว กดยืนยันเพื่อข้ามเทิร์น ระบบลด cooldown, ฟื้น Wit Mana และเพิ่ม current speed ตามรอบ</li>
          </ol>
        </GameCard>

        <GameCard className="tutorial-card">
          <SectionHeader kicker="New Player Tips" title="Tips สำหรับผู้เล่นใหม่" />
          <div className="tutorial-tip-grid">
            {tips.map((tip) => (
              <div key={tip} className="tutorial-tip">
                {tip}
              </div>
            ))}
          </div>
        </GameCard>
      </div>
    </section>
  );
}
