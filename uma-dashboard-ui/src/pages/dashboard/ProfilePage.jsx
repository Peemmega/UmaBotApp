import { useEffect, useRef, useState } from "react";
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
import { Badge, SectionHeader } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";

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
  error,
  isEditStatsOpen,
  setIsEditStatsOpen,
  setIsRenameOpen,
}) {
  const [equippedSkills, setEquippedSkills] = useState({});
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    fetch(`${BOT_API_BASE}/player/${userId}/skills`)
      .then((res) => res.json())
      .then((data) => setEquippedSkills(data))
      .catch(console.error);
  }, [userId]);

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

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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

    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file.");
      }

      const sourceUrl = URL.createObjectURL(file);
      const image = new Image();
      image.src = sourceUrl;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("Could not read this image."));
      });

      const maxDimension = 768;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(sourceUrl);

      const imageUrl = canvas.toDataURL("image/webp", 0.82);
      if (imageUrl.length > 1_500_000) {
        throw new Error("Image is still too large. Please choose a smaller image.");
      }

      onSaveProfile({ imageUrl });
    } catch (err) {
      alert(String(err.message || err));
    } finally {
      event.target.value = "";
    }
  };

  if (profileType !== "trainee") {
    const isTrainer = profileType === "trainer";
    const profileName = profile?.name || (isTrainer ? "Trainer" : "NPC");
    const profileImage = profile?.imageUrl || "";
    const teamIds = Array.isArray(profile?.teamUmaIds) ? profile.teamUmaIds : [];

    return (
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
              <div className="profile-info role-profile-fields">
                <label>
                  Display name
                  <input
                    value={profileName}
                    maxLength={24}
                    onChange={(event) => onSaveProfile({ name: event.target.value })}
                  />
                </label>
                <label>
                  Image URL
                  <input
                    value={profileImage}
                    type="url"
                    placeholder="https://..."
                    onChange={(event) => onSaveProfile({ imageUrl: event.target.value })}
                  />
                </label>
                {isTrainer && (
                  <label>
                    Uma Musume IDs in your team
                    <input
                      value={teamIds.join(", ")}
                      placeholder="e.g. 1001, 1002, 1003"
                      onChange={(event) =>
                        onSaveProfile({
                          teamUmaIds: event.target.value
                            .split(",")
                            .map((id) => id.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                    <small>Store character IDs only; stats, aptitude, zone and skills are not used for Trainers.</small>
                  </label>
                )}
              </div>
            </div>
          </section>
        </StaggerItem>

        {isTrainer && (
          <StaggerItem>
            <section className="sheet-card trainer-team-card">
              <div className="title-banner"><h2>My Uma Musume Team</h2></div>
              <div className="trainer-team-list">
                {teamIds.length ? teamIds.map((id) => <Badge key={id}>Uma ID: {id}</Badge>) : <p>Add character IDs above to build your team.</p>}
              </div>
            </section>
          </StaggerItem>
        )}
      </StaggerContainer>
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
    </>
  );
}
