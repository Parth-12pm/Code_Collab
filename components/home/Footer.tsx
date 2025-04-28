"use client"
import { useForm } from "react-hook-form"
import { motion } from "framer-motion"
import { Mail, User, Phone, Info, PenTool, Send, Github, Twitter, Linkedin, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const Footer = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const onSubmit = (data: any) => {
    console.log("Form Submitted: ", data)
    reset()
  }

  return (
    <section id="foot" className="relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[size:40px_40px]"></div>
      </div>

      <footer className="relative py-16 bg-muted/30">
        <div className="container">
          {/* Contact header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
              <Mail className="text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Let's{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
                Collaborate
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions? Our team will respond within 24 hours.
            </p>
          </motion.div>

          {/* Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact methods */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <a
                      href="mailto:support@codecollab.dev"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      support@codecollab.dev
                    </a>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="font-medium mb-4">Follow Us</h3>
                  <div className="flex gap-4">
                    {[
                      { icon: <Github className="h-4 w-4" />, label: "GitHub" },
                      { icon: <Twitter className="h-4 w-4" />, label: "Twitter" },
                      { icon: <Linkedin className="h-4 w-4" />, label: "LinkedIn" },
                      { icon: <Instagram className="h-4 w-4" />, label: "Instagram" },
                    ].map((social, i) => (
                      <motion.a
                        key={i}
                        href="#"
                        whileHover={{ y: -3 }}
                        className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full bg-muted"
                        aria-label={social.label}
                      >
                        {social.icon}
                      </motion.a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            {...register("name", { required: "Name is required" })}
                            placeholder="Your Name"
                            className="pl-10"
                          />
                        </div>
                        {errors.name && (
                          <p className="text-destructive text-xs mt-1">{errors.name.message?.toString()}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            {...register("email", { required: "Email is required" })}
                            placeholder="Email Address"
                            className="pl-10"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-destructive text-xs mt-1">{errors.email.message?.toString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="phone" {...register("phone")} placeholder="Phone Number" className="pl-10" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <div className="relative">
                        <Info className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="subject"
                          {...register("subject", { required: "Subject is required" })}
                          placeholder="Subject"
                          className="pl-10"
                        />
                      </div>
                      {errors.subject && (
                        <p className="text-destructive text-xs mt-1">{errors.subject.message?.toString()}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <div className="relative">
                        <PenTool className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea
                          id="message"
                          {...register("message", { required: "Message is required" })}
                          placeholder="Your message..."
                          className="pl-10 min-h-[120px]"
                        />
                      </div>
                      {errors.message && (
                        <p className="text-destructive text-xs mt-1">{errors.message.message?.toString()}</p>
                      )}
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox id="consent" {...register("consent", { required: "Consent is required" })} />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="consent"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I agree to the{" "}
                          <a href="#" className="text-primary hover:underline">
                            privacy policy
                          </a>
                        </Label>
                        {errors.consent && (
                          <p className="text-destructive text-xs">{errors.consent.message?.toString()}</p>
                        )}
                      </div>
                    </div>

                    <Button type="submit" className="w-full gap-2">
                      <Send className="h-4 w-4" /> Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Footer bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="border-t mt-16 pt-8 flex flex-col md:flex-row justify-between items-center"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-4 md:mb-0">
              <span className="text-sm">© {new Date().getFullYear()} CodeCollab</span>
              <span className="hidden md:block">•</span>
              <a href="#" className="text-sm hover:text-primary transition-colors">
                Terms
              </a>
              <span>•</span>
              <a href="#" className="text-sm hover:text-primary transition-colors">
                Privacy
              </a>
            </div>
          </motion.div>
        </div>
      </footer>
    </section>
  )
}

export default Footer
