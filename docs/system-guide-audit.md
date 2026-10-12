# ตรวจเนื้อหาคู่มือ Race System

ตรวจวันที่ 12 ตุลาคม 2026 โดยยึดโค้ดใน checkout `UmaDnDBot` เป็นหลัก เทียบกับ `คู่มือระบบแข่ง.pdf` 35 หน้า และ `Status Formula.pdf` 5 หน้า นับหน้า PDF จากหน้าแรกของไฟล์

หน้าเว็บที่เพิ่ม: `/dashboard/system/stats-skills-zone`, `/dashboard/system/races`, `/dashboard/system/lanes`, `/dashboard/system/running-styles`

## จุดที่เอกสารไม่ตรงกับระบบ

| เรื่อง | ในเอกสาร | พฤติกรรมในระบบที่นำมาใช้บนเว็บ | หลักฐาน |
| --- | --- | --- | --- |
| สูตรความเร่งแบบเทิร์น | Status Formula หน้า 1: `(0.3 + 0.1 × Power) × Track Aptitude Bonus` | `0.3 + (scale × effective_power ×1.5 ×ระดับความเร่ง)` โดย `effective_power = round(Power × Track modifier)`; scale ปกติ 0.10, Front P1 0.12, Pace ทุก Phase 0.11, Late P3 0.12, End P4 0.14 เลนเปียกคูณผลความเร่ง 0.5 | [progression.py](../../UmaDnDBot/utils/game/progression.py), [race_aptitude.py](../../UmaDnDBot/utils/race/race_aptitude.py) |
| ตัวอย่าง Aptitude ในคู่มือ | คู่มือระบบแข่ง หน้า 5: Turf E = 0%, Medium G = −10%, End D = +5% | ระบบใช้ G 0%, F +5%, E +10%, D +15%, C +20%, B +25%, A +30%, S +35% ตัวอย่างเดิมจึงต้องเป็น Turf E +10%, Medium G 0%, End D +15% **ตารางรูปภาพใน Status Formula หน้า 2 ตรงกับระบบแล้ว** | [race_aptitude.py](../../UmaDnDBot/utils/race/race_aptitude.py) |
| Speed และ Distance aptitude | Status Formula หน้า 1 กล่าวถึงเพดาน +Speed; หน้า 2 อธิบาย Distance เฉพาะโบนัสผลรวม | ระบบใช้ `round(Speed × Distance modifier)` เพิ่มเพดานด้วย และยังเพิ่มเปอร์เซ็นต์ผลรวม Run ก่อนโทษ Blocked/Fatigue โบนัสคะแนนพื้นฐาน +2 ×Speed ยังคงใช้ Stat เดิม | [race_aptitude.py](../../UmaDnDBot/utils/race/race_aptitude.py), [progression.py](../../UmaDnDBot/utils/game/progression.py), [race_dice.py](../../UmaDnDBot/utils/race/race_dice.py) |
| Zone ฟื้น Stamina | คู่มือหน้า 9 ระบุ 10% ต่อระดับ; ตัวอย่างระบุ 3 หน่วย; Status Formula หน้า 3 ระบุ STA +1 | Zone ฟื้น **100 STA ต่อระดับ** ผ่าน `runtime_stamina_effect_units` จึงฟื้น 300 เมื่อ 3 ระดับ ไม่ได้คิด 10% ของพลังสูงสุด (เอฟเฟกต์ฟื้นของ Skill ใช้สูตรเปอร์เซ็นต์อีกชุด) | [zone_manager.py](../../UmaDnDBot/utils/zone/zone_manager.py), [runtime_stamina.py](../../UmaDnDBot/utils/race/runtime_stamina.py), [skill_effect_registry.py](../../UmaDnDBot/utils/skill/skill_effect_registry.py) |
| ทางเลือก Zone | คู่มือหน้า 9 และ Status Formula หน้า 3 มี 5 ทางหลัก | ระบบมีทางที่ 6 คือ `race_speed` เพิ่ม Stat Speed ในรัน +1 ต่อระดับ มีต้นทุน 1 Zone Point และคำนวณค่าที่ใช้แข่งใหม่ หน้าเว็บจึงแสดงครบ 6 ทาง | [zone_preset.py](../../UmaDnDBot/utils/zone/zone_preset.py), [zone_manager.py](../../UmaDnDBot/utils/zone/zone_manager.py) |
| ต้นทุนเลนในเทิร์นแรก | คู่มือหน้า 18 แสดงฐานเลน 90/100/110/120/130/140 โดยไม่ได้ระบุข้อยกเว้น | เทิร์น 1 ใช้ฐาน 100 ทุกเลนก่อนคูณเส้นทาง; ตั้งแต่เทิร์น 2 ใช้ฐานเลนจริง แดดเพิ่ม 10 แล้ว Draft ลดต้นทุนรวม 10% | [stamina_rules.py](../../UmaDnDBot/utils/race/stamina_rules.py) |
| การรับประกัน Wit Reroll | คู่มือหน้า 21 ระบุผลใหม่รับประกันว่าดีกว่าผลเดิม | โค้ดรับประกันที่ผล **ก่อนโทษ Blocked** จากนั้นคิดโทษเลนใหม่ จึงไม่ได้รับประกันคะแนนสุดท้ายทุกกรณี ตรวจด้วยฟังก์ชันจริงพบตัวอย่าง: คะแนนเก่า 85 → รับประกันก่อน Blocked 86 → โทษ 5% → คะแนนใหม่ 82 หน้าเว็บอธิบายเกณฑ์และสิทธิ์โดยไม่รับประกันผลสุดท้าย | [run_reroll_view.py](../../UmaDnDBot/views/run_reroll_view.py), [race_dice.py](../../UmaDnDBot/utils/race/race_dice.py), [reroll_service.py](../../UmaDnDBot/utils/dice/reroll_service.py), [race_lane.py](../../UmaDnDBot/utils/race/race_lane.py) |

