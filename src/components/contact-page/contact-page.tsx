"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Mail, Send, ArrowRight, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Define the form schema with zod
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

type ContactFormValues = z.infer<typeof contactFormSchema>

export default function ContactPageComponent() {
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Initialize the form with react-hook-form and zod
    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            email: "",
            message: "",
        },
    })

    const onSubmit = async (data: ContactFormValues) => {
        setIsSubmitting(true)

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (response.ok) {
                toast.success("Message sent successfully!", {
                    description: "We'll get back to you soon.",
                })
                form.reset()
            } else {
                throw new Error(result.error || "Failed to send message")
            }
        } catch (error) {
            toast.error("Error", {
                description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-black">
            <main className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start max-w-7xl mx-auto">
                    {/* Left Side - Company Information */}
                    <div className="space-y-6 md:space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance mb-4 md:mb-6 leading-tight">
                                <span className="text-cyan-400">Contact Us</span>
                            </h1>
                            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed mb-6 md:mb-8">
                                Have questions or need support? We&rsquo;re here to help you with
                                <span className="text-cyan-400 font-semibold"> markiumpro.com</span>.
                            </p>
                        </div>

                        {/* Info Cards */}
                        <div className="space-y-4 md:space-y-6">
                            <div className="flex items-start space-x-4 p-4 md:p-6 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 hover:border-cyan-400/50 transition-all duration-300">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-cyan-400 mb-2">Quick Response</h3>
                                    <p className="text-sm md:text-base text-gray-400 leading-relaxed">
                                        We typically respond to all inquiries within 24-48 hours. Your message is important to us.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4 p-4 md:p-6 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800 hover:border-cyan-400/50 transition-all duration-300">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-cyan-400 mb-2">Direct Email</h3>
                                    <p className="text-sm md:text-base text-gray-400 leading-relaxed mb-2">
                                        Prefer email? You can reach us directly at:
                                    </p>
                                    <a
                                        href="mailto:info@markiumpro.com"
                                        className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm md:text-base font-medium"
                                    >
                                
                                    info@markiumpro.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="p-4 md:p-6 bg-gradient-to-br from-cyan-400/5 to-cyan-400/10 rounded-xl border border-cyan-400/20">
                            <h3 className="text-lg md:text-xl font-bold text-white mb-3">What to Include</h3>
                            <ul className="space-y-2 text-sm md:text-base text-gray-300">
                                <li className="flex items-start">
                                    <span className="text-cyan-400 mr-2">•</span>
                                    <span>Your email address for follow-up</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-cyan-400 mr-2">•</span>
                                    <span>Detailed description of your question or issue</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-cyan-400 mr-2">•</span>
                                    <span>Any relevant information that can help us assist you better</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Side - Contact Form */}
                    <div className="lg:sticky lg:top-24">
                        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-2xl">
                            <CardHeader className="text-center pb-6 md:pb-8 px-4 md:px-6">
                                <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-cyan-400/10 rounded-2xl mx-auto mb-4 md:mb-6">
                                    <Send className="w-7 h-7 md:w-8 md:h-8 text-cyan-400" />
                                </div>
                                <CardTitle className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-white">
                                    Send us a <span className="text-cyan-400">Message</span>
                                </CardTitle>
                                <CardDescription className="text-base md:text-lg text-gray-400">
                                    Fill out the form below and we&rsquo;ll get back to you as soon as possible.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6 lg:p-8">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm md:text-base font-semibold text-white">Email Address</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="your@email.com"
                                                            className="bg-zinc-800/50 border-zinc-700 focus:border-cyan-400 focus:ring-cyan-400/20 h-11 md:h-12 text-sm md:text-base text-white placeholder:text-gray-500 transition-all duration-200"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="message"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm md:text-base font-semibold text-white">Your Message</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Tell us what's on your mind..."
                                                            rows={6}
                                                            className="bg-zinc-800/50 border-zinc-700 focus:border-cyan-400 focus:ring-cyan-400/20 resize-none text-sm md:text-base text-white placeholder:text-gray-500 transition-all duration-200"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <div className="text-xs md:text-sm text-gray-500 mt-2">
                                                        {field.value.length}/500 characters
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-cyan-400 hover:bg-cyan-500 text-black py-5 md:py-6 text-base md:text-lg font-semibold group transition-all duration-200 h-auto"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 group-hover:rotate-45 transition-transform duration-200" />
                                                    Send Message
                                                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 md:ml-3 group-hover:translate-x-1 transition-transform duration-200" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </Form>

                                {/* Privacy Notice */}
                                <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-zinc-800">
                                    <p className="text-xs md:text-sm text-center text-gray-500">
                                        By submitting this form, you agree to our privacy policy. We&rsquo;ll only use your email to respond to
                                        your inquiry.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

          
        </div>
    )
}
