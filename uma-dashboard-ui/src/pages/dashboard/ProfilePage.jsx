import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mainStats, aptitudeRows } from "../../data/dashboardConfig";
import StatCell from "../../components/StatCell";
import AptitudeItem from "../../components/AptitudeItem";
import ResourcePill from "../../components/ResourcePill";
import EditStatsModal from "../../components/EditStatsModal";
import ZonePanel from "../../components/ZonePanel";
import { BOT_API_BASE, uploadPresetProfileImage, uploadProfileImage } from "../../api/playerApi";
import { toAbsoluteBotUrl } from "../../utils/avatar";
import statIcon from "../../assets/icons/statsPoint.webp";
import skillIcon from "../../assets/icons/skillPoint.webp";
import editIcon from "../../assets/icons/change_icon.webp";
import discordIcon from "../../assets/icons/discord_icon.webp";
import { playSound } from "../../utils/soundManager";
import { Badge, SearchInput, SectionHeader } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";
import ProfileImageCropModal from "../../components/ProfileImageCropModal";
import SkillLoadoutPanel from "../../components/SkillLoadoutPanel";
import ProfileSkillLibrary from "../../components/ProfileSkillLibrary";
import ProfileRaceStats from "../../components/ProfileRaceStats";
import BasicProfileEditor from "../../components/BasicProfileEditor";
import "../../styles/profilePage.css";
import horseshoeIcon from "../../assets/icons/horseshoe.webp";

const fansIcon = `${BOT_API_BASE}/app/assets/icons/fans.png`;
const aptitudeIcons = {
  turf: "🌿",
  dirt: "🟤",
  sprint: "🏁",
  mile: "🛣️",
  medium: "🛣️",
  long: "🛣️",
  front: "»",
  pace: "»",
  late: "»",
  end_style: "»",
};

