import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import statsIcon from "../assets/mail/stats_mail_icon.webp";
import skillIcon from "../assets/mail/skill_pt_mail_icon.webp";
import aptitudeIcon from "../assets/mail/aptitude_mail_icon.webp";
import { playSound } from "../utils/soundManager";
import { BOT_API_BASE } from "../api/playerApi";

const fansIcon = `${BOT_API_BASE}/app/assets/icons/fans.png`;

const rewardIconMap = {
  fans: fansIcon,
  stats_point: statsIcon,
  skill_point: skillIcon,
  aptitude: aptitudeIcon,
};

export default function MailboxModal({ userId, profileType = "trainee", onClose, onMailChanged, onOpenRegistration }) {
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [pendingInvitation, setPendingInvitation] = useState(null);

  const closeModal = () => {
    playSound("close");
    setClosing(true);

    setTimeout(() => {
      onClose();
    }, 180); 
  };

  const loadMailbox = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${BOT_API_BASE}/mailbox/${userId}?profile_type=${profileType}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.detail || "Cannot load mailbox");

      setMails(data);
    } catch (err) {
      console.error(err);
      setMessage(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMailbox();
  }, [profileType, userId]);

  const respondToInvitation = async (accepted) => {
    try {
      const res = await fetch(`${BOT_API_BASE}/trainer/invitations/${pendingInvitation.invitation_id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainee_user_id: String(userId), accepted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not respond to invitation");
      setPendingInvitation(null);
      await markRead(pendingInvitation.id);
      loadMailbox();
    } catch (err) {
      setMessage(String(err.message || err));
    }
  };

  const markRead = async (mailId) => {
    try {
      playSound("click");

      await fetch(`${BOT_API_BASE}/mailbox/${mailId}/read`, {
        method: "POST",
      });

      setMails((prev) =>
        prev.map((mail) =>
          mail.id === mailId ? { ...mail, is_read: true } : mail
        )
      );
      
      onMailChanged?.();
    } catch (err) {
      console.error(err);
    }
  };

  const visibleMails = useMemo(() => {
    if (activeTab === "history") {
      return mails.filter((mail) => mail.is_read);
    }

    return mails.filter((mail) => !mail.is_read);
  }, [mails, activeTab]);

  return (
    <div
      className={`mailbox-backdrop ${closing ? "closing" : ""}`}
      onClick={closeModal}
    >
      <div
        className={`mailbox-modal ${closing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mailbox-header">
          <h2>Mailbox</h2>
        </div>

        <div className="mailbox-tabs">
          <button
            className={`mailbox-tab ${activeTab === "list" ? "active" : ""}`}
            onClick={() => {
              playSound("click");
              setActiveTab("list");
            }}
          >
            List
          </button>

          <button
            className={`mailbox-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => {
              playSound("click");
              setActiveTab("history");
            }}
          >
            History
          </button>
        </div>

        <div className="mailbox-list">
          {loading && <div className="mailbox-empty">Loading mail...</div>}

          {!loading && message && <div className="mailbox-empty">{message}</div>}

          {!loading && !message && visibleMails.length === 0 && (
            <div className="mailbox-empty">
              <div className="mailbox-empty-icon">📭</div>
              <div className="mailbox-empty-text">
                {activeTab === "list" ? "ยังไม่มีข้อความใหม่" : "ยังไม่มีประวัติข้อความ"}
              </div>
            </div>
          )}

          {!loading &&
            !message &&
            visibleMails.map((mail) => {
              const icon = rewardIconMap[mail.reward_type] || statsIcon;

              return (
                <div
                  key={mail.id}
                  className={`mail-item ${mail.is_read ? "read is-history" : "unread"}`}
                  aria-disabled={mail.is_read}
                  onClick={() => {
                    if (mail.is_read) return;
                    if (mail.action_type?.startsWith("race_registration_")) {
                      onOpenRegistration?.(mail);
                    } else if (mail.invitation_id && profileType === "trainee") {
                      setPendingInvitation(mail);
                    } else markRead(mail.id);
                  }}
                >
                  <img src={icon} alt="reward" className="mail-item-icon" />

                  <div className="mail-item-body">
                    <div className="mail-item-title-row">
                      <h3>{mail.title}</h3>
                      {!mail.is_read && <span className="unread-dot" />}
                    </div>

                    <p>{mail.message}</p>

                    <div className="mail-item-footer">
                      {mail.reward_type && (
                        <span className="mail-reward">
                          {mail.reward_type} +{mail.reward_amount}
                        </span>
                      )}
                      <span>{mail.created_at}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="mailbox-footer">
          <button className="mailbox-secondary-btn" onClick={closeModal}>
            Close
          </button>
        </div>

        {pendingInvitation && (
          <div className="mailbox-invite-dialog" role="dialog" aria-modal="true">
            <h3>Join this Trainer's team?</h3>
            <p>{pendingInvitation.message}</p>
            <button onClick={() => respondToInvitation(false)}>Decline</button>
            <button onClick={() => respondToInvitation(true)}>Join team</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function RaceRegistrationMailDialog({ mail, userId, onClose, onCompleted }) {
  const [detail, setDetail] = useState(null);
  const [availability, setAvailability] = useState("self");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isTrainerApproval = mail.action_type === "race_registration_trainer";

  useEffect(() => {
    fetch(`${BOT_API_BASE}/race-registrations/${mail.action_id}`)
      .then((response) => response.ok ? response.json() : response.json().then((data) => Promise.reject(new Error(data.detail))))
      .then(setDetail)
      .catch((reason) => setError(String(reason.message || reason)));
  }, [mail.action_id]);

  const respond = async (accepted) => {
    try {
      setBusy(true);
      setError("");
      const response = await fetch(`${BOT_API_BASE}/race-registrations/${mail.action_id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_user_id: String(userId),
          accepted,
          availability: isTrainerApproval ? null : availability,
          mail_id: mail.id,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "ไม่สามารถตอบคำขอได้");
      await onCompleted();
    } catch (reason) {
      setError(String(reason.message || reason));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const raceTime = detail?.race_time || "00:00";
  const normalizedRaceTime = raceTime.length === 5 ? `${raceTime}:00` : raceTime;
  const raceDate = detail?.race_date
    ? new Date(`${detail.race_date}T${normalizedRaceTime}+07:00`).toLocaleString("th-TH", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    })
    : "";

  return createPortal(
    <div className="registration-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="registration-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="registration-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="registration-confirm-close" aria-label="ปิดหน้าต่าง" disabled={busy} onClick={onClose}>×</button>
        <header className="registration-confirm-hero">
          <div className="registration-confirm-icon" aria-hidden="true">🏁</div>
          <div>
            <span>{isTrainerApproval ? "คำขอจาก Umamusume" : "คำขอจาก Trainer"}</span>
            <h2 id="registration-confirm-title">{isTrainerApproval ? "อนุมัติการลงทะเบียน?" : "ยืนยันการลงทะเบียน?"}</h2>
            <p>ตรวจสอบข้อมูลการแข่งขันก่อนยืนยัน</p>
          </div>
        </header>

        <div className="registration-confirm-content">
          {detail ? <>
            <section className="registration-race-summary" aria-label="ข้อมูลการแข่งขัน">
              <span className="registration-detail-label">รายการแข่งขัน</span>
              <h3>{detail.race_name}</h3>
              <div className="registration-detail-grid">
                <div><span>วันและเวลา</span><strong>{raceDate}</strong></div>
                <div><span>สนาม</span><strong>{detail.venue || "กำลังอัปเดต"}</strong></div>
              </div>
            </section>
            {isTrainerApproval ? (
              <p className="registration-confirm-note">เมื่ออนุมัติแล้ว ระบบจะส่งแบบฟอร์มยืนยันความพร้อมให้ Umamusume</p>
            ) : (
              <fieldset className="registration-availability">
                <legend>ความพร้อมในการแข่ง</legend>
                <label className={availability === "self" ? "is-selected" : ""}>
                  <input type="radio" name="availability" value="self" checked={availability === "self"} onChange={() => setAvailability("self")} />
                  <span><strong>ลงแข่งเอง</strong><small>ฉันพร้อมเข้าร่วมการแข่งขัน</small></span>
                </label>
                <label className={availability === "bot_auto" ? "is-selected" : ""}>
                  <input type="radio" name="availability" value="bot_auto" checked={availability === "bot_auto"} onChange={() => setAvailability("bot_auto")} />
                  <span><strong>ใช้ Bot Auto</strong><small>ให้บอทลงแข่งแทน</small></span>
                </label>
              </fieldset>
            )}
          </> : <p className="registration-confirm-loading">กำลังโหลดรายละเอียดการแข่งขัน…</p>}
          {error ? <p className="registration-confirm-error" role="alert">{error}</p> : null}
        </div>

        <footer className="registration-confirm-actions">
          <button type="button" className="registration-action-secondary" disabled={busy} onClick={onClose}>ปิด</button>
          <button type="button" className="registration-action-decline" disabled={busy || !detail} onClick={() => respond(false)}>ปฏิเสธ</button>
          <button type="button" className="registration-action-primary" disabled={busy || !detail} onClick={() => respond(true)}>
            {busy ? "กำลังบันทึก…" : isTrainerApproval ? "อนุมัติคำขอ" : "ยืนยันการลงทะเบียน"}
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
}
