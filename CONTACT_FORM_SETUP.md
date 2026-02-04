# Contact Form Setup - Quick Guide

The contact form is configured to send emails to **vasilisginos@gmail.com**.

## Setup Steps (2 minutes):

1. **Go to Formspree**: https://formspree.io/
   - Click "Sign Up" (free account)
   - Verify your email

2. **Create a New Form**:
   - After logging in, click "New Form"
   - Form name: "ArtZi Contact Form"
   - Email: **vasilisginos@gmail.com** (already configured)
   - Click "Create Form"

3. **Get Your Form ID**:
   - After creating the form, you'll see a URL like:
     `https://formspree.io/f/xrgkqyzw`
   - Copy the part after `/f/` (e.g., `xrgkqyzw`)
   - This is your Form ID

4. **Update the HTML Files**:
   - Open `contact.html`
   - Find this line (around line 52):
     ```html
     <form class="contact-form" id="contact-form-gr" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
     ```
   - Replace `YOUR_FORM_ID` with your actual Form ID
   
   - Open `en/contact.html`
   - Find the same line and replace `YOUR_FORM_ID` with your Form ID

5. **Test It!**:
   - Fill out the form on your website
   - Submit it
   - Check vasilisginos@gmail.com for the email!

## That's it! 

The form will now send all submissions directly to **vasilisginos@gmail.com**.

## Free Plan Limits:
- 50 submissions per month (free)
- Upgrade available if you need more

## Troubleshooting:
- If emails don't arrive, check your spam folder
- Make sure you verified your Formspree email
- Check that the Form ID is correct in both HTML files
