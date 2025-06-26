import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [lastEmails, setLastEmails] = useState([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const navigate = useNavigate();

  const superAdminEmail = "anugrahg38@gmail.com";
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || superAdminEmail;

  useEffect(() => {
    // Autofill from localStorage
    const savedEmail = localStorage.getItem("miniexamlms_email");
    const savedPassword = localStorage.getItem("miniexamlms_password");
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
    setRememberMe(!!savedEmail);
    // Load last used emails
    const emails = JSON.parse(localStorage.getItem("miniexamlms_last_emails") || "[]");
    setLastEmails(emails);
  }, []);

  const saveLastEmail = (newEmail) => {
    let emails = JSON.parse(localStorage.getItem("miniexamlms_last_emails") || "[]");
    emails = [newEmail, ...emails.filter((e) => e !== newEmail)].slice(0, 5);
    localStorage.setItem("miniexamlms_last_emails", JSON.stringify(emails));
    setLastEmails(emails);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        if (!displayName.trim()) {
          setError("Full Name is required.");
          setLoading(false);
          return;
        }
        const userCred = await register(email, password);
        let userRole = role;
        if (email === superAdminEmail) {
          userRole = "superadmin";
        } else if (role === "teacher") {
          userRole = "pending-teacher";
        }
        await setDoc(doc(db, "users", userCred.user.uid), {
          email,
          displayName,
          role: userRole,
        });
        saveLastEmail(email);
        if (userRole === "student" || userRole === "superadmin") {
          if (userRole === "superadmin") {
            navigate("/admin");
          } else {
            navigate("/student");
          }
        } else {
          setError("Registration successful. Awaiting super admin approval for teacher account.");
        }
      } else {
        await login(email, password);
        // Remember Me
        if (rememberMe) {
          localStorage.setItem("miniexamlms_email", email);
          localStorage.setItem("miniexamlms_password", password);
        } else {
          localStorage.removeItem("miniexamlms_email");
          localStorage.removeItem("miniexamlms_password");
        }
        saveLastEmail(email);
        // Fetch user role from Firestore
        let userRole = "student";
        let userName = "";
        let userId = null;
        let userDocSnap = null;
        try {
          userDocSnap = await getDoc(doc(db, "users", email));
        } catch {}
        if (userDocSnap && userDocSnap.exists()) {
          const userData = userDocSnap.data();
          userRole = userData.role || "student";
          userName = userData.displayName || "";
        }
        if (email === superAdminEmail) {
          userRole = "superadmin";
        }
        if (userRole === "superadmin") {
          navigate("/admin");
        } else if (userRole === "pending-teacher") {
          setError("Your teacher account is pending approval by the super admin.");
        } else if (userRole === "teacher") {
          navigate("/admin");
        } else {
          navigate("/student");
        }
      }
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again or use 'Forgot Password'.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setResetSent(false);
    try {
      await sendPasswordResetEmail(getAuth(), email);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEmailDropdown = (selectedEmail) => {
    setEmail(selectedEmail);
    setShowEmailDropdown(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isRegister ? "Register" : "Login"}
        </h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {resetSent && <div className="text-green-600 mb-4">Password reset email sent!</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                placeholder="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={role === "student"}
                    onChange={() => setRole("student")}
                  />
                  <span className="ml-2">Student</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={role === "teacher"}
                    onChange={() => setRole("teacher")}
                  />
                  <span className="ml-2">Teacher</span>
                </label>
              </div>
            </>
          )}
          <div className="relative">
            <input
              type="email"
              className="w-full px-3 py-2 border rounded"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              onFocus={() => setShowEmailDropdown(true)}
              onBlur={() => setTimeout(() => setShowEmailDropdown(false), 150)}
            />
            {showEmailDropdown && lastEmails.length > 0 && (
              <div className="absolute left-0 right-0 bg-white border rounded shadow z-10">
                {lastEmails.map((e, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onMouseDown={() => handleEmailDropdown(e)}
                  >
                    {e}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-3 py-2 border rounded"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-sm text-gray-500"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {isRegister && (
            <div className="text-xs text-gray-500">Password must be at least 6 characters.</div>
          )}
          {!isRegister && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe((v) => !v)}
                />
                <span className="ml-2">Remember Me</span>
              </label>
              <button
                type="button"
                className="text-blue-600 hover:underline text-sm"
                onClick={handleForgotPassword}
                disabled={!email}
              >
                Forgot Password?
              </button>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? (isRegister ? "Registering..." : "Logging in...") : isRegister ? "Register" : "Login"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            className="text-blue-600 hover:underline"
            onClick={() => { setIsRegister((prev) => !prev); setError(""); }}
          >
            {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
} 