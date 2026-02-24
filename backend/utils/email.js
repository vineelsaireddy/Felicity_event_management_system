import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export const sendRegistrationEmail = (email, eventName, ticketId) => {
  const html = `
    <h2>Registration Confirmed</h2>
    <p>You have successfully registered for <strong>${eventName}</strong></p>
    <p><strong>Ticket ID:</strong> ${ticketId}</p>
    <p>Please keep this ticket ID safe as you'll need it for attendance.</p>
  `;
  return sendEmail(email, `Event Registration: ${eventName}`, html);
};
