const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.username = user.username;
        this.from = `LDK Library Management System<${process.env.EMAIL_FROM}>`;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
    }


    newTransport() {
        // If in production, create sendgrid transporter
        if (process.env.NODE_ENV === 'production') {
            // return sendGrid transporter
            return nodemailer.createTransport(
                {
                    host: 'in-v3.mailjet.com',
                    port: 25,
                    auth: {
                        user: process.env.MAILJET_USERNAME,
                        password: process.env.MAILJET_SECRET_KEY
                    }
                }
            )
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async send(template, subject) {
        // render template
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,
            {
                firstName: this.firstName,
                url: this.url,
                subject,
                username: this.username,
                resourceUrl: this.url,
                loginUrl: this.url
            }
        );


        // mail options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText(html)
        }

        // Create a transport and send an email
        await this.newTransport().sendMail(mailOptions)
    }

    async sendWelcome() {
        await this.send("welcome", "Welcome to Lycee De Kigali Management System");
    }

    async sendPasswordReset() {
        await this.send("passwordReset", 'Your Password Reset Token')
    }
}

