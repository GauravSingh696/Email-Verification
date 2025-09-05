// src/pages/Signin.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Signin = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("email"); // email | otp
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const requestOtp = async () => {
        if (!email) return alert("Enter email");
        setIsSubmitting(true);
        try {
            const res = await axios.post("http://localhost:8080/sendEmail", { email });
            if (res.data.Success) setStep("otp");
            else alert("Failed to send OTP");
        } catch (err) {
            console.error(err);
            alert("Error sending OTP");
        } finally {
            setIsSubmitting(false);
        }
    };

    const verify = async () => {
        if (!otp) return alert("Enter OTP");
        try {
            const res = await axios.post("http://localhost:8080/verifyOtp", { email, otp });
            if (res.data.Success) {
                window.localStorage.setItem("hd_user", JSON.stringify(res.data.user));
                navigate("/dashboard");
            } else {
                alert(res.data.msg || "Invalid OTP");
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || "Verification failed");
        }
    };

    return (
        <div className="flex min-h-screen">

            <div className="flex justify-center items-center">
                <div className="flex items-center justify-center min-h-screen bg-white">
                    <div className="h-auto m-auto flex flex-col justify-center items-center gap-6 rounded-xl mt-10 py-6 p-5 min-w-md w-full">
                        <div className="w-full flex items-center">
                            <img src="/icon.png" alt="logo" className="w-8 h-8 animate-spin" />
                            <strong className="text-2xl ml-1">HD</strong>
                        </div>

                        <div className="w-full flex flex-col justify-center items-center gap-2">
                            <h4 className="font-bold text-3xl">Sign in</h4>
                            <p className="text-gray-500">Please login to continue to your account.</p>
                        </div>

                        <div className="relative w-full">
                            <label className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-sm">Email</label>
                            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jonas_kahnwald@gmail.com" className="w-full h-12 px-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500" />
                        </div>

                        {step === "email" ? (
                            <button onClick={requestOtp} className={`${isSubmitting ? "cursor-progress opacity-50" : ""} w-full h-10 rounded-xl bg-blue-500 text-white hover:bg-blue-600 cursor-pointer`}>{isSubmitting ? "Sending..." : "Get OTP"}</button>
                        ) : (
                            <>
                                <div className="relative w-full">
                                    <label className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-sm">OTP</label>
                                    <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" className="w-full h-12 px-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500" />
                                    <a onClick={requestOtp} className="absolute -bottom-6 left-0 text-sm text-blue-500 hover:underline cursor-pointer">Resend OTP</a>
                                </div>
                                <div className="flex items-center w-full gap-2 mt-6">
                                    <input type="checkbox" id="keep" className="h-4 w-4 cursor-pointer" />
                                    <label htmlFor="keep" className="text-gray-600 text-sm cursor-pointer">Keep me logged in</label>
                                </div>
                                <button onClick={verify} className="w-full h-10 rounded-xl bg-blue-500 text-white hover:bg-blue-600 mt-2 cursor-pointer">Sign in</button>
                            </>
                        )}

                        <p className="mt-4 text-sm text-gray-600 text-center">Need an account? <a href="/signup" className="text-blue-500 hover:underline cursor-pointer">Create one</a></p>
                    </div>
                </div>
            </div>

            <img src="/image1.jpg" alt="error" className="h-screen min-w-md" />
        </div>
    );
};

export default Signin;
