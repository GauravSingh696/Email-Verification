// src/pages/Signup.jsx
import { useState } from "react";
import { FaRegCalendarAlt } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("signup"); // signup | otp
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleGetCode = async () => {
    if (!email) return alert("Enter email");
    setIsSubmitting(true);
    try {
      const res = await axios.post("http://localhost:8080/sendEmail", { email });
      if (res.data.Success) {
        setStep("otp");
      } else {
        alert("Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) return alert("Enter OTP");
    try {
      const body = { email, otp, name, dob };
      const res = await axios.post("http://localhost:8080/verifyOtp", body);
      if (res.data.Success) {
        // store user in localStorage and go to dashboard
        window.localStorage.setItem("hd_user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        alert(res.data.msg || "OTP invalid");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Verification failed");
    }
  };

  return (
    <div className="flex min-h-screen">

      <div className="flex justify-center items-center">
        <div className="h-auto m-auto flex flex-col justify-center items-center gap-6 rounded-xl mt-10 py-6 p-5 min-w-md w-">
          <div className="w-full flex items-center">
            <img src="/icon.png" alt="logo" className="w-8 h-8 animate-spin" />
            <strong className="text-2xl ml-1">HD</strong>
          </div>

          <div className="w-full flex flex-col justify-center items-center gap-2">
            <h4 className="font-bold text-3xl">{step === "signup" ? "Sign up" : "Enter Verification Code"}</h4>
            <p className="text-gray-500">{step === "signup" ? "Sign up to enjoy the feature of HD" : "We have sent you a verification code on your Gmail"}</p>
          </div>

          {step === "signup" ? (
            <>
              <div className="relative w-full">
                <label className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-sm">Your Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jonas Khanwald" className="w-full h-12 px-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500" />
              </div>

              <div className="relative w-full">
                <label className="absolute -top-3 left-10 bg-white px-1 text-gray-600 text-sm">Date of Birth</label>
                <FaRegCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full h-12 pl-10 pr-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500" />
              </div>

              <div className="relative w-full">
                <label className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-sm">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jonas_kahnwald@gmail.com" className="w-full h-12 px-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500" />
              </div>

              <button onClick={handleGetCode} className={`${isSubmitting ? "cursor-progress opacity-50" : ""} w-full h-10 rounded-xl bg-blue-500 text-white hover:bg-blue-600 cursor-pointer`}>
                {isSubmitting ? "Sending..." : "Get OTP"}
              </button>

              <p className="mt-4 text-sm text-gray-600 text-center">Already have an account?? <a href="/signin" className="text-blue-500 hover:underline">Sign in</a></p>
            </>
          ) : (
            <>
              <div className="relative w-full">
                <label className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-sm">OTP</label>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter your OTP" className="w-full h-12 px-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500" />
              </div>
              <button onClick={handleVerify} className="w-full h-10 rounded-xl bg-blue-500 text-white hover:bg-blue-600">Verify Code</button>
            </>
          )}
        </div>
      </div>


      <img src="/image1.jpg" alt="error" className="h-screen min-w-md" />

    </div>
  );
};

export default SignUp;
