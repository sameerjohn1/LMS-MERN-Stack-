import React from "react";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import HomeCourses from "../components/HomeCourses";
import Testimonials from "../components/Testimonials";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div>
      <Navbar />
      <Banner />
      <HomeCourses />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Home;
