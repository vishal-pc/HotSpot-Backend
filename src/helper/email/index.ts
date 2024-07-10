import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
// Create a transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Replace with your mail provider's SMTP server
  port: Number(process.env.SMTP_PORT), // Standard SMTP port
  secure: false, // True for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Replace with your email
    pass: process.env.SMTP_PASSWORD, // Replace with your password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const SendMail = async (
  recipient: string,
  subject: string,
  html: string
) => {
  let mailOptions = {
    from: process.env.SMTP_FROM_EMAIL, // Sender address
    to: recipient, // List of recipients
    subject: subject, // Subject line
    html: html, // HTML body
  };

  // Send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return {
        status: false,
        error,
      };
    } else {
      return {
        status: true,
        info,
      };
    }
  });
};
