import { useEffect, useRef } from "react";
import { useLocation, useNavigation } from "react-router-dom";

export const usePrompt = (when, message, onConfirm) => {
  const location = useLocation();
  const navigation = useNavigation();
  const lastLocation = useRef(location);

  useEffect(() => {
    if (!when) return;

    const handleNavigation = () => {
      if (
        navigation.state === "submitting" ||
        navigation.state === "loading" ||
        lastLocation.current.pathname !== location.pathname
      ) {
        const confirm = window.confirm(message);
        if (confirm && onConfirm) {
          onConfirm();
        }
        return confirm;
      }
      return true;
    };

    // Listen for navigation attempts
    const unblock = window.history.block ? window.history.block(handleNavigation) : null;

    // Update last location
    lastLocation.current = location;

    return () => {
      if (unblock) unblock();
    };
  }, [when, message, onConfirm, navigation.state, location.pathname]);
};