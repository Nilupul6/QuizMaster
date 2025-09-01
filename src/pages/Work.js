import React from "react";
import PickMeals from "../assets/images/upload.png";
import ChooseMeals from "../assets/images/generate.jpg";
import DeliveryMeals from "../assets/images/submit.png";
import "../assets/styles/Home.css";

const Work = () => {
  const workInfoData = [
    {
      image: PickMeals,
      title: "Upload PDF",
      text: "Admin Can Upload The PDF In To The Web App.",
    },
    {
      image: ChooseMeals,
      title: "Generate Quiz",
      text: "Automattically Generate The Quizess.",
    },
    {
      image: DeliveryMeals,
      title: "Submit Answer",
      text: "Student Can Submit The Answers.",
    },
  ];

  return (
    <div className="work-section-wrapper">
      <div className="work-section-top">
        <p className="primary-subheading"></p><br></br>
        <h1 className="primary-heading">How It Works</h1>
        <p className="primary-text">
          Lorem ipsum dolor sit amet consectetur. Non tincidunt magna non et
          elit. Dolor turpis molestie dui magnis facilisis at fringilla quam.
        </p>
      </div>
      <div className="work-section-bottom">
        {workInfoData.map((data) => (
          <div className="work-section-info" key={data.title}>
            <div className="info-boxes-img-container">
              <img src={data.image} alt={data.title} />
            </div>
            <h2>{data.title}</h2>
            <p>{data.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Work;
