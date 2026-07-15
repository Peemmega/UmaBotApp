import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mainStats, aptitudeRows } from "../../data/dashboardConfig";
import StatCell from "../../components/StatCell";
import AptitudeItem from "../../components/AptitudeItem";
import ResourcePill from "../../components/ResourcePill";
import EditStatsModal from "../../components/EditStatsModal";
import ZonePanel from "../../components/ZonePanel";
import { BOT_API_BASE, uploadProfileImage } from "../../api/playerApi";
import statIcon from "../../assets/icons/statsPoint.webp";
import skillIcon from "../../assets/icons/skillPoint.webp";
import editIcon from "../../assets/icons/change_icon.webp";
import { playSound } from "../../utils/soundManager";
import { Badge, SearchInput, SectionHeader } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";
import ProfileImageCropModal from "../../components/ProfileImageCropModal";
import SkillLoadoutPanel from "../../components/SkillLoadoutPanel";

const fansIcon = `${BOT_API_BASE}/app/assets/icons/fans.png`;

export default function ProfilePage({
  username,
  userId,
  avatarUrl,
  player,
  setPlayer,
  profile,
  profileType = "trainee",
  onSaveProfile,
  onRequestRename,
  error,
  isEditStatsOpen,
  setIsEditStatsOpen,
  setIsRenameOpen,
  skillLoadoutVersion,
}) {
  const [equippedSkills, setEquippedSkills] = useState({});
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamFans, setTeamFans] = useState(0);
  const [availableTrainees, setAvailableTrainees] = useState([]);
  const [trainerProfile, setTrainerProfile] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [cropImageFile, setCropImageFile] = useState(null);
  const [cropTarget, setCropTarget] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    fetch(`${BOT_API_BASE}/player/${userId}/skills`)
      .then((res) => res.json())
      .then((data) => setEquippedSkills(data))
      .catch(console.error);
  }, [userId]);

  const loadTrainerTeam = async () => {
    const [teamRes, availableRes] = await Promise.all([
      fetch(`${BOT_API_BASE}/trainer/${userId}/team`),
      fetch(`${BOT_API_BASE}/trainer/${userId}/available-trainees`),
    ]);
    if (teamRes.ok) {
      const data = await teamRes.json();
      setTeamMembers(data.members || []);
      setTeamFans(data.fans || 0);
    }
    if (availableRes.ok) setAvailableTrainees((await availableRes.json()).trainees || []);
  };

  useEffect(() => {
    if (profileType === "trainer" && userId) loadTrainerTeam().catch(console.error);
  }, [profileType, userId]);

  useEffect(() => {
    if (profileType !== "trainee" || !userId) return;
    fetch(`${BOT_API_BASE}/trainee/${userId}/trainer`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setTrainerProfile(data?.trainer || null))
      .catch(() => setTrainerProfile(null));
  }, [profileType, userId]);

  const inviteTrainee = async (traineeUserId) => {
    const res = await fetch(`${BOT_API_BASE}/trainer/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainer_user_id: String(userId), trainee_user_id: String(traineeUserId) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Could not send invitation");
    setIsInviteOpen(false);
    setInviteSearch("");
    await loadTrainerTeam();
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const currentAvatarUrl = previewUrl || avatarUrl;

  useEffect(() => {
    if (!userId) return;
    console.info("[profile] avatar img src", {
      userId,
      preview_src: previewUrl || "",
      final_img_src: currentAvatarUrl || "",
      profile_image_url: player?.profile_image_url || "",
    });
  }, [currentAvatarUrl, player?.profile_image_url, previewUrl, userId]);

  const handleSelectImage = (event) => {
    const file = event.target.files?.[0];
    setUploadMessage("");
    setUploadError("");

    if (!file) {
      setSelectedImageFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    setCropTarget("trainee");
    setCropImageFile(file);
  };

  const handleUploadImage = async () => {
    if (!userId || !selectedImageFile) return;

    try {
      setUploadingImage(true);
      setUploadError("");
      setUploadMessage("");

      const result = await uploadProfileImage(userId, selectedImageFile);
      setPlayer((prev) => ({
        ...(prev || {}),
        profile_image_url: result.profile_image_url,
        profile_image_updated_at: result.profile_image_updated_at,
      }));
      onSaveProfile?.({
        name: player?.username || username,
        imageUrl: result.profile_image_url,
      });
      setUploadMessage("Profile image updated.");
      setSelectedImageFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setUploadError(String(err.message || err));
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePresetImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }
    setCropTarget("preset");
    setCropImageFile(file);
    event.target.value = "";
  };

  const handleCropComplete = (croppedFile) => {
    if (cropTarget === "trainee") {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedImageFile(croppedFile);
      setPreviewUrl(URL.createObjectURL(croppedFile));
    } else {
      const reader = new FileReader();
      reader.onload = () => onSaveProfile({ imageUrl: String(reader.result || "") });
      reader.readAsDataURL(croppedFile);
    }
    setCropImageFile(null);
    setCropTarget("");
  };

  const cropModal = cropImageFile ? <ProfileImageCropModal file={cropImageFile} onCancel={() => { setCropImageFile(null); setCropTarget(""); }} onConfirm={handleCropComplete} /> : null;

  if (profileType !== "trainee") {
    const isTrainer = profileType === "trainer";
    const profileName = profile?.name || (isTrainer ? "Trainer" : "NPC");
    const profileImage = profile?.imageUrl || "";
    const filteredInvitees = availableTrainees.filter((trainee) =>
      trainee.username.toLowerCase().includes(inviteSearch.trim().toLowerCase())
    );

    return (
      <>
      <StaggerContainer className={`dashboard-shell profile-stagger role-profile role-profile-${profileType}`}>
        <StaggerItem>
          <section className="profile-card">
            <div className="title-banner">
              <h2>{isTrainer ? "Trainer Profile" : "NPC Profile"}</h2>
            </div>
            <div className="profile-body role-profile-body">
              <div className="profile-avatar-wrap">
                {profileImage ? (
                  <img src={profileImage} alt={profileName} className="profile-avatar" />
                ) : (
                  <div className="profile-avatar placeholder">{isTrainer ? "🎓" : "👤"}</div>
                )}
                <div className="profile-avatar-actions">
                  <label className="profile-image-btn profile-image-upload-label">
                    Upload image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="profile-image-input"
                      onChange={handlePresetImageUpload}
                    />
                  </label>
                  {profileImage && (
                    <button
                      type="button"
                      className="profile-image-remove-btn"
                      onClick={() => onSaveProfile({ imageUrl: "" })}
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
              {isTrainer || profileType === "npc" ? (
                <div className="profile-info">
                  <div className="profile-name-row">
                    <div className="profile-name">{profileName}</div>
                    <button
                      type="button"
                      className="rename-btn"
                      onClick={() => {
                        onRequestRename?.();
                      }}
                    >
                      <img src={editIcon} alt="Rename trainer" />
                    </button>
                  </div>
                  {isTrainer && (
                    <div className="profile-resources trainer-profile-fans">
                      <ResourcePill icon={fansIcon} label="Team Fans" value={teamFans} />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </StaggerItem>

        {isTrainer && (
          <StaggerItem>
            <section className="sheet-card trainer-team-card">
              <div className="title-banner"><h2>My Uma Musume Team</h2></div>
              <div className="trainer-team-list">
                <div className="trainer-team-grid">
                  {teamMembers.length ? teamMembers.map((member) => (
                    <article className="trainer-team-member" key={member.user_id}>
                      <img src={member.image_url} alt={member.username} />
                      <h3>{member.username}</h3>
                      <Badge>{member.fans} Fans</Badge>
                    </article>
                  )) : <p className="trainer-team-empty">No team members yet.</p>}
                </div>
                <div className="trainer-team-invite-action">
                  <button className="profile-image-upload-btn" onClick={() => setIsInviteOpen(true)}>Invite to team</button>
                </div>
              </div>
            </section>
          </StaggerItem>
        )}
        {isInviteOpen && createPortal(
          <div className="team-invite-backdrop" onClick={() => setIsInviteOpen(false)}>
            <section className="team-invite-modal" onClick={(event) => event.stopPropagation()}>
              <header className="team-invite-header">
                <div>
                  <span>Team Management</span>
                  <h2>Invite an Uma Musume</h2>
                </div>
                <button className="team-invite-close" onClick={() => setIsInviteOpen(false)} aria-label="Close">×</button>
              </header>
              <div className="team-invite-toolbar">
                <SearchInput value={inviteSearch} onChange={(event) => setInviteSearch(event.target.value)} placeholder="Search Trainee name..." />
              </div>
              <div className="team-invite-grid">
                {filteredInvitees.length ? filteredInvitees.map((trainee) => (
                  <article className="team-invite-card" key={trainee.user_id}>
                    <img src={trainee.image_url} alt={trainee.username} />
                    <h3>{trainee.username}</h3>
                    <Badge>{trainee.fans} Fans</Badge>
                    <button onClick={() => inviteTrainee(trainee.user_id).catch((err) => alert(err.message))}>Invite</button>
                  </article>
                )) : <p className="team-invite-empty">No available Trainees with uploaded profiles.</p>}
              </div>
            </section>
          </div>,
          document.body
        )}
      </StaggerContainer>
      {cropModal}
      </>
    );
  }

  return (
    <>
      {error ? <div className="error-box">{error}</div> : null}

      <StaggerContainer className="dashboard-shell profile-stagger">
        {/* container-card */}
          {error ? <div className="error-box">{error}</div> : null}

          <StaggerItem>
          <section className="profile-card">
            <div className="title-banner">
              <h2>Trainee Profile</h2>
            </div>

            <div className="profile-body">
              <div className="profile-avatar-wrap">
                {currentAvatarUrl ? (
                  <img src={currentAvatarUrl} alt="profile" className="profile-avatar" />
                ) : (
                  <div className="profile-avatar placeholder">{"\u{1F464}"}</div>
                )}
                {trainerProfile?.image_url && (
                  <img
                    src={trainerProfile.image_url}
                    alt={`Trainer ${trainerProfile.username}`}
                    title={`Trainer: ${trainerProfile.username}`}
                    className="profile-trainer-avatar"
                  />
                )}
                <div className="profile-avatar-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="profile-image-input"
                    onChange={handleSelectImage}
                  />
                  <button
                    type="button"
                    className="profile-image-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    เปลี่ยนรูป
                  </button>
                  {selectedImageFile && (
                    <button
                      type="button"
                      className="profile-image-upload-btn"
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? "Uploading..." : "Upload"}
                    </button>
                  )}
                  {uploadMessage ? <div className="profile-image-success">{uploadMessage}</div> : null}
                  {uploadError ? <div className="profile-image-error">{uploadError}</div> : null}
                </div>
              </div>

              <div className="profile-info">
                <div className="profile-name-row">
                  <div className="profile-name">{player?.username || username}</div>

                  <button
                    className="rename-btn"
                    onClick={() => {
                      playSound("open");
                      setIsRenameOpen(true);
                    }}
                  >
                    <img src={editIcon} alt="edit" />
                  </button>
                </div>

                <div className="profile-id">
                  <Badge>Discord ID: {userId}</Badge>
                </div>

                <div className="profile-resources">
                  <ResourcePill
                    icon={fansIcon}
                    label="Fans"
                    value={player?.fans ?? 1}
                  />
                  <ResourcePill
                    icon={statIcon}
                    label="Stats Points"
                    value={player?.stats_point ?? 0}
                  />
                  <ResourcePill
                    icon={skillIcon}
                    label="Event Point"
                    value={player?.skill_point ?? 0}
                  />
                </div>
              </div>
            </div>
          </section>
          </StaggerItem>

          <StaggerItem>
          <section className="sheet-card main-stats-card padding_container">
            <div className="section-header-row">
              <div></div>

              <div className="main-stats-header">
                <SectionHeader
                  title="ค่า Stats พื้นฐาน"
                  kicker="Trainee Sheet"
                  className="profile-section-header"
                />

                <button
                  className={`update-stats-btn ${isEditStatsOpen ? "active" : ""}`}
                  onClick={() => {
                    if (isEditStatsOpen) {
                      playSound("close");

                    } else {
                      playSound("open");
                    }
                    setIsEditStatsOpen((prev) => !prev);
                  }}
                >
                  {isEditStatsOpen ? "ปิดอัปเดต Stats" : "อัปเดต Stats"}
                </button>
              </div>
            </div>

            <div className="stats-grid">
              {mainStats.map((item) => (
                <StatCell
                  key={item.key}
                  statKey={item.key}
                  label={item.label}
                  value={player?.[item.key]}
                />
              ))}
            </div>

            {isEditStatsOpen && (
              <EditStatsModal
                userId={userId}
                player={player}
                onClose={() => setIsEditStatsOpen(false)}
                onSaved={(updated) => {
                  setPlayer((prev) => ({
                    ...prev,
                    ...updated,
                  }));
                  setIsEditStatsOpen(false);
                }}
              />
            )}
          </section>
          </StaggerItem>

          <StaggerItem>
          <section className="sheet-card">
            <div className="title-banner">
              <h2>ค่าความถนัด</h2>
            </div>

            <div className="padding-content">
              <div className="aptitude-table">
                {aptitudeRows.map((row) => (
                  <div className="aptitude-row" key={row.title}>
                    <div className="aptitude-row-title">{row.title}</div>
                    <div className="aptitude-row-items">
                      {row.items.map((item) => (
                        <AptitudeItem
                          key={item.key}
                          label={item.label}
                          value={player?.[item.key]}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          </StaggerItem>

          <StaggerItem className="profile-mobile-skill-loadout">
            <SkillLoadoutPanel
              userId={userId}
              username={player?.username || username}
              player={player}
              refreshKey={skillLoadoutVersion}
            />
          </StaggerItem>

          <StaggerItem>
          <ZonePanel
              userId={userId}
              player={player}
              onSaved={(updatedZone) => {
                setPlayer((prev) => ({
                  ...prev,
                  zone: {
                    ...(prev?.zone || {}),
                    ...updatedZone,
                  },
                }));
              }}
            />
          </StaggerItem>
        </StaggerContainer>
      {cropModal}
    </>
  );
}
