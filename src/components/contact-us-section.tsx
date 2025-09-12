"use client"

import type React from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Mail, Send, ArrowRight, TrendingUp, BarChart3, Globe, Users, Loader2 } from "lucide-react"
import {toast} from 'sonner'

// Define the form schema with zod
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

type ContactFormValues = z.infer<typeof contactFormSchema>

export function ContactUsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize the form with react-hook-form and zod
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
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
        toast.success(
          "Message sent successfully!",
          {
            description: "We'll get back to you within 24 hours.",
          }
        )
        form.reset()
      } else {
        throw new Error(result.error || "Failed to send message")
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Side - Company Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold text-balance mb-6 leading-tight">
                <span className=" text-emerald-400 ">
                  Markium
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8">
                The future of financial markets is here. Experience next-generation trading with
                <span className="text-emerald-400 font-semibold"> cutting-edge technology</span> and
                <span className="text-emerald-400 font-semibold"> innovative market solutions</span>.
              </p>
            </div>

            {/* Market Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 hover:border-accent/50 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-400 mb-2">Prediction Markets</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Trade on future events with our advanced prediction market platform. Leverage collective
                    intelligence and market dynamics to forecast outcomes.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 hover:border-accent/50 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-400 mb-2">Pre-IPO Markets</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Access exclusive pre-IPO investment opportunities before they hit public markets. Get early access
                    to high-growth companies and emerging market leaders.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 hover:border-accent/50 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-400 mb-2">Global Markets</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Trade across international markets with real-time data, advanced analytics, and seamless
                    cross-border transactions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 hover:border-accent/50 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-400 mb-2">Community Driven</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Join a thriving community of traders, analysts, and market enthusiasts. Share insights, strategies,
                    and market intelligence.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="lg:sticky lg:top-24">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
              <CardHeader className="text-center pb-8">
                <div className="inline-flex items-center justify-center w-16 h-16  rounded-2xl mx-auto mb-6">
                  <Send className="w-8 h-8 text-emerald-400" />
                </div>
                <CardTitle className="text-3xl font-bold mb-4">
                  Get in <span className="text-emerald-400">Touch</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  Ready to explore the future of trading? Let's discuss how
                  <span className="text-emerald-400 font-semibold"> Markium</span> can transform your investment strategy.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-foreground">
                            Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your full name"
                              className="bg-input/50 border-border/50 focus:border-accent focus:ring-accent/20 h-12 text-base transition-all duration-200"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-foreground">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your@email.com"
                              className="bg-input/50 border-border/50 focus:border-accent focus:ring-accent/20 h-12 text-base transition-all duration-200"
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
                          <FormLabel className="text-base font-semibold text-foreground">
                            Message
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your trading goals and how we can help..."
                              rows={6}
                              className="bg-input/50 border-border/50 focus:border-accent focus:ring-accent/20 resize-none text-base transition-all duration-200"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value.length}/500 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-emerald-500 py-4 text-lg font-semibold group"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-6 h-6 mr-3 group-hover:rotate-45 transition-transform duration-200" />
                          Send Message
                          <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Contact Info */}
                <div className="mt-8 pt-8 border-t border-border/50">
                  <div className="text-center space-y-4">
                    <h4 className="text-lg font-semibold text-emerald-400">Direct Contact</h4>
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        <Mail className="w-4 h-4 inline mr-2 text-emerald-400" />
 info@markiumpro.com
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Response within <span className="text-emerald-400 font-semibold">24 hours</span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm mt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-accent">Markium</span>
              </span>
            </div>
            <p className="text-muted-foreground">
              &copy; 2025 Markium. All rights reserved. The future of
              <span className="text-accent font-semibold"> financial markets</span>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}