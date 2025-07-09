const nodemailer = require('nodemailer');

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendNotification = async ({ email, message }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Stock Price Alert',
      text: message
    };

    await transporter.sendMail(mailOptions);
    console.log(`Notification sent to ${email}`);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};