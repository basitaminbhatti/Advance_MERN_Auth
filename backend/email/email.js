import { client, sender } from "./sendEmail.config.js";

// =========================== Send Verification Email ===========================
export const sendVerificationEmail = async (email, verificationToken) => {
  const text = `Your verification code is ${verificationToken}`;

  const recipients = [{ email }];

  try {
    const response = await client.send({
      from: sender,
      to: recipients,
      subject: "Verify your email",
      text,
    });
    console.log("Verification email sent", response);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

// ========================== Send Welcome Email ===========================
export const sendWelcomeEmail = async (email, name) => {
  const text = `Welcome to our platform, ${name}! We're glad to have you on board.`;
  const recipients = [{ email }];
  try {
    const response = await client.send({
      from: sender,
      to: recipients,
      subject: "Welcome to Our Platform",
      text,
    });
    console.log("Welcome email sent", response);
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};
