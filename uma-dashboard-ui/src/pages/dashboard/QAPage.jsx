import { GameCard, SectionHeader } from "../../components/ui";

export default function QAPage() {
  return (
    <GameCard>
      <SectionHeader level={1} kicker="Academy guide" title="Q&A" />

      <div className="padding-content">
        <p className="page-placeholder">หน้านี้ไว้ใส่คำถามและคำตอบ</p>
      </div>
    </GameCard>
  );
}
