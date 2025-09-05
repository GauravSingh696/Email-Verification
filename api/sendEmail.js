// backend/sendEmail.js
import nodemailer from "nodemailer";

const sendEmail = async (email, subject, msg) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.MY_EMAIL,
            pass: process.env.MY_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: process.env.MY_EMAIL,
        to: email,
        subject,
        text: msg,
    });
};

export default sendEmail;
