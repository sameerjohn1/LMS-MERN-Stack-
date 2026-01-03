import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  Clock,
  BookOpen,
  ChevronDown,
  CheckCircle,
  Circle,
  X,
  ArrowLeft,
  User,
  Star,
  Award,
  Target,
  ArrowRight,
  Sparkles,
  Tag,
} from "lucide-react";
import coursesData from "../assets/dummyHdata";
import {
  courseDetailStylesH,
  toastStyles,
  animationDelaysH,
  courseDetailCustomStyles,
} from "../assets/dummyStyles";

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
      className={`${toastStyles.toast} ${
        type === "error" ? toastStyles.toastError : toastStyles.toastInfo
      }`}
    >
      <div className={toastStyles.toastContent}>
        <span>{message}</span>
        <button onClick={onClose} className={toastStyles.toastClose}>
          <X className={toastStyles.toastCloseIcon} />
        </button>
      </div>
    </div>
  );
};

/* ----------------- helpers for video URLs ----------------- */
const toEmbedUrl = (url) => {
  if (!url) return "";
  try {
    const trimmed = String(url).trim();

    // already an embed url
    if (/\/embed\//.test(trimmed)) return trimmed;

    // youtube watch?v=VIDEOID
    const watchMatch = trimmed.match(/[?&]v=([^&#]+)/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    // youtu.be/VIDEOID
    const shortMatch = trimmed.match(/youtu\.be\/([^?&#/]+)/);
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }

    // If the last path segment looks like a 11-char youtube id, use it
    const lastSeg = trimmed.split("/").filter(Boolean).pop();
    if (lastSeg && lastSeg.length === 11) {
      return `https://www.youtube.com/embed/${lastSeg}`;
    }

    // Not a youtube link we recognise — return original (may be already embeddable from another provider)
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
/* ---------------------------------------------------------- */

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = parseInt(id, 10);

  // find course from dummy data early so we can base initial enrollment on it
  const course = coursesData.find((c) => c.id === courseId);

  // whether course is free: explicit flag or missing price object => free
  const courseIsFree = !!course?.isFree || !course?.price;

  // Replace these with actual authentication and enrollment state from your app
  const [isLoggedIn] = useState(true); // Set to true for testing logged in flow

  // initialize enrollment based on course: free -> enrolled by default, paid -> not enrolled by default
  const [isEnrolled, setIsEnrolled] = useState(() => !!courseIsFree);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const [toast, setToast] = useState(null);
  const [expandedLectures, setExpandedLectures] = useState(new Set()); // no auto-expand
  const [completedChapters, setCompletedChapters] = useState(new Set());
  const [isTeacherAnimating, setIsTeacherAnimating] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // keep enrollment in sync if user navigates to another course without remount
  useEffect(() => {
    if (courseIsFree) {
      setIsEnrolled(true);
    }
    // if it's paid we don't automatically unenroll the user here (preserve previous value)
  }, [courseIsFree]);

  // only animate teacher name on mount — do NOT auto-expand or auto-select lectures
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
    type: "lecture", // 'lecture' or 'chapter'
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

  // --- Pricing: handle course.price as object { original, sale } ---
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

  // --- Handlers --- //
  const toggleLecture = (lectureId) => {
    setExpandedLectures((prev) => {
      const next = new Set(prev);
      if (next.has(lectureId)) {
        next.delete(lectureId);
      } else {
        next.add(lectureId);
      }
      return next;
    });
  };

  const handleContentSelect = (lectureId, chapterId = null) => {
    // If user is logged in AND enrolled (or the course is free), allow direct access
    if (isLoggedIn && (isEnrolled || courseIsFree)) {
      setSelectedContent({
        type: chapterId ? "chapter" : "lecture",
        lectureId,
        chapterId,
      });

      // Expand lecture when content is selected (ensures chapter click opens the lecture)
      setExpandedLectures((prev) =>
        prev.has(lectureId) ? new Set(prev) : new Set([...prev, lectureId])
      );
      return;
    }

    // If not logged in
    if (!isLoggedIn) {
      setToast({
        message: "Please login to access course content",
        type: "error",
      });
      return;
    }

    // If logged in but not enrolled (and course is paid)
    if (!isEnrolled && !courseIsFree) {
      setToast({
        message: "Please enroll in the course to access content",
        type: "error",
      });
      return;
    }
  };

  // ---------- REPLACED handler: prevents expanding paid-course lectures for not-enrolled users ----------
  const onLectureHeaderClick = (lectureId) => {
    const isOpen = expandedLectures.has(lectureId);

    if (isOpen) {
      // collapse
      setExpandedLectures((prev) => {
        const next = new Set(prev);
        next.delete(lectureId);
        return next;
      });

      // if the lecture we just collapsed was selected, clear selection
      if (selectedContent.lectureId === lectureId) {
        setSelectedContent({
          type: "lecture",
          lectureId: null,
          chapterId: null,
        });
      }
      return;
    }

    // Trying to expand — block expansion for paid courses if not enrolled
    if (!isEnrolled && !courseIsFree) {
      // show the same toast message you already use elsewhere
      setToast({
        message: "Please enroll in the course to view chapters",
        type: "error",
      });
      return;
    }

    // expand + select the lecture (preserves auth/enroll checks inside handleContentSelect)
    setExpandedLectures((prev) => new Set([...prev, lectureId]));
    handleContentSelect(lectureId, null);
  };
  // -----------------------------------------------------------------------------------------------

  const toggleChapterCompletion = (chapterId, e) => {
    if (e) e.stopPropagation();

    if (!isLoggedIn || (!isEnrolled && !courseIsFree)) {
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

  if (!course) {
    return (
      <div className={courseDetailStylesH.notFoundContainer}>
        {/* Background Pattern */}
        <div className={courseDetailStylesH.notFoundPattern}>
          <div
            className={`${courseDetailStylesH.notFoundBlob} top-10 left-10 bg-purple-300`}
          ></div>
          <div
            className={`${courseDetailStylesH.notFoundBlob} top-10 right-10 bg-yellow-300 ${animationDelaysH.delay2000}`}
          ></div>
          <div
            className={`${courseDetailStylesH.notFoundBlob} bottom-10 left-20 bg-pink-300 ${animationDelaysH.delay4000}`}
          ></div>
        </div>

        <div className={courseDetailStylesH.notFoundContent}>
          <h2 className={courseDetailStylesH.notFoundTitle}>
            Course not found
          </h2>
          <p className={courseDetailStylesH.notFoundText}>
            Go back to courses list
          </p>
          <button
            onClick={() => navigate("/courses")}
            className={courseDetailStylesH.notFoundButton}
          >
            Back to courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={courseDetailStylesH.pageContainer}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div
        className={`${courseDetailStylesH.mainContainer} ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToHome}
            className={courseDetailStylesH.backButton}
          >
            <ArrowLeft className={courseDetailStylesH.backButtonIcon} />
            <span className={courseDetailStylesH.backButtonText}>
              Back to Home
            </span>
          </button>
        </div>

        {/* Enhanced Course Header */}
        <div className={courseDetailStylesH.headerContainer}>
          {/* Course Badge */}
          <div className={courseDetailStylesH.courseBadge}>
            <BookOpen className={courseDetailStylesH.badgeIcon} />
            <span className={courseDetailStylesH.badgeText}>
              {courseIsFree ? "Free Course" : "Premium Course"}
            </span>
          </div>

          {/* Course Title (responsive: smaller on small screens, identical at md and up) */}
          <h1 className={courseDetailStylesH.courseTitle}>{course.name}</h1>

          {/* Enhanced Overview Section */}
          {course.overview && (
            <div className={courseDetailStylesH.overviewContainer}>
              <div className={courseDetailStylesH.overviewCard}>
                <div className={courseDetailStylesH.overviewHeader}>
                  <Target className={courseDetailStylesH.overviewIcon} />
                  <h3 className={courseDetailStylesH.overviewTitle}>
                    Course Overview
                  </h3>
                </div>
                <p className={courseDetailStylesH.overviewText}>
                  {course.overview}
                </p>
              </div>
            </div>
          )}

          {/* Enhanced Course Stats */}
          <div
            className={`${courseDetailStylesH.statsContainer} ${animationDelaysH.delay300}`}
          >
            <div className={courseDetailStylesH.statItem}>
              <Clock className={courseDetailStylesH.statIcon} />
              <span className={courseDetailStylesH.statText}>
                {fmtMinutes(totalMinutes)}
              </span>
            </div>
            <div className={courseDetailStylesH.statItem}>
              <BookOpen className={courseDetailStylesH.statIcon} />
              <span className={courseDetailStylesH.statText}>
                {(course.lectures || []).length} lectures
              </span>
            </div>

            <div
              className={`${courseDetailStylesH.teacherStat} ${
                isTeacherAnimating ? "scale-110 bg-indigo-100/50" : ""
              }`}
            >
              <User className={courseDetailStylesH.teacherIcon} />
              <span className={courseDetailStylesH.teacherText}>
                {course.teacher}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid (responsive) */}
        <div className={courseDetailStylesH.mainGrid}>
          {/* Video Player - Enhanced (keeps desktop height unchanged at lg/xl) */}
          <div className={courseDetailStylesH.videoSection}>
            <div className={courseDetailStylesH.videoContainer}>
              <div className={courseDetailStylesH.videoWrapper}>
                {currentVideoContent?.videoUrl ? (
                  <iframe
                    title={
                      currentVideoContent.title || currentVideoContent.name
                    }
                    src={appendAutoplay(
                      toEmbedUrl(currentVideoContent.videoUrl),
                      isLoggedIn && (isEnrolled || courseIsFree)
                    )}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={courseDetailStylesH.videoFrame}
                  />
                ) : (
                  <div className={courseDetailStylesH.videoPlaceholder}>
                    <div
                      className={courseDetailStylesH.videoPlaceholderPattern}
                    >
                      <div
                        className={`${courseDetailStylesH.videoPlaceholderBlob} top-1/4 left-1/4 bg-purple-500`}
                      ></div>
                      <div
                        className={`${courseDetailStylesH.videoPlaceholderBlob} bottom-1/4 right-1/4 bg-blue-500`}
                      ></div>
                    </div>
                    <div
                      className={courseDetailStylesH.videoPlaceholderContent}
                    >
                      <div className={courseDetailStylesH.videoPlaceholderIcon}>
                        <Play
                          className={
                            courseDetailStylesH.videoPlaceholderPlayIcon
                          }
                        />
                      </div>
                      <p className={courseDetailStylesH.videoPlaceholderText}>
                        Select a lecture or chapter to play video
                      </p>
                      {(!isLoggedIn || !(isEnrolled || courseIsFree)) && (
                        <p
                          className={
                            courseDetailStylesH.videoPlaceholderSubtext
                          }
                        >
                          {!isLoggedIn
                            ? "Login required"
                            : "Enrollment required"}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={courseDetailStylesH.videoInfo}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={courseDetailStylesH.videoTitle}>
                      {currentVideoContent?.title ||
                        currentVideoContent?.name ||
                        "Select content to play"}
                    </h3>
                    <p className={courseDetailStylesH.videoDescription}>
                      {selectedContent.type === "chapter"
                        ? `Part of: ${selectedLecture?.title}`
                        : currentVideoContent?.description}
                    </p>
                    {currentVideoContent?.durationMin && (
                      <div className={courseDetailStylesH.videoMeta}>
                        <div className={courseDetailStylesH.durationBadge}>
                          <Clock className={courseDetailStylesH.durationIcon} />
                          <span>
                            {fmtMinutes(currentVideoContent.durationMin)}
                          </span>
                        </div>
                        {selectedContent.type === "chapter" && (
                          <span className={courseDetailStylesH.chapterBadge}>
                            Chapter
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Completion Button */}
                {isLoggedIn &&
                  (isEnrolled || courseIsFree) &&
                  selectedContent.chapterId && (
                    <div className={courseDetailStylesH.completionSection}>
                      <button
                        onClick={() =>
                          toggleChapterCompletion(selectedContent.chapterId)
                        }
                        className={`${courseDetailStylesH.completionButton} ${
                          completedChapters.has(selectedContent.chapterId)
                            ? courseDetailStylesH.completionButtonCompleted
                            : courseDetailStylesH.completionButtonIncomplete
                        }`}
                      >
                        {completedChapters.has(selectedContent.chapterId) ? (
                          <>
                            <CheckCircle
                              className={courseDetailStylesH.completionIcon}
                            />
                            Chapter Completed
                          </>
                        ) : (
                          <>
                            <Circle
                              className={courseDetailStylesH.completionIcon}
                            />
                            Mark as Complete
                          </>
                        )}
                      </button>
                      <p className={courseDetailStylesH.completionText}>
                        {completedChapters.has(selectedContent.chapterId)
                          ? "Great job! You've completed this chapter."
                          : "Click to mark this chapter as completed."}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <aside className={courseDetailStylesH.sidebar}>
            {/* Course Content */}
            <div
              className={`${courseDetailStylesH.sidebarCard} ${animationDelaysH.delay200}`}
            >
              <div className={courseDetailStylesH.contentHeader}>
                <h4 className={courseDetailStylesH.contentTitle}>
                  Course Content
                </h4>

                {courseIsFree && (
                  <div className={courseDetailStylesH.freeAccessBadge}>
                    <Sparkles className={courseDetailStylesH.freeAccessIcon} />
                    Free Access
                  </div>
                )}
              </div>

              <div className={courseDetailStylesH.contentList}>
                {(course.lectures || []).map((lecture, index) => (
                  <div
                    key={lecture.id}
                    className={courseDetailStylesH.lectureItem}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Lecture Header */}
                    <div
                      className={`${courseDetailStylesH.lectureHeader} ${
                        expandedLectures.has(lecture.id)
                          ? courseDetailStylesH.lectureHeaderExpanded
                          : courseDetailStylesH.lectureHeaderNormal
                      }`}
                      onClick={() => onLectureHeaderClick(lecture.id)}
                    >
                      <div className={courseDetailStylesH.lectureContent}>
                        <div className={courseDetailStylesH.lectureLeft}>
                          <div
                            className={`${courseDetailStylesH.lectureChevron} ${
                              expandedLectures.has(lecture.id)
                                ? courseDetailStylesH.lectureChevronExpanded
                                : courseDetailStylesH.lectureChevronNormal
                            }`}
                          >
                            <ChevronDown className="w-5 h-5" />
                          </div>
                          <div className={courseDetailStylesH.lectureInfo}>
                            <div className={courseDetailStylesH.lectureTitle}>
                              {lecture.title}
                            </div>
                            <div className={courseDetailStylesH.lectureMeta}>
                              <div
                                className={courseDetailStylesH.lectureDuration}
                              >
                                <Clock
                                  className={
                                    courseDetailStylesH.lectureDurationIcon
                                  }
                                />
                                {fmtMinutes(lecture.durationMin)}
                              </div>
                              <span
                                className={
                                  courseDetailStylesH.lectureChaptersCount
                                }
                              >
                                {lecture.chapters?.length || 0} chapters
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chapters List */}
                    {expandedLectures.has(lecture.id) && (
                      <div className={courseDetailStylesH.chaptersList}>
                        {(lecture.chapters || []).map((chapter) => {
                          const isCompleted = completedChapters.has(chapter.id);
                          const isSelected =
                            selectedContent.chapterId === chapter.id &&
                            selectedContent.lectureId === lecture.id;

                          return (
                            <div
                              key={chapter.id}
                              className={`${courseDetailStylesH.chapterItem} ${
                                isSelected
                                  ? courseDetailStylesH.chapterItemSelected
                                  : courseDetailStylesH.chapterItemNormal
                              }`}
                              onClick={() =>
                                handleContentSelect(lecture.id, chapter.id)
                              }
                            >
                              <div
                                className={courseDetailStylesH.chapterContent}
                              >
                                <div
                                  className={courseDetailStylesH.chapterLeft}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleChapterCompletion(chapter.id, e);
                                    }}
                                    className={`${
                                      courseDetailStylesH.chapterCompletionButton
                                    } ${
                                      isCompleted
                                        ? courseDetailStylesH.chapterCompletionCompleted
                                        : courseDetailStylesH.chapterCompletionNormal
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle className="w-5 h-5" />
                                    ) : (
                                      <Circle className="w-5 h-5" />
                                    )}
                                  </button>
                                  <div
                                    className={courseDetailStylesH.chapterInfo}
                                  >
                                    <div
                                      className={`${
                                        courseDetailStylesH.chapterName
                                      } ${
                                        isSelected
                                          ? courseDetailStylesH.chapterNameSelected
                                          : courseDetailStylesH.chapterNameNormal
                                      }`}
                                    >
                                      {chapter.name}
                                    </div>
                                    <div
                                      className={
                                        courseDetailStylesH.chapterTopic
                                      }
                                    >
                                      {chapter.topic}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={
                                      courseDetailStylesH.chapterDuration
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
              className={`${courseDetailStylesH.sidebarCard} ${animationDelaysH.delay200}`}
            >
              <div className={courseDetailStylesH.pricingHeader}>
                <h5 className={courseDetailStylesH.pricingTitle}>Pricing</h5>
              </div>

              <div className={courseDetailStylesH.pricingAmount}>
                <div className={courseDetailStylesH.pricingCurrent}>
                  {salePrice != null
                    ? formatCurrency(salePrice)
                    : originalPrice != null
                    ? formatCurrency(originalPrice)
                    : "Free"}
                </div>

                {hasDiscount && (
                  <div className={courseDetailStylesH.pricingOriginal}>
                    {formatCurrency(originalPrice)}
                  </div>
                )}

                {hasDiscount && (
                  <div className={courseDetailStylesH.pricingDiscount}>
                    {Math.round(
                      ((originalPrice - salePrice) / originalPrice) * 100
                    )}
                    % off
                  </div>
                )}
              </div>

              <p className={courseDetailStylesH.pricingDescription}>
                {courseIsFree
                  ? "Free access · Learn anytime"
                  : "One-time payment · Lifetime access · 30-day guarantee"}
              </p>

              {/* Enroll Button */}
              <div className="mt-6">
                {!courseIsFree && !isEnrolled ? (
                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className={courseDetailStylesH.enrollButton}
                  >
                    {isEnrolling ? (
                      <>
                        <div
                          className={courseDetailStylesH.enrollSpinner}
                        ></div>
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Play
                          className={courseDetailStylesH.enrollButtonIcon}
                        />
                        Enroll Now
                        <span className="ml-auto opacity-80 group-hover:opacity-100">
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </>
                    )}
                  </button>
                ) : courseIsFree ? (
                  <button
                    disabled
                    className={courseDetailStylesH.enrollButtonFree}
                  >
                    <CheckCircle
                      className={courseDetailStylesH.enrollButtonIcon}
                    />
                    Free Course - Access Granted
                  </button>
                ) : (
                  <button
                    disabled
                    className={courseDetailStylesH.enrollButtonEnrolled}
                  >
                    <CheckCircle
                      className={courseDetailStylesH.enrollButtonIcon}
                    />
                    Enrolled
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Progress Summary */}
            <div
              className={`${courseDetailStylesH.sidebarCard} ${animationDelaysH.delay400}`}
            >
              <div className={courseDetailStylesH.progressHeader}>
                <Award className={courseDetailStylesH.progressIcon} />
                <h5 className={courseDetailStylesH.progressTitle}>
                  Your Progress
                </h5>
              </div>
              <div className={courseDetailStylesH.progressSection}>
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
                  <div className={courseDetailStylesH.progressBarContainer}>
                    <div
                      className={courseDetailStylesH.progressBar}
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
                <div className={courseDetailStylesH.progressStats}>
                  <div className={courseDetailStylesH.progressStat}>
                    <div className={courseDetailStylesH.progressStatValue}>
                      {fmtMinutes(totalMinutes)}
                    </div>
                    <div className={courseDetailStylesH.progressStatLabel}>
                      Total Duration
                    </div>
                  </div>
                  <div className={courseDetailStylesH.progressStat}>
                    <div className={courseDetailStylesH.progressStatValue}>
                      {completedChapters.size}
                    </div>
                    <div className={courseDetailStylesH.progressStatLabel}>
                      Completed
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Add custom styles for animations */}
      <style jsx>{courseDetailCustomStyles}</style>
    </div>
  );
};

export default CourseDetail;
