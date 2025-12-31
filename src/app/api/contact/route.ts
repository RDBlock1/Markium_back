import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import * as z from "zod"

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Define the same schema as in the frontend for validation
const contactFormSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .min(5, { message: "Email must be at least 5 characters." }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters." })
    .max(500, { message: "Message must not exceed 500 characters." }),
})

// Email template component
const EmailTemplate = ({
  email,
  message,
}: {
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
            color: #e5e5e5;
            background-color: #000000;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
            color: #000000;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #18181b;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .field {
            margin-bottom: 20px;
            background: #27272a;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #06b6d4;
          }
          .label {
            font-weight: 600;
            color: #22d3ee;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .value {
            color: #e5e5e5;
            font-size: 16px;
          }
          .message-field {
            background: #27272a;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #06b6d4;
            white-space: pre-wrap;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #71717a;
            font-size: 14px;
          }
          a {
            color: #22d3ee;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">New Contact Form Submission</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">From markiumpro.com</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Email Address</div>
            <div class="value">
              <a href="mailto:${email}" style="color: #22d3ee; text-decoration: none;">
                ${email}
              </a>
            </div>
          </div>
          
          <div class="field">
            <div class="label">Message</div>
            <div style="color: #22d3ee; text-decoration: none;">${message}</div>
          </div>
        </div>
        <div class="footer">
          <p>This email was sent from the markiumpro.com contact form.</p>
          <p style="margin-top: 10px;">
            <strong>Reply directly to:</strong> 
            <a href="mailto:${email}" style="color: #22d3ee;">${email}</a>
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
        to: 'info@markiumpro.com',
      replyTo: validatedData.email,
      subject: `New Contact Form Submission from markiumpro.com`,
      html: EmailTemplate(validatedData),
      text: `
        New Contact Form Submission from markiumpro.com
        
        Email: ${validatedData.email}
        Message: ${validatedData.message}
      `,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email sent successfully",
        id: data?.id,
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data", details: error }, { status: 400 })
    }

    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Prevent GET requests
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