## จุดที่ต้องระบุขอบเขตหรือขยายความ

- **ความเร็วเริ่มต้นกับเพดาน:** ค่าตาราง 16/21/22/23 ของ Front และตารางทั้ง 4 สายตรงกับ Status Formula หน้า 5 แต่ตัวแรกเป็นค่าเริ่มต้น ระบบตั้งเพดานใน P1 และ P2 ด้วยค่า Mid +Speed หลังความถนัด ตัวเลขในตารางไม่ได้หมายถึงความเร็วที่กระโดดขึ้นทันทีเมื่อเริ่ม Phase
- **จำนวนเทิร์น:** 8/8/12/16 ตรงกับ Path ของสนามปัจจุบันที่ตรวจ ระบบคำนวณจำนวนเทิร์นจาก `len(path)` ไม่ได้ใช้หมวดระยะเป็นข้อบังคับ สำหรับสนามกำหนดเองต้องอ่าน Path จริง แบ่งระยะตามเมตร: Sprint ≤1400, Mile ≤1800, Medium ≤2400, Long >2400
- **เนินขึ้น:** คู่มือหน้า 22 ระบุลดความเร็วปัจจุบัน 5% หนึ่งครั้ง โค้ดตั้ง flag กันการหักซ้ำระหว่าง Reroll แล้วล้าง flag ทุกเทิร์น ดังนั้นเป็นหนึ่งครั้ง **ต่อเทิร์นที่เจอเนินขึ้น** ไม่ใช่ตลอดการแข่งขัน
- **In Pack:** ฐานระยะ Score ไม่เกิน 20 และต่างเลนไม่เกิน 1 โดยสกิลแก้ไขได้ โหมดลูกเต๋าที่มีผู้เล่นคนเดียวคืนค่า In Pack แต่จำนวนคนใกล้เป็น 0
- **Wit Reroll:** เกณฑ์ตรวจ `base_total` ซึ่งคือผลรวมลูกเต๋าที่เลือกก่อนโบนัส ไม่ใช่คะแนน Run สุดท้าย และคูณ Style aptitude ที่เกณฑ์และ Mana regen แต่ไม่ได้คูณ Mana เริ่มต้น
- **Passive:** ระบบเรียกสกิลอัตโนมัติครั้งแรกที่ผ่านเงื่อนไขตอนเริ่มเทิร์น ยังตรวจ Mana และกติกาห้อง ไม่ใช่ทุก Passive ต้องทำงานในเทิร์นแรก
- **Power ลด Blocked:** ใช้ Power หลัง Track aptitude หักจากโทษ 10% ต่อคนก่อนจำกัดโทษสูงสุด 20%; โทษต่ำสุดคือ 0% ไม่จำเป็นว่าต้องอยู่ใน In Pack จึงจะถูกบัง ตัวอย่าง 3 คนและ Power 6: 30% − 6% = 24% แล้วตัดเหลือ 20% เพดาน Power พื้นฐานของระบบหลักคือ 8 และ Track S คูณ 1.35 จึงได้ Power ใช้แข่งสูงสุด 11; หน้า Test ใช้เพดานพื้นฐาน 12 จึงได้ 16 คู่มือดึงเพดานจาก `MAX_CORE_STAT` เพื่อให้ตัวอย่าง Block ใช้ช่วงค่าตามระบบ ([race_lane.py](../../UmaDnDBot/utils/race/race_lane.py), [database.py](../../UmaDnDBot/utils/storage/database.py), [race_aptitude.py](../../UmaDnDBot/utils/race/race_aptitude.py))
- **Block/Rush:** Block ใช้ได้ครั้งเดียวต่อเทิร์น เลือกคู่แข่งด้านหลังในเลนเดียวกันหรือเลนติดกัน ต้องถอยเข้า In Pack ไม่เกิน 20 คะแนน Rush เพิ่ม Score 20 แลก STA 5% ของค่าสูงสุดและใช้ได้ครั้งเดียวต่อการแข่งขัน

