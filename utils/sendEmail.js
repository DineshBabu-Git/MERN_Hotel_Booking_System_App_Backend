
const sgMail = require("@sendgrid/mail");

// ================== CONFIGURE TRANSPORTER ==================
const createTransporter = () => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY_NEW);

    return {
        sendMail: async (mailOptions, callback) => {
            try {
                const msg = {
                    to: mailOptions.to,
                    from: mailOptions.from || process.env.EMAIL_USER,
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
            from: process.env.EMAIL_USER,
            to: booking.guestEmail,
            subject: "Booking Confirmation - Hotel Booking System",
            html: `
                <h2>Booking Confirmation</h2>
                <p>Dear ${booking.guestEmail},</p>
                <p>Your booking has been confirmed successfully!</p>
                <h3>Booking Details:</h3>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</li>
                    <li><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</li>
                    <li><strong>Number of Nights:</strong> ${booking.numberOfNights}</li>
                    <li><strong>Total Price:</strong> $${booking.totalPrice.toFixed(2)}</li>
                    <li><strong>Payment Status:</strong> ${booking.paymentStatus}</li>
                </ul>
                <p>Thank you for choosing our hotel!</p>
                <p>Best regards,<br>Hotel Booking Team</p>
            `
        });

        console.log("Booking confirmation email sent to", booking.guestEmail);
    } catch (error) {
        console.error("Error sending booking confirmation email:", error);
    }
};

// ================== BOOKING CANCELLATION ==================
exports.sendCancellationEmail = async (booking) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: booking.guestEmail,
            subject: "Booking Cancellation - Hotel Booking System",
            html: `
                <h2>Booking Cancelled</h2>
                <p>Dear Guest,</p>
                <p>Your booking has been cancelled as requested.</p>
                <h3>Cancelled Booking Details:</h3>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</li>
                    <li><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</li>
                    <li><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</li>
                    <li><strong>Refund Amount:</strong> $${booking.totalPrice.toFixed(2)}</li>
                </ul>
                ${booking.cancellationReason ? `<p><strong>Reason:</strong> ${booking.cancellationReason}</p>` : ""}
                <p>Your refund will be processed within 5-7 business days.</p>
                <p>We look forward to serving you again!</p>
                <p>Best regards,<br>Hotel Booking Team</p>
            `
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
            from: process.env.EMAIL_USER,
            to: booking.guestEmail,
            subject: "Payment Receipt - Hotel Booking System",
            html: `
                <h2>Payment Receipt</h2>
                <p>Dear Guest,</p>
                <p>Thank you for your payment. Here is your receipt.</p>
                <h3>Payment Details:</h3>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Payment ID:</strong> ${booking.razorpayPaymentId || "N/A"}</li>
                    <li><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</li>
                    <li><strong>Original Amount:</strong> ₹${booking.originalPrice.toFixed(2)}</li>
                    ${booking.discountAmount ? `<li><strong>Discount:</strong> -₹${booking.discountAmount.toFixed(2)}</li>` : ""}
                    <li><strong>Total Amount Paid:</strong> ₹${booking.totalPrice.toFixed(2)}</li>
                    <li><strong>Payment Method:</strong> ${booking.paymentMethod || "Razorpay"}</li>
                </ul>
                <p>Your booking details will be sent separately.</p>
                <p>Best regards,<br>Hotel Booking Team</p>
            `
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
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: "Share Your Review - Hotel Booking System",
            html: `
                <h2>How Was Your Stay?</h2>
                <p>Dear Guest,</p>
                <p>We hope you had a wonderful experience during your stay with us!</p>
                <p>Please share your feedback:</p>
                <p><a href="${process.env.FRONTEND_URL}/reviews/${bookingDetails.bookingId}">Write Your Review</a></p>
                <p>Best regards,<br>Hotel Booking Team</p>
            `
        });

        console.log("Review reminder email sent to", userEmail);
    } catch (error) {
        console.error("Error sending review reminder email:", error);
    }
};

// ================== OFFER NOTIFICATION ==================
exports.sendOfferNotificationEmail = async (userEmail, offerDetails) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Special Offer: ${offerDetails.title} - Hotel Booking System`,
            html: `
                <h2>${offerDetails.title}</h2>
                <p>Exclusive offer just for you!</p>
                <ul>
                    <li><strong>Discount:</strong> ${offerDetails.discount}${offerDetails.discountType === "percentage" ? "%" : "$"}</li>
                    <li><strong>Code:</strong> ${offerDetails.code}</li>
                </ul>
                <p><a href="${process.env.FRONTEND_URL}/rooms">Book Now</a></p>
            `
        });

        console.log("Offer notification email sent to", userEmail);
    } catch (error) {
        console.error("Error sending offer notification email:", error);
    }
};

// ================== UPGRADE REMINDER ==================
exports.sendUpgradeReminderEmail = async (userEmail, roomName) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: "Room Upgrade Available - Hotel Booking System",
            html: `
                <h2>Room Upgrade Available!</h2>
                <p>${roomName} is now available!</p>
                <p><a href="${process.env.FRONTEND_URL}/rooms">Check Availability</a></p>
            `
        });

        console.log("Upgrade reminder email sent to", userEmail);
    } catch (error) {
        console.error("Error sending upgrade reminder email:", error);
    }
};

// ================== REVIEW APPROVAL (CALLBACK SUPPORT) ==================
exports.sendReviewApprovalEmail = async (userEmail, userName, roomName, reviewComment) => {
    return new Promise(async (resolve, reject) => {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: "Your Review Has Been Approved! - Hotel Booking System",
                html: `
                    <h2>Review Approved</h2>
                    <p>Dear ${userName},</p>
                    <p>Your review for ${roomName} is now live.</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) return reject(error);
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
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    });
};

// ================== CUSTOM EMAIL ==================
exports.sendCustomEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
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
