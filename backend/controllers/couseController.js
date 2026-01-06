import Course from "../models/couseModel.js";
import { getAuth } from "@clerk/express";

// helper function
const toNumber = (v, fallback) => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const parseJSONsafe = (maybe) => {
  if (!maybe) return null;
  if (typeof maybe === "object") return maybe;

  try {
    return JSON.parse(maybe);
  } catch {
    return null;
  }
};

//compute fields for totallecture, course, duration
// mutate them and return an OBJ
const computeDerivedFields = (courseObj) => {
  let totalCourseMinutes = 0;
  if (!Array.isArray(courseObj.lectures)) courseObj.lectures = [];

  courseObj.lectures = courseObj.lectures.map((lec) => {
    lec = { ...lec };
    lec.duration = lec.duration || {};
    lec.chapters = Array.isArray(lec.chapters) ? lec.chapters : [];

    // normalize chapter totals
    lec.chapters = lec.chapters.map((ch) => {
      ch = { ...ch };
      ch.duration = ch.duration || {};
      const chHours = toNumber(ch.duration.hours);
      const chMins = toNumber(ch.duration.minutes);
      ch.totalMinutes = ch.totalMinutes
        ? toNumber(ch.totalMinutes)
        : chHours * 60 + chMins;

      ch.duration.hours = chHours;
      ch.duration.minutes = chMins;
      ch.name = ch.name || "";
      ch.topic = ch.topic || "";
      ch.videoUrl = ch.videoUrl || "";

      return ch;
    });

    const lecHours = toNumber(lec.duration.hours);
    const lecMins = toNumber(lec.duration.minutes);
    const lectureOwnMinutes = lecHours * 60 + lecMins;
    const chaptersMinutes = lec.chapters.reduce(
      (s, c) => s + toNumber(c.totalMinutes, 0),
      0
    );

    lec.totalMinutes = lectureOwnMinutes + chaptersMinutes;

    lec.duration.hours = lecHours;
    lec.duration.minutes = lecMins;

    totalCourseMinutes += lec.totalMinutes;
    lec.title = lec.title || "Untitled lecture";

    return lec;
  });

  courseObj.totalDuration = courseObj.totalDuration || {};
  courseObj.totalDuration.hours = Math.floor(totalCourseMinutes / 60);
  courseObj.totalDuration.minutes = totalCourseMinutes % 60;
  courseObj.totalLectures = Array.isArray(courseObj.lectures)
    ? courseObj.lectures.length
    : 0;

  return courseObj;
};

// create img url from stored value
const makeImageAbsolute = (rawImage, req) => {
  if (!rawImage) return "";
  const image = String(rawImage || "");
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) {
    return `${req.protocol}://${req.get("host")}${image}`;
  }
  // if file stored as "uploads/filename" or just "filename"
  if (image.startsWith("uploads/")) {
    return `${req.protocol}://${req.get("host")}/${image}`;
  }
  return `${req.protocol}://${req.get("host")}/uploads/${image}`;
};

// to get public courses
export const getPublicCourses = async (req, res) => {
  try {
    const { home, type = "all", limit } = req.body;
    let filter = {};

    if (home === "true") {
      filter.courseType = "top";
    } else if (type === "top") {
      filter.courseType = "top";
    } else if (type === "regular") {
      filter.courseType = "regular";
    }

    const q = Course.find(filter).sort({ createdAt: -1 });

    if (home === "true") {
      q.limit(Number(limit || 8));
    } else if (limit) {
      q.limit(Number(limit));
    }

    const courses = await q.lean();

    const mapped = courses.map((c) => {
      const imageUrl = makeImageAbsolute(c.image || "", req);
      return {
        ...c,
        image: imageUrl,
      };
    });

    return res.json({
      success: true,
      items: mapped,
    });
  } catch (err) {
    console.error("GetPublicCourses error:", err);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};