## ข้อความเก่าที่พบในทรัพยากรระบบ

`build_path_effect_text` ใน [race_tracks.py](../../UmaDnDBot/utils/race/race_tracks.py) ยังอธิบายเนินขึ้นว่า Speed เหลือครึ่งหนึ่ง และอธิบายต้นทุนพลัง/ผล Wit ไม่ครบตาม `get_path_effect` และ `calculate_roll_stamina_cost` ข้อความนี้ไม่ได้เป็นสูตรที่ระบบใช้คำนวณ

ภาพ `gameplay_lane.webp` มีข้อความเก่าแบบเดียวกันที่ด้านขวา หน้า System และหน้ารายละเอียดจึงแสดงเฉพาะฝั่งแผนที่เลน พร้อมอธิบายกติกาปัจจุบันด้วยข้อความใหม่ โดยไม่ได้แก้ไฟล์ภาพต้นฉบับหรือกติกาของบอท

## ขอบเขตระบบที่ใช้

ผู้ใช้ยืนยันวันที่ 12 ตุลาคม 2026 ว่ายุติการใช้ระบบ Timing คู่มือทั้ง 4 หัวข้อจึงอ้างอิงเฉพาะระบบแข่งแบบเทิร์นและลูกเต๋า รวมถึงข้อมูลที่ export สำหรับตารางบนหน้าเว็บ

## การตรวจและการดูแลข้อมูล

ตัวเลขตารางมาจาก [export_system_guide.py](../scripts/export_system_guide.py) ซึ่งอ่าน AST ของบอทและเรียกฟังก์ชันความเร่งที่ใช้จริง โดยไม่ import โมดูลฐานข้อมูล ผลลัพธ์บันทึกใน [systemGuideRules.json](../uma-dashboard-ui/src/data/systemGuideRules.json)

```powershell
python scripts/export_system_guide.py --check
python scripts/export_system_guide.py
```

ใช้ `--check` ตรวจว่าตารางยังตรงกับบอท หลังระบบเปลี่ยนให้ export ใหม่และตรวจข้อความอธิบายกับรายงานนี้ด้วย การตรวจตารางไม่ครอบคลุมการเปลี่ยนสูตรอื่นทั้งหมด

ตรวจ build, ESLint สำหรับไฟล์ใหม่, ตารางเทียบกับบอท, ฟังก์ชันจริงสำหรับกรณี STA/เนินขึ้น/Wit Reroll และ browser UI บน desktop/mobile รวม URL ตรง reload back/forward ตัวเลือกสายวิ่ง เกจตัวอย่าง Block และการเลื่อนภาพขณะ hover

ขอบเขต: ตรวจจากโค้ดและเอกสารใน workspace และเรียกฟังก์ชันคำนวณที่ไม่มีผลกับฐานข้อมูล การตรวจ UI ใช้ข้อมูลบัญชีจำลองและดัก API ใน browser ไม่ได้แข่งหรือเปลี่ยนข้อมูลบนเซิร์ฟเวอร์จริง จึงยังไม่ได้ยืนยันว่าเวอร์ชันที่ deploy อยู่ตรงกับ checkout นี้

งาน UI อ้างอิงลักษณะกรอบภาพและแคปชั่นจาก [Tales Runner System](https://talesrunner.thehof.gg/#Sec-System)
