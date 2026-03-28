
const sgMail = require("@sendgrid/mail");

// ================== CONFIGURE TRANSPORTER ==================
const createTransporter = () => {
    if (!process.env.SENDGRID_API_KEY) {
        console.error("❌ SENDGRID_API_KEY is missing!");
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    return {
        sendMail: async (mailOptions, callback) => {
            try {
                const msg = {
                    to: mailOptions.to,
                    from: mailOptions.from || process.env.EMAIL_FROM,
                    subject: mailOptions.subject,
                    html: mailOptions.html,
                    text: mailOptions.text
                };

                const response = await sgMail.send(msg);

                if (callback) {
                    callback(null, { response: response[0].statusCode });
                }

                return response;
            } catch (error) {
                console.error("❌ SendGrid Error:", error.response?.body || error.message);

                if (callback) {
                    callback(error, null);
                }

                throw error;
            }
        }
    };
};

const transporter = createTransporter();

// ================== BOOKING CONFIRMATION ==================
exports.sendBookingConfirmation = async (booking) => {
    try {
        await transporter.sendMail({
            to: booking.guestEmail,
            subject: "Booking Confirmation - Hotel Booking System",
            html: `...same HTML...`
        });

        console.log("Booking confirmation email sent to", booking.guestEmail);
    } catch (error) {
        console.error("Error sending booking confirmation email:", error);
    }
};

// ================== CANCELLATION ==================
exports.sendCancellationEmail = async (booking) => {
    try {
        await transporter.sendMail({
            to: booking.guestEmail,
            subject: "Booking Cancellation - Hotel Booking System",
            html: `...same HTML...`
        });

        console.log("Cancellation email sent to", booking.guestEmail);
    } catch (error) {
        console.error("Error sending cancellation email:", error);
    }
};

// ================== PAYMENT RECEIPT ==================
exports.sendPaymentReceipt = async (booking) => {
    try {
        await transporter.sendMail({
            to: booking.guestEmail,
            subject: "Payment Receipt - Hotel Booking System",
            html: `...same HTML...`
        });

        console.log("Payment receipt email sent to", booking.guestEmail);
    } catch (error) {
        console.error("Error sending payment receipt email:", error);
    }
};

// ================== REVIEW REMINDER ==================
exports.sendReviewReminderEmail = async (userEmail, bookingDetails) => {
    try {
        await transporter.sendMail({
            to: userEmail,
            subject: "Share Your Review - Hotel Booking System",
            html: `...same HTML...`
        });

        console.log("Review reminder email sent to", userEmail);
    } catch (error) {
        console.error("Error sending review reminder email:", error);
    }
};

// ================== OFFER ==================
exports.sendOfferNotificationEmail = async (userEmail, offerDetails) => {
    try {
        await transporter.sendMail({
            to: userEmail,
            subject: `Special Offer: ${offerDetails.title} - Hotel Booking System`,
            html: `...same HTML...`
        });

        console.log("Offer notification email sent to", userEmail);
    } catch (error) {
        console.error("Error sending offer notification email:", error);
    }
};

// ================== UPGRADE ==================
exports.sendUpgradeReminderEmail = async (userEmail, roomName) => {
    try {
        await transporter.sendMail({
            to: userEmail,
            subject: "Room Upgrade Available - Hotel Booking System",
            html: `...same HTML...`
        });

        console.log("Upgrade reminder email sent to", userEmail);
    } catch (error) {
        console.error("Error sending upgrade reminder email:", error);
    }
};

// ================== REVIEW APPROVAL ==================
exports.sendReviewApprovalEmail = async (userEmail, userName, roomName, reviewComment) => {
    return new Promise(async (resolve, reject) => {
        try {
            const mailOptions = {
                to: userEmail,
                subject: "Your Review Has Been Approved!",
                html: `...same HTML...`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error:", error);
                    return reject(error);
                }
                resolve(info);
            });
        } catch (error) {
            reject(error);
        }
    });
};

// ================== GENERIC EMAIL ==================
exports.sendEmail = async (to, subject, text) => {
    await transporter.sendMail({
        to,
        subject,
        text
    });
};

// ================== CUSTOM EMAIL ==================
exports.sendCustomEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            to,
            subject,
            html
        });

        console.log("Custom email sent to", to);
    } catch (error) {
        console.error("Error sending custom email:", error);
        throw error;
    }
};