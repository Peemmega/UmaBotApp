import React, { useEffect, useMemo, useState } from "react";

import moneyIcon from "../assets/mail/money_mail_icon.png";
import statsIcon from "../assets/mail/stats_mail_icon.png";
import skillIcon from "../assets/mail/skill_pt_mail_icon.png";
import aptitudeIcon from "../assets/mail/aptitude_mail_icon.png";
import { playSound } from "../utils/soundManager";

const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

const rewardIconMap = {
  uma_coin: moneyIcon,
  money: moneyIcon,
  stats_point: statsIcon,
  skill_point: skillIcon,
  aptitude: aptitudeIcon,
};

export default function MailboxModal({ userId, onClose, onMailChanged }) {
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [closing, setClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

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

      const res = await fetch(`${BOT_API_BASE}/mailbox/${userId}`);
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
  }, [userId]);

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
                  className={`mail-item ${mail.is_read ? "read" : "unread"}`}
                  onClick={() => {
                    if (!mail.is_read) markRead(mail.id);
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
      </div>
    </div>
  );
}