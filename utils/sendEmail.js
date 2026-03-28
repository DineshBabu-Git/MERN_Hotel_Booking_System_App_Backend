
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

// Send Booking Confirmation Email
exports.sendBookingConfirmation = async (booking) => {
    try {
        const mailOptions = {
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
        };

        await transporter.sendMail(mailOptions);
        console.log("Booking confirmation email sent to", booking.guestEmail);
    } catch (error) {
        console.error("Error sending booking confirmation email:", error);
    }
};

// Send Cancellation Email
exports.sendCancellationEmail = async (booking) => {
    try {
        const mailOptions = {
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
        };

        await transporter.sendMail(mailOptions);
        console.log("Cancellation email sent to", booking.guestEmail);
    } catch (error) {
        console.error("Error sending cancellation email:", error);
    }
};

// Send Payment Receipt Email
exports.sendPaymentReceipt = async (booking) => {
    try {
        const mailOptions = {
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
        };

        await transporter.sendMail(mailOptions);
        console.log("Payment receipt email sent to", booking.guestEmail);
    } catch (error) {
        console.error("Error sending payment receipt email:", error);
    }
};

// Send Review Reminder Email
exports.sendReviewReminderEmail = async (userEmail, bookingDetails) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: "Share Your Review - Hotel Booking System",
            html: `
                <h2>How Was Your Stay?</h2>
                <p>Dear Guest,</p>
                <p>We hope you had a wonderful experience during your stay with us!</p>
                <p>We would love to hear your feedback. Your review helps us improve our services and assists other guests in making the right choice.</p>
                <p>Please click the link below to share your experience:</p>
                <p><a href="${process.env.FRONTEND_URL}/reviews/${bookingDetails.bookingId}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Write Your Review</a></p>
                <p>Thank you for choosing us!</p>
                <p>Best regards,<br>Hotel Booking Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("Review reminder email sent to", userEmail);
    } catch (error) {
        console.error("Error sending review reminder email:", error);
    }
};

// Send Offer Notification Email
exports.sendOfferNotificationEmail = async (userEmail, offerDetails) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Special Offer: ${offerDetails.title} - Hotel Booking System`,
            html: `
                <h2>${offerDetails.title}</h2>
                <p>Dear Guest,</p>
                <p>We have an exclusive offer just for you!</p>
                <h3>Offer Details:</h3>
                <ul>
                    <li><strong>Title:</strong> ${offerDetails.title}</li>
                    <li><strong>Discount:</strong> ${offerDetails.discount}${offerDetails.discountType === "percentage" ? "%" : "$"}</li>
                    <li><strong>Code:</strong> <strong>${offerDetails.code}</strong></li>
                    <li><strong>Valid Till:</strong> ${new Date(offerDetails.validTill).toLocaleDateString()}</li>
                </ul>
                <p>${offerDetails.description}</p>
                <p><a href="${process.env.FRONTEND_URL}/rooms" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Book Now</a></p>
                <p>Use code <strong>${offerDetails.code}</strong> at checkout to claim this offer.</p>
                <p>Best regards,<br>Hotel Booking Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("Offer notification email sent to", userEmail);
    } catch (error) {
        console.error("Error sending offer notification email:", error);
    }
};

// Send Upgrade Reminder Email
exports.sendUpgradeReminderEmail = async (userEmail, roomName) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: "Room Upgrade Available - Hotel Booking System",
            html: `
                <h2>Room Upgrade Available!</h2>
                <p>Dear Guest,</p>
                <p>We noticed you're interested in our ${roomName}. It's now available!</p>
                <p>Would you like to upgrade your booking?</p>
                <p><a href="${process.env.FRONTEND_URL}/rooms" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Check Availability</a></p>
                <p>Best regards,<br>Hotel Booking Team</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("Upgrade reminder email sent to", userEmail);
    } catch (error) {
        console.error("Error sending upgrade reminder email:", error);
    }
};

// Send Review Approval Notification Email
exports.sendReviewApprovalEmail = async (userEmail, userName, roomName, reviewComment) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Validate email address
            if (!userEmail || !userEmail.includes('@')) {
                throw new Error(`Invalid email address: ${userEmail}`);
            }
            
            if (!userName || !roomName) {
                throw new Error("Missing user name or room name");
            }

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: "Your Review Has Been Approved! - Hotel Booking System",
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #28a745;">Review Approved ✓</h2>
                        <p>Dear <strong>${userName}</strong>,</p>
                        <p>Great news! Your review has been approved by our admin team and is now visible to other guests.</p>
                        <h3>Review Details:</h3>
                        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                            <ul style="list-style: none; padding: 0;">
                                <li style="margin-bottom: 10px;"><strong>Room:</strong> ${roomName}</li>
                                <li style="margin-bottom: 10px;"><strong>Your Review:</strong> "${reviewComment.substring(0, 100)}${reviewComment.length > 100 ? '...' : ''}"</li>
                                <li><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✓ Approved</span></li>
                            </ul>
                        </div>
                        <p>Thank you for sharing your valuable feedback! This helps other guests make informed decisions and helps us improve our services.</p>
                        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/rooms" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View All Rooms</a></p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">Best regards,<br><strong>Hotel Booking Team</strong></p>
                    </div>
                `
            };

            // Send email with retry logic
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending review approval email to", userEmail, ":", error);
                    reject(error);
                } else {
                    console.log("✓ Review approval notification email sent successfully to", userEmail, "Response:", info.response);
                    resolve(info);
                }
            });
        } catch (error) {
            console.error("Error in sendReviewApprovalEmail:", error.message);
            reject(error);
        }
    });
};

// ================== GENERIC EMAIL ==================
exports.sendEmail = async (to, subject, text) => {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text
    });
};

// preserve the generic helper in the export object as well,
// but do not override the other named functions above.
exports.sendEmail = sendEmail;

// Send Custom Email with Subject and HTML
exports.sendCustomEmail = async (options) => {
    try {
        const { to, subject, html } = options;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        };
        await transporter.sendMail(mailOptions);
        console.log("Custom email sent to", to);
    } catch (error) {
        console.error("Error sending custom email:", error);
        throw error;
    }
};
