import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string
from datetime import datetime, timedelta
from app.core.config import settings

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(to_email: str, otp_code: str, user_name: str):
    if not settings.SMTP_SERVER or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("SMTP credentials not configured. Skipping email send.")
        return False
        
    subject = "Action Required: Verify Your Login - Right Move CRM"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #2563eb;">Welcome to Right Move CRM</h2>
        <p>Dear {user_name},</p>
        <p>As this is your first time logging in, or you have requested a password reset, you must set a new password to secure your account.</p>
        <p>Your One-Time Password (OTP) for verification is:</p>
        <h1 style="background-color: #f3f4f6; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 5px; color: #1e3a8a;">{otp_code}</h1>
        <p><i>This OTP is valid for 10 minutes. Do not share this code with anyone.</i></p>
        <br>
        <p>Best regards,<br>Right Move Administrator</p>
    </body>
    </html>
    """
    
    msg = MIMEMultipart("alternative")
    msg['Subject'] = subject
    msg['From'] = f"Right Move CRM <{settings.SMTP_USER}>"
    msg['To'] = to_email
    
    part = MIMEText(html_content, 'html')
    msg.attach(part)
    
    try:
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
