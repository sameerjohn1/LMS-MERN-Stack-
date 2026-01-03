import React, { useEffect, useMemo, useState } from "react";
import { courseDetailStyles, coursePageStyles } from "../assets/dummyStyles";
import coursesData from "../assets/dummyData";
import {
  ArrowLeft,
  BookOpen,
  Target,
  X,
  Clock,
  User,
  CheckCircle,
  Circle,
  Play,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Award,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const fmtMinutes = (mins) => {
  const h = Math.floor((mins || 0) / 60);
  const m = (mins || 0) % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const Toast = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`${courseDetailStyles.toast} ${
        type === "error"
          ? courseDetailStyles.toastError
          : courseDetailStyles.toastInfo
      }`}
    >
      <div className={courseDetailStyles.toastContent}>
        <span>{message}</span>
        <button onClick={onClose} className={courseDetailStyles.toastClose}>
          <X className={courseDetailStyles.toastCloseIcon} />
        </button>
      </div>
    </div>
  );
};

const toEmbedUrl = (url) => {
  if (!url) return "";
  try {
    const trimmed = String(url).trim();
    if (/\/embed\//.test(trimmed)) return trimmed;

    const watchMatch = trimmed.match(/[?&]v=([^&#]+)/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    const shortMatch = trimmed.match(/youtu\.be\/([^?&#/]+)/);
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }

    if (/drive\.google\.com/.test(trimmed)) {
      const fileMatch = trimmed.match(/\/file\/d\/([^/]+)(?:\/|$)/);
      if (fileMatch && fileMatch[1]) {
        return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
      }

      const idMatch = trimmed.match(/[?&]id=([^&#]+)/);
      if (idMatch && idMatch[1]) {
        return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
      }

      const ucMatch = trimmed.match(/[?&]export=download.*[?&]id=([^&#]+)/);
      if (ucMatch && ucMatch[1]) {
        return `https://drive.google.com/file/d/${ucMatch[1]}/preview`;
      }

      return trimmed;
    }
    const lastSeg = trimmed.split("/").filter(Boolean).pop();
    if (lastSeg && lastSeg.length === 11 && /^[a-zA-Z0-9_-]+$/.test(lastSeg)) {
      return `https://www.youtube.com/embed/${lastSeg}`;
    }

    return trimmed;
  } catch (e) {
    return url;
  }
};

const appendAutoplay = (embedUrl, autoplay = true) => {
  if (!embedUrl) return "";
  if (!autoplay) return embedUrl;
  return embedUrl.includes("?")
    ? `${embedUrl}&autoplay=1`
    : `${embedUrl}?autoplay=1`;
};

// helper: detect direct video file URLs (.mp4/.webm/.ogg)
const isDirectVideoFile = (url) => {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
};

const CourseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = parseInt(id, 10);

  const [isLoggedIn] = useState(true);
  // Initialize enrollment based on whether course is free
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const [toast, setToast] = useState(null);
  const [expandedLectures, setExpandedLectures] = useState(new Set());
  const [completedChapters, setCompletedChapters] = useState(new Set());
  const [isTeacherAnimating, setIsTeacherAnimating] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // find course from dummy data
  const course = coursesData.find((c) => c.id === courseId);

  // Check if course is free
  const isCourseFree = course?.isFree || !course?.price;

  // initialize enrollment state based on course type
  useEffect(() => {
    if (isCourseFree) {
      setIsEnrolled(true);
    } else {
      setIsEnrolled(false);
    }
  }, [isCourseFree]);

  useEffect(() => {
    setIsTeacherAnimating(true);
    const timer = setTimeout(() => setIsTeacherAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [course]);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // selected content is null by default — user must click to select
  const [selectedContent, setSelectedContent] = useState({
    type: null, // 'lecture' or 'chapter'
    lectureId: null,
    chapterId: null,
  });

  const selectedLecture = useMemo(() => {
    if (!selectedContent.lectureId) return null;
    return (
      (course?.lectures || []).find(
        (l) => l.id === selectedContent.lectureId
      ) || null
    );
  }, [course, selectedContent.lectureId]);

  const selectedChapter = useMemo(() => {
    if (!selectedContent.chapterId || !selectedLecture) return null;
    return (
      (selectedLecture.chapters || []).find(
        (ch) => ch.id === selectedContent.chapterId
      ) || null
    );
  }, [selectedLecture, selectedContent.chapterId]);

  const currentVideoContent = useMemo(() => {
    if (selectedContent.type === "chapter" && selectedChapter) {
      return selectedChapter;
    }
    if (selectedContent.type === "lecture" && selectedLecture) {
      return selectedLecture;
    }
    return null;
  }, [selectedContent, selectedLecture, selectedChapter]);

  const totalMinutes = useMemo(() => {
    return (course?.lectures || []).reduce(
      (sum, l) => sum + (l.durationMin || 0),
      0
    );
  }, [course]);

  const priceObj = course?.price;
  const hasPriceObj = !!(
    priceObj &&
    (priceObj.sale != null || priceObj.original != null)
  );
  const salePrice =
    hasPriceObj && priceObj.sale != null ? Number(priceObj.sale) : null;
  const originalPrice =
    hasPriceObj && priceObj.original != null ? Number(priceObj.original) : null;
  const formatCurrency = (n) => {
    if (n == null || Number.isNaN(n)) return "";
    return `₹${n}`;
  };
  const priceLabel =
    salePrice != null
      ? formatCurrency(salePrice)
      : originalPrice != null
      ? formatCurrency(originalPrice)
      : "Free";
  const hasDiscount =
    originalPrice != null && salePrice != null && originalPrice > salePrice;

  const onLectureHeaderClick = (lectureId) => {
    if (!isLoggedIn) {
      setToast({
        message: "Please login to access course content",
        type: "error",
      });
      return;
    }
    if (!isCourseFree && !isEnrolled) {
      setToast({
        message: "Please enroll in the course to access content",
        type: "error",
      });
      return;
    }
    setExpandedLectures((prev) => {
      const next = new Set(prev);
      if (next.has(lectureId)) next.delete(lectureId);
      else next.add(lectureId);
      return next;
    });
  }; //it will check for user is loggedin or not
  // then it will check for is the course is free or not
  // then it will show the details of the lectures

  // clicking a chapter selects it (plays) and ensures its lecture is expanded
  const handleContentSelect = (lectureId, chapterId = null) => {
    if (!isLoggedIn) {
      setToast({
        message: "Please login to access course content",
        type: "error",
      });
      return;
    }

    // For free courses OR enrolled paid courses, allow access
    if (isCourseFree || isEnrolled) {
      setSelectedContent({
        type: chapterId ? "chapter" : "lecture",
        lectureId,
        chapterId,
      });

      setExpandedLectures((prev) => {
        const next = new Set(prev);
        next.add(lectureId);
        return next;
      });
      return;
    }

    // For paid courses when not enrolled, show enroll toast
    if (!isCourseFree && !isEnrolled) {
      setToast({
        message: "Please enroll in the course to access this content",
        type: "error",
      });
      return;
    }
  };

  //this function will toggle the chapter completion status
  const toggleChapterCompletion = (chapterId, e) => {
    if (e) e.stopPropagation();

    if (!isLoggedIn || !isEnrolled) {
      setToast({
        message: "Please enroll and login to track progress",
        type: "error",
      });
      return;
    }

    setCompletedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      setToast({
        message: "Please login to enroll in the course",
        type: "error",
      });
      return;
    }

    setIsEnrolling(true);
    // Simulate enrollment process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsEnrolled(true);
    setIsEnrolling(false);
    setToast({
      message:
        " Successfully enrolled in the course! You can now access all content.",
      type: "info",
    });
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  // if no course found
  if (!course) {
    return (
      <div className={courseDetailStyles.notFoundContainer}>
        <div className={courseDetailStyles.notFoundContent}>
          <h2 className={courseDetailStyles.notFoundTitle}>Course not found</h2>{" "}
          <p className={courseDetailStyles.notFoundText}>
            Go back to courses list
          </p>
          <button
            onClick={() => navigate("/courses")}
            className={courseDetailStyles.notFoundButton}
          >
            Back to courses
          </button>
        </div>
      </div>
    );
  }

  // Compute an embeddable URL for the currently selected content (if any)
  const currentRawUrl = currentVideoContent?.videoUrl || null;
  const currentEmbedUrl = currentRawUrl ? toEmbedUrl(currentRawUrl) : null;
  const currentIsDirectVideo = isDirectVideoFile(currentEmbedUrl);

  return (
    <div className={courseDetailStyles.container}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div
        className={`${courseDetailStyles.mainContainer} ${
          isPageLoaded
            ? courseDetailStyles.containerVisible
            : courseDetailStyles.containerHidden
        }`}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/courses")}
            className={courseDetailStyles.backButton}
          >
            <ArrowLeft className={courseDetailStyles.backIcon} />
            <span className={courseDetailStyles.backText}>Back to Home</span>
          </button>
        </div>

        <div className={courseDetailStyles.header}>
          <div className={courseDetailStyles.badge}>
            <BookOpen className={courseDetailStyles.badgeIcon} />
            <span className={courseDetailStyles.badgeText}>
              {isCourseFree ? "Free Course" : "Premium Course"}
            </span>
          </div>

          <h1 className={courseDetailStyles.title}>{course.name}</h1>

          {course.overview && (
            <div className={courseDetailStyles.overviewContainer}>
              <div className={courseDetailStyles.overview}>
                <div className={courseDetailStyles.overviewHeader}>
                  <Target className={courseDetailStyles.overviewIcon} />
                  <h3 className={courseDetailStyles.overviewTitle}>
                    Course Overview
                  </h3>
                </div>
                <p className={courseDetailStyles.overviewText}>
                  {course.overview}
                </p>
              </div>
            </div>
          )}

          <div
            className={`${courseDetailStyles.statsContainer} animation-delay=300`}
          >
            <div className={courseDetailStyles.statItem}>
              <Clock className={coursePageStyles.statIcon} />
              <span className={coursePageStyles.statText}>
                {fmtMinutes(totalMinutes)}
              </span>
            </div>

            <div className={courseDetailStyles.statItem}>
              <BookOpen className={coursePageStyles.statIcon} />
              <span className={coursePageStyles.statText}>
                {(course.lectures || []).length} lectures
              </span>
            </div>

            <div
              className={`${courseDetailStyles.teacherStat} ${
                isTeacherAnimating ? courseDetailStyles.teacherAnimating : ""
              }`}
            >
              <User className={courseDetailStyles.statIcon} />
              <span className={courseDetailStyles.statText}>
                {course.teacher}
              </span>
            </div>
          </div>
        </div>

        {/* main */}

        {/* Main Content Grid */}
        <div className={courseDetailStyles.mainGrid}>
          {/* Enhanced Video Player */}
          <div className={courseDetailStyles.videoSection}>
            <div className={courseDetailStyles.videoContainer}>
              {/* if direct video file -> use HTML5 video, else iframe */}
              {currentEmbedUrl ? (
                currentIsDirectVideo ? (
                  <video
                    controls
                    src={currentEmbedUrl}
                    className={courseDetailStyles.video}
                  />
                ) : (
                  <iframe
                    title={
                      currentVideoContent.title ||
                      currentVideoContent.name ||
                      "video-player"
                    }
                    src={appendAutoplay(
                      currentEmbedUrl,
                      isLoggedIn && (isEnrolled || isCourseFree)
                    )}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={courseDetailStyles.iframe}
                  />
                )
              ) : (
                <div className={courseDetailStyles.videoPlaceholder}>
                  <div className={courseDetailStyles.videoPlaceholderBg}>
                    <div
                      className={courseDetailStyles.videoPlaceholderOrb1}
                    ></div>
                    <div
                      className={courseDetailStyles.videoPlaceholderOrb2}
                    ></div>
                  </div>
                  <div className={courseDetailStyles.videoPlaceholderContent}>
                    <div className={courseDetailStyles.videoPlaceholderIcon}>
                      <Play
                        className={courseDetailStyles.videoPlaceholderPlayIcon}
                      />
                    </div>
                    <p className={courseDetailStyles.videoPlaceholderText}>
                      Select a lecture or chapter to play video
                    </p>
                    {(!isLoggedIn || (!isEnrolled && !isCourseFree)) && (
                      <p className={courseDetailStyles.videoPlaceholderSubtext}>
                        {!isLoggedIn ? "Login required" : "Enrollment required"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className={courseDetailStyles.videoInfo}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={courseDetailStyles.videoTitle}>
                      {currentVideoContent?.title ||
                        currentVideoContent?.name ||
                        "Select content to play"}
                    </h3>
                    <p className={courseDetailStyles.videoDescription}>
                      {selectedContent.type === "chapter"
                        ? `Part of: ${selectedLecture?.title}`
                        : currentVideoContent?.description}
                    </p>
                    {currentVideoContent?.durationMin && (
                      <div className={courseDetailStyles.videoMeta}>
                        <div className={courseDetailStyles.durationBadge}>
                          <Clock className={courseDetailStyles.durationIcon} />
                          <span>
                            {fmtMinutes(currentVideoContent.durationMin)}
                          </span>
                        </div>
                        {selectedContent.type === "chapter" && (
                          <span className={courseDetailStyles.chapterBadge}>
                            Chapter
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Completion Button */}
                {isLoggedIn &&
                  (isEnrolled || isCourseFree) &&
                  selectedContent.chapterId && (
                    <div className={courseDetailStyles.completionSection}>
                      <button
                        onClick={() =>
                          toggleChapterCompletion(selectedContent.chapterId)
                        }
                        className={`${courseDetailStyles.completionButton} ${
                          completedChapters.has(selectedContent.chapterId)
                            ? courseDetailStyles.completionButtonCompleted
                            : courseDetailStyles.completionButtonIncomplete
                        }`}
                      >
                        {completedChapters.has(selectedContent.chapterId) ? (
                          <>
                            <CheckCircle
                              className={courseDetailStyles.completionIcon}
                            />
                            Chapter Completed
                          </>
                        ) : (
                          <>
                            <Circle
                              className={courseDetailStyles.completionIcon}
                            />
                            Mark as Complete
                          </>
                        )}
                      </button>
                      <p className={courseDetailStyles.completionText}>
                        {completedChapters.has(selectedContent.chapterId)
                          ? "Great job! You've completed this chapter."
                          : "Click to mark this chapter as completed."}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Enhanced Lectures & Sidebar */}
          <aside className={courseDetailStyles.sidebar}>
            {/* Enhanced Course Content */}
            <div className={courseDetailStyles.contentCard}>
              <div className={courseDetailStyles.contentHeader}>
                <h4 className={courseDetailStyles.contentTitle}>
                  Course Content
                </h4>
                {isCourseFree && (
                  <div className={courseDetailStyles.freeBadge}>
                    <Sparkles className={courseDetailStyles.freeBadgeIcon} />
                    Free Access
                  </div>
                )}
              </div>

              <div className={courseDetailStyles.contentList}>
                {(course.lectures || []).map((lecture, index) => (
                  <div
                    key={lecture.id}
                    className={courseDetailStyles.lectureItem}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`${courseDetailStyles.lectureHeader} ${
                        expandedLectures.has(lecture.id)
                          ? courseDetailStyles.lectureHeaderExpanded
                          : courseDetailStyles.lectureHeaderCollapsed
                      }`}
                      onClick={() => onLectureHeaderClick(lecture.id)}
                    >
                      <div className={courseDetailStyles.lectureHeaderContent}>
                        <div className={courseDetailStyles.lectureLeftSection}>
                          <div
                            className={`${courseDetailStyles.lectureChevron} ${
                              expandedLectures.has(lecture.id)
                                ? courseDetailStyles.lectureChevronExpanded
                                : courseDetailStyles.lectureChevronCollapsed
                            }`}
                          >
                            <ChevronDown className="w-5 h-5" />
                          </div>
                          <div className={courseDetailStyles.lectureInfo}>
                            <div className={courseDetailStyles.lectureTitle}>
                              {lecture.title}
                            </div>
                            <div className={courseDetailStyles.lectureMeta}>
                              <div
                                className={courseDetailStyles.lectureDuration}
                              >
                                <Clock className="w-4 h-4" />
                                {fmtMinutes(lecture.durationMin)}
                              </div>
                              <span
                                className={
                                  courseDetailStyles.lectureChapterCount
                                }
                              >
                                {lecture.chapters?.length || 0} chapters
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {expandedLectures.has(lecture.id) && (
                      <div className={courseDetailStyles.chapterList}>
                        {(lecture.chapters || []).map((chapter) => {
                          const isCompleted = completedChapters.has(chapter.id);
                          const isSelected =
                            selectedContent.chapterId === chapter.id &&
                            selectedContent.lectureId === lecture.id;

                          return (
                            <div
                              key={chapter.id}
                              className={`${courseDetailStyles.chapterItem} ${
                                isSelected
                                  ? courseDetailStyles.chapterSelected
                                  : courseDetailStyles.chapterNotSelected
                              } ${
                                !isCourseFree && !isEnrolled
                                  ? courseDetailStyles.chapterDisabled
                                  : ""
                              }`}
                              onClick={() =>
                                handleContentSelect(lecture.id, chapter.id)
                              }
                            >
                              <div
                                className={courseDetailStyles.chapterContent}
                              >
                                <div
                                  className={
                                    courseDetailStyles.chapterLeftSection
                                  }
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isCourseFree || isEnrolled) {
                                        toggleChapterCompletion(chapter.id, e);
                                      }
                                    }}
                                    className={`${
                                      courseDetailStyles.completionToggle
                                    } ${
                                      isCompleted
                                        ? courseDetailStyles.completionToggleCompleted
                                        : courseDetailStyles.completionToggleIncomplete
                                    }`}
                                    disabled={!isCourseFree && !isEnrolled}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle
                                        className={
                                          courseDetailStyles.completionIconSmall
                                        }
                                      />
                                    ) : (
                                      <Circle
                                        className={
                                          courseDetailStyles.completionIconSmall
                                        }
                                      />
                                    )}
                                  </button>
                                  <div
                                    className={courseDetailStyles.chapterText}
                                  >
                                    <div
                                      className={`${
                                        courseDetailStyles.chapterName
                                      } ${
                                        isSelected
                                          ? courseDetailStyles.chapterNameSelected
                                          : courseDetailStyles.chapterNameNotSelected
                                      }`}
                                    >
                                      {chapter.name}
                                    </div>
                                    <div
                                      className={
                                        courseDetailStyles.chapterTopic
                                      }
                                    >
                                      {chapter.topic}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={
                                      courseDetailStyles.chapterDuration
                                    }
                                  >
                                    {fmtMinutes(chapter.durationMin)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Pricing Card */}
            <div
              className={`${courseDetailStyles.pricingCard} animation-delay-200`}
            >
              <div className={courseDetailStyles.pricingHeader}>
                <h5 className={courseDetailStyles.pricingTitle}>Pricing</h5>
              </div>

              <div className={courseDetailStyles.pricingAmount}>
                <div className={courseDetailStyles.price}>
                  {isCourseFree
                    ? "Free"
                    : salePrice != null
                    ? formatCurrency(salePrice)
                    : originalPrice != null
                    ? formatCurrency(originalPrice)
                    : "Free"}
                </div>

                {!isCourseFree && hasDiscount && (
                  <div className={courseDetailStyles.originalPrice}>
                    {formatCurrency(originalPrice)}
                  </div>
                )}

                {!isCourseFree && hasDiscount && (
                  <div className={courseDetailStyles.discountBadge}>
                    {Math.round(
                      ((originalPrice - salePrice) / originalPrice) * 100
                    )}
                    % off
                  </div>
                )}
              </div>

              <p className={courseDetailStyles.pricingDescription}>
                {isCourseFree
                  ? "Free access · Learn anytime"
                  : "One-time payment · Lifetime access "}
              </p>

              <div className="mt-6">
                {isCourseFree ? (
                  <button
                    disabled
                    className={`${courseDetailStyles.enrollButton} ${courseDetailStyles.freeEnrolledButton}`}
                  >
                    <CheckCircle className={courseDetailStyles.enrollIcon} />
                    Free Course - Access Granted
                  </button>
                ) : !isEnrolled ? (
                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className={`${courseDetailStyles.enrollButton} ${courseDetailStyles.enrollPaidButton}`}
                  >
                    {isEnrolling ? (
                      <>
                        <div className={courseDetailStyles.enrollSpinner}></div>
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Play className={courseDetailStyles.enrollIcon} />
                        Enroll Now
                        <span>
                          <ArrowRight
                            className={courseDetailStyles.enrollArrow}
                          />
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className={`${courseDetailStyles.enrollButton} ${courseDetailStyles.enrolledButton}`}
                  >
                    <CheckCircle className={courseDetailStyles.enrollIcon} />
                    Enrolled
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Progress Summary */}
            <div
              className={`${courseDetailStyles.progressCard} animation-delay-400`}
            >
              <div className={courseDetailStyles.progressHeader}>
                <Award className={courseDetailStyles.progressIcon} />
                <h5 className={courseDetailStyles.progressTitle}>
                  Your Progress
                </h5>
              </div>
              <div className={courseDetailStyles.progressContent}>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Course Completion</span>
                    <span className="font-semibold text-indigo-600">
                      {Math.round(
                        (completedChapters.size /
                          (course.lectures?.flatMap((l) => l.chapters || [])
                            .length || 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className={courseDetailStyles.progressBar}>
                    <div
                      className={courseDetailStyles.progressFill}
                      style={{
                        width: `${
                          (completedChapters.size /
                            (course.lectures?.flatMap((l) => l.chapters || [])
                              .length || 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className={courseDetailStyles.progressStats}>
                  <div className={courseDetailStyles.progressStat}>
                    <div className={courseDetailStyles.progressStatValue}>
                      {fmtMinutes(totalMinutes)}
                    </div>
                    <div className={courseDetailStyles.progressStatLabel}>
                      Total Duration
                    </div>
                  </div>
                  <div className={courseDetailStyles.progressStat}>
                    <div className={courseDetailStyles.progressStatValue}>
                      {completedChapters.size}
                    </div>
                    <div className={courseDetailStyles.progressStatLabel}>
                      Completed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <style jsx>{courseDetailStyles.animations}</style>
    </div>
  );
};

export default CourseDetailsPage;
