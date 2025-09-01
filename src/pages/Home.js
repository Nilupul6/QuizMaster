import React from 'react';
import { motion } from 'framer-motion';
import '../assets/styles/Home.css';
import { Link } from 'react-router-dom';
import { FaFlask, FaCalculator, FaHistory, FaGlobe, FaPalette, FaBrain } from 'react-icons/fa';
import { FaUsers, FaTrophy, FaClock, FaStar } from 'react-icons/fa';
import { FiFacebook, FiTwitter, FiInstagram, FiMail } from 'react-icons/fi';

const categories = [
  { icon: <FaFlask />, title: 'Science', desc: 'Biology, Chemistry, Physics and more', quizzes: '120+' },
  { icon: <FaCalculator />, title: 'Mathematics', desc: 'Algebra, Geometry, Calculus challenges', quizzes: '85+' },
  { icon: <FaHistory />, title: 'History', desc: 'World history, ancient civilizations', quizzes: '95+' },
  { icon: <FaGlobe />, title: 'Geography', desc: 'Countries, capitals, landmarks', quizzes: '75+' },
  { icon: <FaPalette />, title: 'Arts', desc: 'Literature, music, visual arts', quizzes: '60+' },
  { icon: <FaBrain />, title: 'General Knowledge', desc: 'Mixed topics and trivia', quizzes: '150+' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Home = () => {
  return (
    <div>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="logo">QuizMaster</div>
        <div className="navbar-right">
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#categories">Category</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#contact">ContactUs</a></li>
          </ul>
          <div className="navbar-links">
          <Link to="/login" className="nav-button">
            Login
          </Link>
        </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <h1>Test Your Knowledge</h1>
        <p>
          Challenge yourself with thousands of quizzes across multiple categories.
          Learn, compete, and have fun while expanding your knowledge!
        </p>
        <div className="hero-buttons">
          <Link to="/login" className="start-btn">▶ Start Quiz Now</Link>
          <a href="#categories" className="browse-btn">📚 Browse Categories</a>
        </div>

        <div className="hero-stats">
          <span>👥 10,000+ Active Users</span>
          <span>🏆 500+ Quiz Topics</span>
          <span>▶ Free to Play</span>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories" id="categories">
      <h2>Choose Your Category</h2>
      <p>Explore our diverse collection of quiz categories and find the perfect challenge for you</p>
      <div className="card-grid">
        {categories.map((cat, idx) => (
          <motion.div
            className={`category-card card-${cat.title.toLowerCase().replace(/\s/g, '-')}`}
            key={idx}
            custom={idx}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
          >
            <div className="card-icon">{cat.icon}</div>
            <h3>{cat.title}</h3>
            <p className="card-desc">{cat.desc}</p>
            <div className="card-footer">
              <span>{cat.quizzes} Quizzes</span>
              <a href="#">Start Quiz →</a>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

      {/* Why Choose Section */}
        <section className="why-section" id="services">
          <h2>Why Choose Our Quiz Platform?</h2>
          <p>Join thousands of learners who trust our platform for their knowledge challenges</p>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon blue"><FaUsers /></div>
              <h3>10,000+</h3>
              <p>Active Players</p>
            </div>
            <div className="service-card">
              <div className="service-icon gold"><FaTrophy /></div>
              <h3>500+</h3>
              <p>Quiz Categories</p>
            </div>
            <div className="service-card">
              <div className="service-icon green"><FaClock /></div>
              <h3>24/7</h3>
              <p>Available</p>
            </div>
            <div className="service-card">
              <div className="service-icon purple"><FaStar /></div>
              <h3>4.9★</h3>
              <p>User Rating</p>
            </div>
          </div>
        </section>

      {/* Footer */}
      <footer id="contact">
        <div className="footer-content">
          <div>
            <h3 className="footer-logo">QuizMaster</h3>
            <p>Challenge your mind, expand your knowledge, and have fun with our comprehensive quiz platform. Perfect for students, professionals, and knowledge enthusiasts.</p>
            <div>
            <div className="footer-social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FiFacebook className="facebook" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FiTwitter className="twitter" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FiInstagram className="instagram" />
              </a>
              <a href="mailto:info@quizmaster.com" aria-label="Email">
                <FiMail className="gmail" />
              </a>
            </div>
          </div>
          </div>
     
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">Categories</a></li>
              <li><a href="#">Leaderboard</a></li>
              <li><a href="#">About Us</a></li>
            </ul>
          </div>
          <div>
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        {/* Footer Bottom */}
        <div className="footer-bottom">
          © 2024 QuizMaster. All rights reserved. Built with ❤️ for learners everywhere.
        </div>
      </footer>
    </div>
  );
};

export default Home;
