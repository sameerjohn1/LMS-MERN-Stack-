import React, { useState, useEffect } from "react";
import { homeCoursesStyles } from "../assets/dummyStyles";
import { coursesData } from "../assets/dummyHData";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Star, User } from "lucide-react";
import { Slide, toast, ToastContainer } from "react-toastify";

const HomeCourses = () => {
  const navigate = useNavigate();
  const { title, course: courseFont, detail } = homeCoursesStyles.fonts;
  const visibleCourses = coursesData.slice(0, 8);

  const [userRatings, setUserRatings] = useState(() => {
    try {
      const raw = localStorage.getItem("userCourseRatings");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [hoverRatings, setHoverRatings] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem("userCourseRatings", JSON.stringify(userRatings));
    } catch {}
  }, [userRatings]);

  const showLoginToast = () => {
    toast.error("Please login to access this course", {
      position: "top-right",
      transition: Slide,
      autoClose: 3000,
      theme: "dark",
    });
  };

  const handleCourseClick = (id) => {
    const token = localStorage.getItem("token");

    if (!token) {
      showLoginToast();
      return;
    }
    navigate(`/courses/${id}`);
  };

  const handleBrowseClick = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login to access this course", {
        position: "top-right",
        transition: Slide,
        autoClose: 3000,
        theme: "dark",
      });
      return;
    }
    navigate("/courses");
  };

  const handleSetRating = (e, courseId, rating) => {
    e.stopPropagation();
    setUserRatings((prev) => ({ ...prev, [courseId]: rating }));
  };

  // stars to select
  const renderInteractiveStars = (course) => {
    const userRating = userRatings[course.id] || 0;
    const hover = hoverRatings[course.id] || 0;
    const displayRating = hover || userRating;

    return (
      <div className={homeCoursesStyles.starsContainer}>
        <div
          className={homeCoursesStyles.interactiveStars}
          onClick={(e) => e.stopPropagation()}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const idx = i + 1;
            const filled = idx <= displayRating;

            return (
              <button
                key={i}
                onClick={(e) => handleSetRating(e, course.id, idx)}
                onMouseEnter={() =>
                  setHoverRatings((s) => ({ ...s, [course.id]: idx }))
                }
                onMouseLeave={() =>
                  setHoverRatings((s) => ({ ...s, [course.id]: 0 }))
                }
                className={`${homeCoursesStyles.starButton} ${
                  filled
                    ? homeCoursesStyles.starButtonActive
                    : homeCoursesStyles.starButtonInactive
                }`}
                style={{ background: "transparent" }}
              >
                <Star
                  size={16}
                  fill={filled ? "currentColor" : "none"}
                  stroke="currentColor"
                  className={homeCoursesStyles.starIcon}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={homeCoursesStyles.container}>
      <div className={homeCoursesStyles.mainContainer}>
        <div className={homeCoursesStyles.header}>
          <h2 className={`${title} ${homeCoursesStyles.title}`}>
            <Star className={homeCoursesStyles.titleIcon} />
            Explore Top Courses
            <Star className={homeCoursesStyles.titleIcon} />
          </h2>
        </div>

        <div className={homeCoursesStyles.coursesGrid}>
          {visibleCourses.map((course) => {
            const isFree = !!course.isFree || !course.price;

            return (
              <div
                key={course.id}
                onClick={() => handleCourseClick(course.id)}
                className={homeCoursesStyles.courseCard}
              >
                <div className={homeCoursesStyles.imageContainer}>
                  <img
                    src={course.image}
                    alt={course.name}
                    className={homeCoursesStyles.courseImage}
                    loading="lazy"
                  />
                </div>

                <div className={homeCoursesStyles.courseInfo}>
                  <h3
                    className={`${courseFont} ${homeCoursesStyles.courseName}`}
                  >
                    {course.name}
                  </h3>

                  <div className={`${detail} ${homeCoursesStyles.teacherInfo}`}>
                    <User size={15} className={homeCoursesStyles.teacherIcon} />
                    <span className={homeCoursesStyles.teacherName}>
                      {course.teacher}
                    </span>
                  </div>

                  <div className={homeCoursesStyles.ratingContainer}>
                    {renderInteractiveStars(course)}
                  </div>

                  <div className={homeCoursesStyles.pricingContainer}>
                    {isFree ? (
                      <span className={homeCoursesStyles.freePrice}>Free</span>
                    ) : (
                      <>
                        <span className={homeCoursesStyles.salePrice}>
                          {course.price?.sale ?? "-"}
                        </span>
                        {course.price?.original && (
                          <span className={homeCoursesStyles.originalPrice}>
                            {course.price.original}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA BTN*/}
      <div className={homeCoursesStyles.ctaContainer}>
        <div className={homeCoursesStyles.ctaWrapper}>
          <span
            className={homeCoursesStyles.ctaGlow}
            style={{
              zIndex: 0,
              background:
                "conic-gradient(from 0deg, rgba(236,72,153,0.9), rgba(99,102,241,0.9), rgba(139,92,246,0.9), rgba(236,72,153,0.9))",
              filter: "blur(5px)",
              opacity: 0.8,
            }}
          />

          <button
            onClick={handleBrowseClick}
            className={homeCoursesStyles.ctaButton}
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            }}
          >
            <span className={homeCoursesStyles.ctaButtonContent}>
              <span className={homeCoursesStyles.ctaText}>
                Discover Courses
              </span>
              <ArrowRight className={homeCoursesStyles.ctaIcon} />
            </span>
          </button>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        transition={Slide}
      />

      <style jsx>{homeCoursesStyles.animations}</style>
    </div>
  );
};

export default HomeCourses;
