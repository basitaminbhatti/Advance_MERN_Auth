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

// ========================== Send Password Reset Email ===========================
export const sendPasswordResetEmail = async (email, resetLink) => {
  const text = `You requested a password reset. Use the following link to reset your password: ${resetLink}. If you did not request this, please ignore this email.`;
  const recipients = [{ email }];
  try {
    const response = await client.send({
      from: sender,
      to: recipients,
      subject: "Password Reset Request",
      text,
    });
    console.log("Password reset email sent", response);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};

// ========================== Send Password Reset Confirmation Email ===========================
export const sendPasswordResetConfirmationEmail = async (email) => {
  const text = `Your password has been successfully reset. If you did not perform this action, please contact our support team immediately.`;
  const recipients = [{ email }];
  try {
    const response = await client.send({
      from: sender,
      to: recipients,
      subject: "Password Reset Confirmation",
      text,
    });
    console.log("Password reset confirmation email sent", response);
  } catch (error) {
    console.error("Error sending password reset confirmation email:", error);
  }
};