export default function ProfilePage({
  username,
  userId,
  viewerUserId = userId,
  avatarUrl,
  player,
  setPlayer,
  profile,
  profileType = "trainee",
  readOnly = false,
  onBack,
  onOpenTraineeProfile,
  onSaveProfile,
  onRequestRename,
  error,
  isEditStatsOpen,
  setIsEditStatsOpen,
  setIsRenameOpen,
  skillLoadoutVersion,
}) {
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamFans, setTeamFans] = useState(0);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamSort, setTeamSort] = useState("joined");
  const [availableTrainees, setAvailableTrainees] = useState([]);
  const [trainerProfile, setTrainerProfile] = useState(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [cropImageFile, setCropImageFile] = useState(null);
  const [viewedPlayer, setViewedPlayer] = useState(null);
  const [viewedPlayerStatus, setViewedPlayerStatus] = useState(readOnly ? "loading" : "ready");
  const [activeProfilePage, setActiveProfilePage] = useState("overview");
  const [activeSection, setActiveSection] = useState("profile-overview");
  const fileInputRef = useRef(null);
  const jumpToSection = (sectionId) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    setActiveSection(profileType === "trainee" || readOnly ? "profile-overview" : "profile-basic");
    setActiveProfilePage("overview");
  }, [profileType, readOnly, userId]);

  useEffect(() => {
    if ((!readOnly && profileType !== "trainee") || !userId) return undefined;
    const controller = new AbortController();

    async function refreshCurrentPlayer() {
      if (readOnly) {
        setViewedPlayerStatus("loading");
        setViewedPlayer(null);
        if (profileType !== "trainer" || !viewerUserId) {
          setViewedPlayerStatus("unavailable");
          return;
        }
        try {
          const teamResponse = await fetch(`${BOT_API_BASE}/trainer/${encodeURIComponent(viewerUserId)}/team`, { signal: controller.signal });
          if (!teamResponse.ok) throw new Error("Could not verify team access.");
          const teamData = await teamResponse.json();
          const isCurrentMember = (teamData.members || []).some((member) => String(member.user_id) === String(userId));
          if (!isCurrentMember) {
            if (!controller.signal.aborted) setViewedPlayerStatus("unavailable");
            return;
          }
          const response = await fetch(
            `${BOT_API_BASE}/player/${encodeURIComponent(userId)}?username=${encodeURIComponent(username || "Unknown")}`,
            { signal: controller.signal }
          );
          if (!response.ok) throw new Error("Could not load trainee profile.");
          const profilePlayer = await response.json();
          if (!controller.signal.aborted) {
            setViewedPlayer(profilePlayer);
            setViewedPlayerStatus("ready");
          }
        } catch (loadError) {
          if (loadError.name !== "AbortError" && !controller.signal.aborted) setViewedPlayerStatus("error");
        }
        return;
      }
      try {
        const response = await fetch(
          `${BOT_API_BASE}/player/${encodeURIComponent(userId)}?username=${encodeURIComponent(username || "Unknown")}`,
          { signal: controller.signal }
        );
        if (!response.ok) return;
        const freshPlayer = await response.json();
        if (controller.signal.aborted) return;
        setPlayer(freshPlayer);
        try {
          sessionStorage.setItem(`player:${userId}`, JSON.stringify(freshPlayer));
        } catch {
          // The profile still updates when session storage is unavailable.
        }
      } catch (refreshError) {
        if (refreshError.name !== "AbortError") console.warn("Could not refresh the profile data.", refreshError);
      }
    }

    refreshCurrentPlayer();
    return () => controller.abort();
  }, [profileType, readOnly, setPlayer, userId, username, viewerUserId]);

  useEffect(() => {
    setSelectedImageFile(null);
    setUploadMessage("");
    setUploadError("");
    setCropImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  // A staged image belongs to the profile type and account it was selected for.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileType, userId]);

  useEffect(() => {
    const closeOverlays = () => {
      setIsInviteOpen(false);
      setCropImageFile(null);
    };
    window.addEventListener("uma:close-overlays", closeOverlays);
    return () => window.removeEventListener("uma:close-overlays", closeOverlays);
  }, []);

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
    if (!readOnly && profileType === "trainer" && userId) loadTrainerTeam().catch(console.error);
  }, [profileType, readOnly, userId]);

  useEffect(() => {
    if (profileType !== "trainee" || !userId) return;
    fetch(`${BOT_API_BASE}/trainee/${userId}/trainer`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setTrainerProfile(data?.trainer || null))
      .catch(() => setTrainerProfile(null));
  }, [profileType, userId]);

  const openTeamMemberProfile = (member) => {
    playSound("open");
    onOpenTraineeProfile?.(member);
  };

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

  const visibleTeamMembers = useMemo(() => {
    const search = teamSearch.trim().toLocaleLowerCase();
    return [...teamMembers]
      .filter((member) => (member.username || "").toLocaleLowerCase().includes(search))
      .sort((a, b) => {
        if (teamSort === "name") return (a.username || "").localeCompare(b.username || "", undefined, { sensitivity: "base" });
        if (teamSort === "fans") return Number(b.fans || 0) - Number(a.fans || 0);
        return 0;
      });
  }, [teamMembers, teamSearch, teamSort]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const profilePlayer = readOnly ? viewedPlayer : player;
  const updateProfilePlayer = readOnly ? setViewedPlayer : setPlayer;
  const currentAvatarUrl = previewUrl || (readOnly ? toAbsoluteBotUrl(profilePlayer?.profile_image_url) : avatarUrl);

  useEffect(() => {
    if (!userId) return;
    console.info("[profile] avatar img src", {
      userId,
      preview_src: previewUrl || "",
      final_img_src: currentAvatarUrl || "",
      profile_image_url: profilePlayer?.profile_image_url || "",
    });
  }, [currentAvatarUrl, profilePlayer?.profile_image_url, previewUrl, userId]);

  const handleSelectImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setUploadMessage("");
    setUploadError("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    setCropImageFile(file);
  };

  const handleUploadImage = async () => {
    if (!userId || !selectedImageFile) return;

    try {
      setUploadingImage(true);
      setUploadError("");
      setUploadMessage("");

      const isPreset = profileType !== "trainee";
      const result = isPreset
        ? await uploadPresetProfileImage(userId, profileType, selectedImageFile)
        : await uploadProfileImage(userId, selectedImageFile);
      const imageUrl = isPreset ? result.image_url : result.profile_image_url;

      if (!isPreset) {
        setPlayer((prev) => ({
          ...(prev || {}),
          profile_image_url: result.profile_image_url,
          profile_image_updated_at: result.profile_image_updated_at,
        }));
      }
      onSaveProfile?.({
        ...(isPreset ? {} : { name: player?.username || username }),
        imageUrl,
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

  const handleCropComplete = (croppedFile) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImageFile(croppedFile);
    setPreviewUrl(URL.createObjectURL(croppedFile));
    setCropImageFile(null);
  };

  const cropModal = !readOnly && cropImageFile ? <ProfileImageCropModal file={cropImageFile} onCancel={() => setCropImageFile(null)} onConfirm={handleCropComplete} /> : null;

  if (readOnly && viewedPlayerStatus !== "ready") {
    const statusMessage = viewedPlayerStatus === "loading"
      ? "กำลังตรวจสอบสิทธิ์และโหลดโปรไฟล์…"
      : viewedPlayerStatus === "unavailable"
        ? "ไม่พบสมาชิกคนนี้ในทีมปัจจุบัน หรือบทบาทของบัญชีเปลี่ยนไปแล้ว"
        : "โหลดโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    return (
      <main className="dashboard-shell profile-stagger profile-redesign">
        <button type="button" className="team-member-profile-back-button" onClick={onBack}>← กลับทีมของฉัน</button>
        <section className="sheet-card team-member-page-status" role="status">{statusMessage}</section>
      </main>
    );
  }

  if (profileType !== "trainee" && !readOnly) {
    const isTrainer = profileType === "trainer";
    const profileName = profile?.name || (isTrainer ? "Trainer" : "NPC");
    const profileImage = profile?.imageUrl || "";
    const profileImageUrl = previewUrl || toAbsoluteBotUrl(profileImage);
    const filteredInvitees = availableTrainees.filter((trainee) =>
      (trainee.username || "").toLowerCase().includes(inviteSearch.trim().toLowerCase())
    );

    return (
      <>
      <StaggerContainer className={`dashboard-shell profile-stagger profile-redesign role-profile role-profile-${profileType}`}>
        <StaggerItem>
          <section className="profile-card profile-identity-card profile-hero" id="profile-overview">
            <div className="profile-hero-art" aria-hidden="true" />
            <div className="profile-body">
              <div className="profile-avatar-wrap">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt={profileName} className="profile-avatar" />
                ) : (
                  <div className="profile-avatar placeholder">{isTrainer ? "🎓" : "👤"}</div>
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
                <p className="profile-identity-kicker">{isTrainer ? "TRAINER PROFILE" : "NPC PROFILE"}</p>
                <div className="profile-name-row">
                  <div className="profile-name">{profileName}</div>
                </div>
                <button
                  type="button"
                  className="rename-btn profile-edit-info-btn"
                  onClick={() => onRequestRename?.()}
                >
                  <img src={editIcon} alt="" />
                  <span>เปลี่ยนชื่อ</span>
                </button>
                <div className="profile-id">
                  <Badge className="profile-discord-id"><img src={discordIcon} alt="" /><span>{userId}</span></Badge>
                </div>
              </div>
              {isTrainer && (
                <div className="profile-resources trainer-profile-fans">
                  <ResourcePill icon={fansIcon} label="Team Fans" value={teamFans} />
                  <ResourcePill icon={statIcon} label="Stats Points" value={player?.stats_point ?? 0} />
                  <ResourcePill icon={skillIcon} label="Event Point" value={player?.skill_point ?? 0} />
                </div>
              )}
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <nav className="profile-section-nav" aria-label="ส่วนต่าง ๆ ของโปรไฟล์">
            <button type="button" className={activeProfilePage === "overview" ? "is-active" : ""} onClick={() => setActiveProfilePage("overview")}>Overview</button>
            {isTrainer && <>
              <button type="button" className={activeProfilePage === "stats" ? "is-active" : ""} onClick={() => setActiveProfilePage("stats")}>Stats</button>
              <button type="button" className={activeProfilePage === "skills" ? "is-active" : ""} onClick={() => setActiveProfilePage("skills")}>Skills</button>
            </>}
            {isTrainer && <button type="button" className={activeSection === "profile-team" ? "is-active" : ""} onClick={() => jumpToSection("profile-team")}>ทีมของฉัน</button>}
          </nav>
        </StaggerItem>

        <StaggerItem>
          {activeProfilePage === "overview" && <div id="profile-basic" className="role-basic-profile-section">
            <BasicProfileEditor userId={userId} profileType={profileType} />
          </div>}
        </StaggerItem>

        {isTrainer && activeProfilePage === "stats" && <div className="profile-stats-page">
          <div className="profile-data-panel">
            <StaggerItem><section className="sheet-card main-stats-card padding_container">
              <div className="section-header-row"><div className="main-stats-header">
                <SectionHeader title="Core Stats" kicker="Trainer Sheet" className="profile-section-header" />
                <button type="button" className={`update-stats-btn ${isEditStatsOpen ? "active" : ""}`} aria-expanded={isEditStatsOpen} onClick={() => setIsEditStatsOpen((prev) => !prev)}>
                  <svg className="update-stats-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 11h3v6H3zm5-7h3v13H8zm5 4h3v9h-3z" fill="currentColor" /></svg>
                  {isEditStatsOpen ? "Close Stats Editor" : "Edit Stats"}
                </button>
              </div></div>
              <div className="stats-grid">{mainStats.map((item) => <StatCell key={item.key} statKey={item.key} label={item.label} value={profilePlayer?.[item.key]} />)}</div>
              {isEditStatsOpen && <EditStatsModal userId={userId} player={player} onClose={() => setIsEditStatsOpen(false)} onSaved={(updated) => {
                updateProfilePlayer((prev) => ({ ...prev, ...updated }));
                setIsEditStatsOpen(false);
              }} />}
            </section></StaggerItem>
            <StaggerItem><section className="sheet-card"><div className="title-banner"><h2>Aptitudes</h2></div><div className="padding-content"><div className="aptitude-table">
              {aptitudeRows.map((row) => <div className="aptitude-row" key={row.title}><div className="aptitude-row-title">{row.title}</div><div className="aptitude-row-items">{row.items.map((item) => <AptitudeItem key={item.key} label={item.label} value={profilePlayer?.[item.key]} icon={aptitudeIcons[item.key]} />)}</div></div>)}
            </div></div></section></StaggerItem>
          </div>
        </div>}

        {isTrainer && activeProfilePage === "skills" && <div className="profile-lower-grid">
          <StaggerItem><div className="profile-lower-panel"><SkillLoadoutPanel userId={userId} username={profilePlayer?.username || profileName} player={profilePlayer} refreshKey={skillLoadoutVersion} readOnly={false} /></div></StaggerItem>
          <StaggerItem><div className="profile-lower-panel"><ProfileSkillLibrary userId={userId} username={profilePlayer?.username || profileName} readOnly={false} /></div></StaggerItem>
        </div>}

        {isTrainer && (
          <StaggerItem>
            <section className="sheet-card trainer-team-card" id="profile-team">
              <div className="title-banner"><h2>My Uma Musume Team</h2></div>
              <div className="trainer-team-list">
                <div className="trainer-team-toolbar">
                  <SearchInput value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} placeholder="Search team members..." />
                  <label className="trainer-team-sort">
                    <span>Sort by</span>
                    <select value={teamSort} onChange={(event) => setTeamSort(event.target.value)}>
                      <option value="joined">Date joined</option>
                      <option value="name">Name</option>
                      <option value="fans">Fans</option>
                    </select>
                  </label>
                  <span className="trainer-team-count">{teamMembers.length} {teamMembers.length === 1 ? "member" : "members"}</span>
                </div>
                <div className="trainer-team-grid">
                  {visibleTeamMembers.length ? visibleTeamMembers.map((member) => (
                    <article className="trainer-team-member" key={member.user_id}>
                      <button
                        type="button"
                        className="trainer-team-member-open"
                        aria-label={`Open ${member.username}'s profile`}
                        onClick={() => openTeamMemberProfile(member)}
                      >
                        <img src={member.image_url} alt="" />
                        <h3>{member.username}</h3>
                        <Badge>{Number(member.fans || 0).toLocaleString()} Fans</Badge>
                        <span className="trainer-team-profile-link">ดูโปรไฟล์เต็ม</span>
                      </button>
                    </article>
                  )) : <p className="trainer-team-empty">{teamMembers.length ? "No members match your search." : "No team members yet."}</p>}
                </div>
                <div className="trainer-team-invite-action">
                  <button className="profile-image-upload-btn" onClick={() => setIsInviteOpen(true)}>Invite to team</button>
                </div>
              </div>
            </section>
          </StaggerItem>
        )}
        {isInviteOpen && createPortal(
          <div className={`profile-theme-${profileType} profile-theme-portal`}>
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
            </div>
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

      <StaggerContainer className="dashboard-shell profile-stagger profile-redesign">
          {readOnly && <StaggerItem><button type="button" className="team-member-profile-back-button" onClick={onBack}>← กลับทีมของฉัน</button></StaggerItem>}
          <StaggerItem>
          <section className="profile-card profile-identity-card profile-hero" id="profile-overview">
            <div className="profile-hero-art" aria-hidden="true" />
            <div className="profile-body">
              <div className="profile-avatar-wrap">
                {currentAvatarUrl ? (
                  <img src={currentAvatarUrl} alt="profile" className="profile-avatar" />
                ) : (
                  <div className="profile-avatar placeholder">{"\u{1F464}"}</div>
                )}
                {!readOnly && trainerProfile?.image_url && (
                  <img
                    src={toAbsoluteBotUrl(trainerProfile.image_url)}
                    alt={`Trainer ${trainerProfile.username}`}
                    title={`Trainer: ${trainerProfile.username}`}
                    className="profile-trainer-avatar"
                  />
                )}
                {!readOnly && <div className="profile-avatar-actions">
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
                </div>}
              </div>

              <div className="profile-info">
                <p className="profile-identity-kicker">TRAINEE PROFILE</p>
                <div className="profile-name-row">
                  <div className="profile-name">{profilePlayer?.username || username}</div>
                </div>

                {!readOnly && <button
                  type="button"
                  className="rename-btn profile-edit-info-btn"
                  onClick={() => {
                    playSound("open");
                    setIsRenameOpen(true);
                  }}
                >
                  <img src={editIcon} alt="" />
                  <span>เปลี่ยนชื่อ</span>
                </button>}

                <div className="profile-id">
                  <Badge className="profile-discord-id">
                    <img src={discordIcon} alt="" />
                    <span>{userId}</span>
                  </Badge>
                </div>
              </div>
              <div className="profile-resources">
                <ResourcePill icon={fansIcon} label="Fans" value={profilePlayer?.fans ?? 1} />
                <ResourcePill icon={statIcon} label="Stats Points" value={profilePlayer?.stats_point ?? 0} />
                <ResourcePill icon={skillIcon} label="Event Point" value={profilePlayer?.skill_point ?? 0} />
              </div>
            </div>
          </section>
          </StaggerItem>

          <StaggerItem>
            <nav className="profile-section-nav" aria-label="ส่วนต่าง ๆ ของโปรไฟล์">
              <button type="button" className={activeProfilePage === "overview" ? "is-active" : ""} aria-current={activeProfilePage === "overview" ? "page" : undefined} onClick={() => setActiveProfilePage("overview")}>ข้อมูลพื้นฐาน</button>
              <button type="button" className={activeProfilePage === "stats" ? "is-active" : ""} aria-current={activeProfilePage === "stats" ? "page" : undefined} onClick={() => setActiveProfilePage("stats")}>ค่าสถานะ</button>
              <button type="button" className={activeProfilePage === "skills" ? "is-active" : ""} aria-current={activeProfilePage === "skills" ? "page" : undefined} onClick={() => setActiveProfilePage("skills")}>สกิล</button>
              <button type="button" className={activeProfilePage === "history" ? "is-active" : ""} aria-current={activeProfilePage === "history" ? "page" : undefined} onClick={() => setActiveProfilePage("history")}>สถิติ</button>
            </nav>
          </StaggerItem>

          {activeProfilePage === "overview" ? <BasicProfileEditor userId={userId} readOnly={readOnly} /> : null}

          {activeProfilePage === "stats" && <div className="profile-stats-page">
          <div className="profile-data-panel">
          <StaggerItem>
          <section className="sheet-card main-stats-card padding_container">
            <div className="section-header-row">
              <div className="main-stats-header">
                <SectionHeader
                  title="ค่าสถานะพื้นฐาน"
                  kicker="Trainee Sheet"
                  className="profile-section-header"
                />

                {!readOnly && <button
                  type="button"
                  className={`update-stats-btn ${isEditStatsOpen ? "active" : ""}`}
                  aria-expanded={isEditStatsOpen}
                  onClick={() => {
                    if (isEditStatsOpen) {
                      playSound("close");

                    } else {
                      playSound("open");
                    }
                    setIsEditStatsOpen((prev) => !prev);
                  }}
                >
                  <svg className="update-stats-icon" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M3 11h3v6H3zm5-7h3v13H8zm5 4h3v9h-3z" fill="currentColor" />
                  </svg>
                  {isEditStatsOpen ? "ปิดปรับแต่ง Stats" : "ปรับแต่ง Stats"}
                </button>}
              </div>
            </div>

            <div className="stats-grid">
              {mainStats.map((item) => (
                <StatCell
                  key={item.key}
                  statKey={item.key}
                  label={item.label}
                  value={profilePlayer?.[item.key]}
                />
              ))}
            </div>

            {!readOnly && isEditStatsOpen && (
              <EditStatsModal
                userId={userId}
                player={player}
                onClose={() => setIsEditStatsOpen(false)}
                onSaved={(updated) => {
                  updateProfilePlayer((prev) => ({
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
              <h2><img src={horseshoeIcon} alt="" className="aptitude-title-icon" />ค่าความถนัด</h2>
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
                          value={profilePlayer?.[item.key]}
                          icon={aptitudeIcons[item.key]}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          </StaggerItem>

          </div>

          <div className="profile-lower-grid">
          <StaggerItem>
            <div id="profile-skills" className="profile-lower-panel">
            <SkillLoadoutPanel
              userId={userId}
              username={profilePlayer?.username || username}
              player={profilePlayer}
              refreshKey={skillLoadoutVersion}
              readOnly={readOnly}
            />
            </div>
          </StaggerItem>

          <StaggerItem>
            <div id="profile-zone" className="profile-lower-panel">
          <ZonePanel
              userId={userId}
              player={profilePlayer}
              readOnly={readOnly}
              onSaved={(updatedZone) => {
                updateProfilePlayer((prev) => ({
                  ...prev,
                  zone: {
                    ...(prev?.zone || {}),
                    ...updatedZone,
                  },
                }));
              }}
            />
            </div>
          </StaggerItem>
          </div>
          </div>}

          {activeProfilePage === "skills" && (
            <ProfileSkillLibrary userId={userId} username={profilePlayer?.username || username} readOnly={readOnly} />
          )}

          {activeProfilePage === "history" && <ProfileRaceStats userId={userId} />}
        </StaggerContainer>
      {cropModal}
    </>
  );
}
