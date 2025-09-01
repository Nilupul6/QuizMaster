import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './AppWrapper';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { startCountdownListener, stopCountdownListener } from './services/countdownService';




const root = ReactDOM.createRoot(document.getElementById('root'));
stopCountdownListener();
startCountdownListener();
root.render(<AppWrapper />);
