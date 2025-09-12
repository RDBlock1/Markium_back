// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import * as z from 'zod'

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Define the same schema as in the frontend for validation
const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(50, { message: "Name must not exceed 50 characters." }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .min(5, { message: "Email must be at least 5 characters." }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters." })
    .max(500, { message: "Message must not exceed 500 characters." }),
})

// Email template component (optional - you can also use plain HTML)
const EmailTemplate = ({
  name,
  email,
  message,
}: {
  name: string
  email: string
  message: string
}) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .field {
            margin-bottom: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
          }
          .label {
            font-weight: 600;
            color: #6b7280;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .value {
            color: #111827;
            font-size: 16px;
          }
          .message-field {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            white-space: pre-wrap;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">New Contact Form Submission</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">From Makrium Website</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Name</div>
            <div class="value">${name}</div>
          </div>
          
          <div class="field">
            <div class="label">Email</div>
            <div class="value">
              <a href="mailto:${email}" style="color: #10b981; text-decoration: none;">
                ${email}
              </a>
            </div>
          </div>
          
          <div class="field">
            <div class="label">Message</div>
            <div class="message-field">${message}</div>
          </div>
        </div>
        <div class="footer">
          <p>This email was sent from the Makrium contact form.</p>
          <p style="margin-top: 10px;">
            <strong>Reply directly to:</strong> 
            <a href="mailto:${email}" style="color: #10b981;">${email}</a>
          </p>
        </div>
      </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()

    // Validate the request body
    const validatedData = contactFormSchema.parse(body)

    // Send email using Resend
    const { data, error } = await resend.emails.send({
        from: 'no-reply@markiumpro.com',
        to: 'rugdetectives@gmail.com',
      replyTo: validatedData.email,
      subject: `New Contact Form Submission from ${validatedData.name}`,
      html: EmailTemplate(validatedData),
      text: `
        New Contact Form Submission
        
        Name: ${validatedData.name}
        Email: ${validatedData.email}
        Message: ${validatedData.message}
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Optional: Send auto-reply to the user
    await resend.emails.send({
      from: 'Makrium <noreply@makrium.com>', // Replace with your verified domain
      to: [validatedData.email],
      subject: 'Thank you for contacting Makrium',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                padding: 30px 0;
                border-bottom: 2px solid #10b981;
              }
              .content {
                padding: 30px 0;
              }
              .button {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="color: #10b981; margin: 0;">Thank You for Contacting Makrium</h1>
            </div>
            <div class="content">
              <p>Dear ${validatedData.name},</p>
              
              <p>Thank you for reaching out to us. We've received your message and appreciate your interest in Makrium.</p>
              
              <p>Our team will review your message and get back to you within 24 hours. We're excited to discuss how Makrium can transform your investment strategy with our cutting-edge trading technology.</p>
              
              <p>In the meantime, feel free to explore our platform and learn more about our:</p>
              <ul>
                <li>Prediction Markets</li>
                <li>Pre-IPO Investment Opportunities</li>
                <li>Global Market Access</li>
                <li>Community-Driven Insights</li>
              </ul>
              
              <p>Best regards,<br>
              The Makrium Team</p>
            </div>
          </body>
        </html>
      `,
      text: `
        Dear ${validatedData.name},
        
        Thank you for reaching out to us. We've received your message and appreciate your interest in Makrium.
        
        Our team will review your message and get back to you within 24 hours.
        
        Best regards,
        The Makrium Team
      `,
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email sent successfully',
        id: data?.id 
      },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Optional: Add rate limiting
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}