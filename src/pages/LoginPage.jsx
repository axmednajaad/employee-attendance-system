import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Lock, Mail, Eye, EyeOff, CheckCircle, Send } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Set authentication status in localStorage
      localStorage.setItem("isAuthenticated", "true");

      navigate("/attendance");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      setForgotMessage(
        "Password reset email sent! Check your inbox and spam folder."
      );

      // Auto reset after 5 seconds
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail("");
        setForgotMessage("");
        setEmailSent(false);
      }, 5000);
    } catch (error) {
      setForgotMessage(error.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotMessage("");
    setEmailSent(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your attendance management account
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          {showForgotPassword ? (
            <>
              <div className="text-center mb-6">
                {emailSent ? (
                  <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                ) : (
                  <div className="mx-auto h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                    <Send className="h-10 w-10 text-indigo-600" />
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900">
                  {emailSent ? "Check Your Email!" : "Reset Password"}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {emailSent
                    ? "We sent a reset link to your email"
                    : "Enter your email to receive a reset link"}
                </p>
              </div>

              {forgotMessage && (
                <div
                  className={`mb-6 rounded-lg p-4 transition-all duration-300 ${
                    emailSent
                      ? "bg-green-50 border border-green-200 animate-pulse"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {emailSent ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <svg
                          className="h-5 w-5 text-blue-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h3
                        className={`text-sm font-medium ${
                          emailSent ? "text-green-800" : "text-blue-800"
                        }`}
                      >
                        {forgotMessage}
                      </h3>
                      {emailSent && (
                        <p className="mt-1 text-sm text-green-700">
                          The link will expire in 1 hour. Didn't receive it?
                          Check your spam folder.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!emailSent ? (
                <form className="space-y-6" onSubmit={handleForgotPassword}>
                  <div>
                    <label
                      htmlFor="forgotEmail"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email address
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="forgotEmail"
                        name="forgotEmail"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition duration-200"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={resetForgotPassword}
                      className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
                    >
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-200 transform hover:scale-105"
                    >
                      {forgotLoading ? (
                        <div className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Sending...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Send className="w-4 h-4 mr-2" />
                          Send Reset Link
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Success Animation */}
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      We've sent password reset instructions to:
                      <br />
                      <strong className="text-gray-900">{forgotEmail}</strong>
                    </p>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      Next Steps:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Check your email inbox</li>
                      <li>• Click the reset link in the email</li>
                      <li>• Create your new password</li>
                    </ul>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={resetForgotPassword}
                      className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
                    >
                      Back to Login
                    </button>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotLoading}
                      className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
                    >
                      Resend Email
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 animate-shake">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {error}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg transition duration-200"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg transition duration-200"
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none transition duration-200"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition duration-200"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-200"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-200 transform hover:scale-105"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Signing in...
                      </div>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Additional Info */}
        {/* <div className="text-center">
          <p className="text-xs text-gray-500">
            Secure access to your attendance management system
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default LoginPage;
