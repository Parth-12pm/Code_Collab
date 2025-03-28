"use client";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { FiMail, FiUser, FiPhone, FiInfo, FiPenTool, FiSend, FiGithub, FiTwitter, FiLinkedin, FiInstagram } from "react-icons/fi";

const Footer = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    console.log("Form Submitted: ", data);
    reset();
  };

  return (
    <section id="foot" className="relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[size:40px_40px]"></div>
      </div>
      
      <footer className="relative py-16 px-6 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-7xl mx-auto">
          {/* Contact header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-gray-800 mb-4">
              <FiMail className="text-cyan-400 text-xl" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Let's <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Collaborate</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
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
                  <div className="mt-1 text-cyan-400">
                    <FiMail className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Email</h3>
                    <a href="mailto:support@codecollab.dev" className="text-gray-400 hover:text-cyan-400 transition-colors">
                      support@codecollab.dev
                    </a>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-800">
                  <h3 className="text-white font-medium mb-4">Follow Us</h3>
                  <div className="flex gap-4">
                    {[
                      { icon: <FiGithub />, label: "GitHub" },
                      { icon: <FiTwitter />, label: "Twitter" },
                      { icon: <FiLinkedin />, label: "LinkedIn" },
                      { icon: <FiInstagram />, label: "Instagram" }
                    ].map((social, i) => (
                      <motion.a
                        key={i}
                        href="#"
                        whileHover={{ y: -3 }}
                        className="text-gray-400 hover:text-cyan-400 transition-colors p-2 rounded-full bg-gray-800"
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
              className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700"
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="flex items-center border-b border-gray-700 pb-2">
                      <FiUser className="text-gray-500 mr-2" />
                      <input
                        {...register("name", { required: "Name is required" })}
                        placeholder="Your Name"
                        className="bg-transparent outline-none text-white w-full placeholder-gray-500"
                      />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message?.toString()}</p>}
                  </div>

                  <div>
                    <div className="flex items-center border-b border-gray-700 pb-2">
                      <FiMail className="text-gray-500 mr-2" />
                      <input
                        {...register("email", { required: "Email is required" })}
                        placeholder="Email Address"
                        className="bg-transparent outline-none text-white w-full placeholder-gray-500"
                      />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message?.toString()}</p>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center border-b border-gray-700 pb-2">
                    <FiPhone className="text-gray-500 mr-2" />
                    <input
                      {...register("phone")}
                      placeholder="Phone (Optional)"
                      className="bg-transparent outline-none text-white w-full placeholder-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center border-b border-gray-700 pb-2">
                    <FiInfo className="text-gray-500 mr-2" />
                    <input
                      {...register("subject", { required: "Subject is required" })}
                      placeholder="Subject"
                      className="bg-transparent outline-none text-white w-full placeholder-gray-500"
                    />
                  </div>
                  {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject.message?.toString()}</p>}
                </div>

                <div>
                  <div className="flex items-start border-b border-gray-700 pb-2">
                    <FiPenTool className="text-gray-500 mr-2 mt-2" />
                    <textarea
                      {...register("message", { required: "Message is required" })}
                      placeholder="Your message..."
                      className="bg-transparent outline-none text-white w-full h-24 placeholder-gray-500 resize-none"
                    />
                  </div>
                  {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message.message?.toString()}</p>}
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="consent"
                    {...register("consent", { required: "Consent is required" })}
                    className="mt-1 mr-2"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-400">
                    I agree to the <a href="#" className="text-cyan-400 hover:underline">privacy policy</a>
                  </label>
                </div>
                {errors.consent && <p className="text-red-400 text-xs mt-1">{errors.consent.message?.toString()}</p>}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
                >
                  <FiSend /> Send Message
                </motion.button>
              </form>
            </motion.div>
          </div>

          {/* Footer bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center"
          >
            <div className="flex items-center gap-2 text-gray-500 mb-4 md:mb-0">
              <span className="text-sm">© {new Date().getFullYear()} CodeCollab</span>
              <span className="hidden md:block">•</span>
              <a href="#" className="text-sm hover:text-cyan-400 transition-colors">Terms</a>
              <span>•</span>
              <a href="#" className="text-sm hover:text-cyan-400 transition-colors">Privacy</a>
            </div>
            <p className="text-sm text-gray-500">
              Made with ❤️ for developers
            </p>
          </motion.div>
        </div>
      </footer>
    </section>
  );
};

export default Footer;