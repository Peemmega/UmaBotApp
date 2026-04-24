import React, { useEffect, useState } from "react";

import moneyIcon from "../assets/mail/money_mail_icon.png";
import statsIcon from "../assets/mail/stats_mail_icon.png";
import skillIcon from "../assets/mail/skill_pt_mail_icon.png";
import aptitudeIcon from "../assets/mail/aptitude_mail_icon.png";

const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

const rewardIconMap = {
  uma_coin: moneyIcon,
  money: moneyIcon,
  stats_point: statsIcon,
  skill_point: skillIcon,
  aptitude: aptitudeIcon,
};

export default function MailboxModal({ userId, onClose }) {
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadMailbox = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${BOT_API_BASE}/mailbox/${userId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Cannot load mailbox");
      }

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
      await fetch(`${BOT_API_BASE}/mailbox/${mailId}/read`, {
        method: "POST",
      });

      setMails((prev) =>
        prev.map((mail) =>
          mail.id === mailId ? { ...mail, is_read: true } : mail
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mailbox-backdrop" onClick={onClose}>
      <div className="mailbox-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mailbox-header">
          <h2>Mailbox</h2>
          <button className="mailbox-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mailbox-tabs">
          <button className="mailbox-tab active">List</button>
          <button className="mailbox-tab">History</button>
        </div>

        <div className="mailbox-list">
          {loading && <div className="mailbox-empty">Loading mail...</div>}

          {!loading && message && (
            <div className="mailbox-empty">{message}</div>
          )}

          {!loading && !message && mails.length === 0 && (
            <div className="mailbox-empty">ยังไม่มีข้อความ</div>
          )}

          {!loading &&
            !message &&
            mails.map((mail) => {
              const icon = rewardIconMap[mail.reward_type] || statsIcon;

              return (
                <div
                  key={mail.id}
                  className={`mail-item ${mail.is_read ? "read" : "unread"}`}
                  onClick={() => markRead(mail.id)}
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
          <button className="mailbox-secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}