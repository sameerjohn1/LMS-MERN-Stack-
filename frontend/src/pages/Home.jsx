import React from "react";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import HomeCourses from "../components/HomeCourses";
import Testimonials from "../components/Testimonials";

const Home = () => {
  return (
    <div>
      <Navbar />
      <Banner />
      <HomeCourses />
      <Testimonials />
    </div>
  );
};

export default Home;
