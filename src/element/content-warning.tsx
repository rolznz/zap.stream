import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";

export function isContentWarningAccepted() {
  return Boolean(window.localStorage.getItem("accepted-content-warning"));
}

export function ContentWarningOverlay() {
  const navigate = useNavigate();
  const [is18Plus, setIs18Plus] = useState(isContentWarningAccepted());
  if (is18Plus) return null;

  function grownUp() {
    window.localStorage.setItem("accepted-content-warning", "true");
    setIs18Plus(true);
  }

  return (
    <div className="fullscreen-exclusive age-check">
      <h1>
        <FormattedMessage defaultMessage="Sexually explicit material ahead!" />
      </h1>
      <h2>
        <FormattedMessage defaultMessage="Confirm your age" />
      </h2>
      <div className="flex g24">
        <button className="btn btn-warning" onClick={grownUp}>
          <FormattedMessage defaultMessage="Yes, I am over 18" />
        </button>
        <button className="btn" onClick={() => navigate("/")}>
          <FormattedMessage defaultMessage="No, I am under 18" />
        </button>
      </div>
    </div>
  );
}
