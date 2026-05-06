"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export function Features() {
  return (
    <section id="features" className="py-12 md:py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="text-sm font-bold uppercase tracking-widest text-[#316DFF]">
            <span className="mr-1.5 text-[#316DFF]">•</span>
            Our Feature
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#161A2D]">
            Modern dentistry focused on your comfort and care
          </h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-[#316DFF] text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-[#2457dc] transition-colors"
          >
            Make an Appointment
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid lg:grid-cols-[0.9fr_2.1fr_0.9fr] gap-4 items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            className="bg-[#316DFF] p-8 lg:p-10 rounded-[28px] text-white flex flex-col justify-end gap-6 min-h-[250px] lg:min-h-[430px] relative overflow-hidden group"
          >
            <img
              src="/landing-2/wp-content/uploads/2025/11/feature-item-bg-image-1.png" 
              alt="Dental mascot"
              className="absolute top-0 right-0 left-0 w-120 h-auto opacity-95"
            />
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="70" height="72" viewBox="0 0 70 72" fill="currentColor"><path d="M16.1899 4.02294C18.1492 1.94125 20.7285 1.19844 22.8179 1.62938C23.8645 1.84533 24.8237 2.36767 25.4702 3.20946C26.1283 4.0664 26.3956 5.17073 26.1909 6.39891C25.883 8.24705 25.9659 10.46 27.0796 12.1772C28.1496 13.8269 30.3378 15.2651 34.8003 15.2651C35.3524 15.2653 35.8002 15.713 35.8003 16.2651C35.8003 16.8173 35.3524 17.265 34.8003 17.2651C29.886 17.2651 26.9487 15.6507 25.4019 13.2661C23.8991 10.9493 23.8722 8.14665 24.2183 6.06981C24.3406 5.33552 24.1724 4.80359 23.8833 4.42723C23.5827 4.03602 23.0838 3.72664 22.4136 3.58837C21.0684 3.31091 19.1768 3.76857 17.647 5.39403C15.8276 7.32715 13.1667 9.42149 10.2095 10.8433C7.76946 12.0163 5.03933 12.7701 2.37744 12.5102C3.32173 15.1436 5.46088 17.6863 8.4624 19.9038C11.4476 22.1091 15.21 23.9312 19.2651 25.1509C19.4692 24.2262 19.8256 23.3573 20.3608 22.6099C21.3087 21.2861 22.764 20.4181 24.6812 20.2847C26.5282 20.1026 28.049 20.571 29.062 21.48C30.0764 22.3902 30.5239 23.7068 30.2104 24.9809C29.8948 26.2635 28.8601 27.3146 27.2954 27.8403C25.7524 28.3587 23.6756 28.3832 21.0698 27.7095C21.2361 30.391 22.6135 33.2872 24.8823 34.8374C27.483 36.4997 29.9212 37.2761 31.7007 37.6372C32.5913 37.8179 33.3154 37.8947 33.8101 37.9263C34.0571 37.942 34.2469 37.946 34.3706 37.9468C34.4325 37.9471 34.4784 37.9464 34.5063 37.9458C34.5201 37.9455 34.5296 37.945 34.5347 37.9448H34.5366L34.6382 37.9458C35.1445 37.9738 35.557 38.3815 35.5806 38.8989C35.6056 39.4505 35.179 39.9176 34.6274 39.9429L34.5815 38.9438C34.6237 39.8706 34.6266 39.938 34.6265 39.9429H34.6255L34.6235 39.9438H34.6011C34.5878 39.9443 34.5697 39.9453 34.5474 39.9458C34.5023 39.9467 34.4389 39.9472 34.3589 39.9468C34.199 39.9458 33.9708 39.9397 33.6831 39.9214C33.108 39.8847 32.2927 39.7979 31.3032 39.5972C29.3235 39.1955 26.6406 38.3373 23.7935 36.5151C23.7857 36.5102 23.7776 36.5056 23.77 36.5005C20.7279 34.4317 19.083 30.6086 19.0532 27.2593C19.053 27.2313 19.0532 27.2032 19.0532 27.1753C14.6662 25.8983 10.5558 23.9377 7.27392 21.5132C3.51647 18.7373 0.736328 15.27 0.0170888 11.4341C-0.0461336 11.0962 0.0684899 10.7495 0.3208 10.5161C0.573132 10.2828 0.92742 10.1954 1.25928 10.2847C3.76969 10.9605 6.61776 10.3509 9.34326 9.04052C12.0557 7.73646 14.5203 5.79693 16.1899 4.02294ZM27.7261 22.9683C27.2147 22.5096 26.2867 22.1341 24.8687 22.2759C24.8577 22.277 24.8464 22.2781 24.8354 22.2788C23.492 22.3684 22.5824 22.9423 21.9868 23.7739C21.6143 24.2941 21.3477 24.9423 21.1968 25.6802C21.302 25.7062 21.4067 25.734 21.5122 25.7593C21.5187 25.7608 21.5253 25.7625 21.5317 25.7641C23.9218 26.3876 25.5932 26.3027 26.6587 25.9448C27.7104 25.5914 28.1476 24.9926 28.2681 24.5034C28.3905 24.0059 28.238 23.4276 27.7261 22.9683Z"></path><path d="M39.2529 6.2334C39.2529 3.8953 37.3568 2 35.0186 2C32.6805 2.00011 30.7852 3.89535 30.7852 6.2334C30.7852 8.57144 32.6805 10.4667 35.0186 10.4668C37.3568 10.4668 39.2529 8.57149 39.2529 6.2334ZM41.2529 6.2334C41.2529 9.67621 38.4613 12.4668 35.0186 12.4668C31.576 12.4667 28.7852 9.67613 28.7852 6.2334C28.7852 2.79068 31.576 0.000108225 35.0186 0C38.4613 0 41.2529 2.7906 41.2529 6.2334Z"></path><path d="M34.0195 71V11.4668C34.0195 10.9145 34.4672 10.4668 35.0195 10.4668C35.5718 10.4668 36.0195 10.9145 36.0195 11.4668V71C36.0195 71.5523 35.5718 72 35.0195 72C34.4672 72 34.0195 71.5523 34.0195 71Z"></path><path d="M44.4854 46.1406C44.4853 44.5039 43.5502 42.9243 41.8418 41.7139C40.1357 40.5051 37.7262 39.7257 35.0186 39.7256C32.3107 39.7256 29.9006 40.505 28.1943 41.7139C26.4859 42.9243 25.5508 44.5039 25.5508 46.1406C25.5508 47.7774 26.4857 49.3571 28.1943 50.5674C29.9006 51.7759 32.3107 52.5547 35.0186 52.5547C37.7263 52.5546 40.1357 51.7759 41.8418 50.5674C43.5503 49.3571 44.4854 47.7774 44.4854 46.1406ZM46.4854 46.1406C46.4854 48.5985 45.0768 50.7261 42.9971 52.1992C40.9151 53.6739 38.0913 54.5546 35.0186 54.5547C31.9457 54.5547 29.1212 53.6739 27.0391 52.1992C24.9593 50.7261 23.5508 48.5986 23.5508 46.1406C23.5508 43.683 24.9587 41.5553 27.0381 40.082C29.1202 38.607 31.9455 37.7256 35.0186 37.7256C38.0914 37.7257 40.9151 38.6071 42.9971 40.082C45.0767 41.5554 46.4853 43.6828 46.4854 46.1406Z"></path><path d="M41.6514 59.0068C41.6514 57.9082 41.0299 56.8184 39.835 55.9648C38.642 55.1128 36.9426 54.5548 35.0195 54.5547C33.0963 54.5547 31.3962 55.1127 30.2031 55.9648C29.0082 56.8184 28.3867 57.9082 28.3867 59.0068C28.3869 60.1053 29.0084 61.1944 30.2031 62.0479C31.3962 62.9 33.0963 63.458 35.0195 63.458C36.9426 63.4579 38.642 62.8999 39.835 62.0479C41.0297 61.1944 41.6512 60.1054 41.6514 59.0068ZM43.6514 59.0068C43.6512 60.9189 42.5644 62.5553 40.9971 63.6748C39.4278 64.7957 37.3114 65.4579 35.0195 65.458C32.7275 65.458 30.6104 64.7958 29.041 63.6748C27.4738 62.5553 26.3869 60.9188 26.3867 59.0068C26.3867 57.0946 27.4736 55.4575 29.041 54.3379C30.6104 53.2169 32.7275 52.5547 35.0195 52.5547C37.3114 52.5548 39.4278 53.217 40.9971 54.3379C42.5645 55.4575 43.6514 57.0946 43.6514 59.0068Z"></path><path d="M17.3267 12.9161C17.7304 12.5395 18.363 12.5616 18.7398 12.965C19.1166 13.3687 19.0957 14.0022 18.692 14.379C16.9523 16.0027 14.6011 17.4308 12.1734 18.3448C9.76174 19.2528 7.15247 19.6979 4.92635 19.2032C4.38721 19.0834 4.04677 18.549 4.16658 18.0099C4.2865 17.4709 4.82093 17.1314 5.35994 17.2511C7.05893 17.6287 9.24714 17.3104 11.4693 16.4737C13.6755 15.6431 15.7954 14.3453 17.3267 12.9161Z"></path><path d="M20.1367 17.7382C20.5272 17.3477 21.1603 17.3477 21.5508 17.7382C21.9413 18.1287 21.9413 18.7617 21.5508 19.1523C20.7247 19.9783 19.1821 21.2323 17.3877 22.2577C15.619 23.2684 13.4455 24.1509 11.4043 24.0234C10.8532 23.9889 10.4345 23.5139 10.4688 22.9628C10.5032 22.4116 10.9781 21.9928 11.5293 22.0273C12.9772 22.1177 14.7297 21.4734 16.3955 20.5214C18.0356 19.5842 19.4363 18.4386 20.1367 17.7382Z"></path><path d="M47.002 1.62938C49.0913 1.19843 51.6697 1.94131 53.6289 4.02293C55.2985 5.79688 57.7632 7.73642 60.4756 9.04051C63.201 10.3508 66.0492 10.9604 68.5596 10.2847C68.8915 10.1953 69.2466 10.2827 69.499 10.5161C69.7513 10.7495 69.8659 11.0962 69.8027 11.4341C69.0835 15.2701 66.3025 18.7373 62.5449 21.5132C59.2629 23.9377 55.1527 25.8984 50.7656 27.1753C50.7656 27.2032 50.7668 27.2313 50.7666 27.2593C50.7369 30.6087 49.0911 34.4317 46.0488 36.5005C46.0412 36.5056 46.0331 36.5102 46.0254 36.5151C43.1783 38.3373 40.4963 39.1955 38.5166 39.5972C37.5267 39.798 36.7109 39.8847 36.1357 39.9214C35.8481 39.9397 35.6199 39.9458 35.46 39.9468C35.3803 39.9472 35.3174 39.9467 35.2725 39.9458C35.2502 39.9453 35.2321 39.9443 35.2188 39.9438H35.1963L35.1943 39.9429H35.1934C35.1932 39.9382 35.1951 39.872 35.2373 38.9438L35.1924 39.9429C34.6407 39.9178 34.2133 39.4506 34.2383 38.8989C34.2633 38.3478 34.7303 37.9207 35.2812 37.9448H35.2842C35.2893 37.945 35.2995 37.9455 35.3135 37.9458C35.3414 37.9464 35.3866 37.9471 35.4482 37.9468C35.572 37.946 35.7616 37.942 36.0088 37.9263C36.5035 37.8947 37.2282 37.818 38.1191 37.6372C39.8984 37.2762 42.3354 36.4992 44.9355 34.8374C47.205 33.2874 48.5817 30.3913 48.748 27.7095C46.1431 28.3827 44.0672 28.3585 42.5244 27.8403C40.9596 27.3146 39.9251 26.2635 39.6094 24.9809C39.2959 23.7069 39.7425 22.3902 40.7568 21.48C41.7658 20.5746 43.279 20.1065 45.1162 20.2827C45.1231 20.2832 45.1308 20.2832 45.1377 20.2837C45.1418 20.2841 45.1463 20.2852 45.1504 20.2856H45.1494C47.0609 20.4217 48.512 21.2888 49.458 22.6098C49.9931 23.3571 50.3496 24.2256 50.5537 25.1499C54.6089 23.9302 58.3712 22.1091 61.3564 19.9038C64.3581 17.6863 66.497 15.1436 67.4414 12.5102C64.7795 12.7699 62.0493 12.0163 59.6094 10.8432C56.6522 9.42156 53.9923 7.32708 52.1729 5.39403C50.6431 3.76864 48.7514 3.31102 47.4062 3.58836C46.7358 3.72666 46.2362 4.03583 45.9355 4.42723C45.6465 4.80358 45.4782 5.3355 45.6006 6.06981C45.9467 8.14665 45.9208 10.9492 44.418 13.2661C42.8712 15.6507 39.9339 17.2651 35.0195 17.2651C34.4672 17.2651 34.0195 16.8174 34.0195 16.2651C34.0196 15.7129 34.4673 15.2651 35.0195 15.2651C39.482 15.2651 41.6692 13.8269 42.7393 12.1772C43.8532 10.4599 43.9359 8.24715 43.6279 6.39891C43.4232 5.17065 43.6915 4.06642 44.3496 3.20946C44.9962 2.36755 45.9552 1.84528 47.002 1.62938ZM44.9512 22.2759C43.5327 22.134 42.6041 22.5094 42.0928 22.9682C41.5808 23.4276 41.4283 24.0059 41.5508 24.5034C41.6712 24.9926 42.1092 25.5914 43.1611 25.9448C44.2266 26.3027 45.8972 26.3876 48.2871 25.7641C48.2936 25.7624 48.3001 25.7608 48.3066 25.7593C48.4117 25.7341 48.5163 25.7061 48.6211 25.6802C48.4702 24.9425 48.2045 24.2941 47.832 23.7739C47.2365 22.9425 46.3275 22.3684 44.9844 22.2788C44.9734 22.2781 44.9621 22.277 44.9512 22.2759Z"></path><path d="M51.0775 12.9652C51.4543 12.5614 52.0878 12.5395 52.4915 12.9164C54.0228 14.3456 56.1427 15.6433 58.349 16.474C60.5711 17.3106 62.7594 17.6289 64.4583 17.2513C64.9972 17.1317 65.5308 17.4713 65.6507 18.0101C65.7705 18.5492 65.431 19.0836 64.8919 19.2035C62.6657 19.6982 60.0557 19.2531 57.6439 18.3451C55.2164 17.431 52.8659 16.0028 51.1263 14.3792C50.7226 14.0024 50.7007 13.3689 51.0775 12.9652Z"></path><path d="M48.2675 17.7382C48.658 17.3477 49.291 17.3477 49.6816 17.7382C50.382 18.4386 51.7828 19.5842 53.4228 20.5214C55.0886 21.4734 56.8411 22.1177 58.289 22.0273C58.8402 21.9928 59.3151 22.4116 59.3495 22.9628C59.3838 23.5138 58.965 23.9888 58.414 24.0234C56.3728 24.1509 54.1992 23.2685 52.4306 22.2577C50.6362 21.2323 49.0936 19.9783 48.2675 19.1523C47.877 18.7617 47.877 18.1287 48.2675 17.7382Z"></path></svg>
            </div>
            <div className="space-y-4 z-10">
              <h3 className="text-2xl font-black leading-tight">Experienced Dental Team</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Skilled professionals committed to gentle, personalized care.
              </p>
            </div>
            <div className="absolute -top-10 -right-12 w-44 h-44 border border-white/15 rounded-full blur-xl" />
            <div className="absolute -bottom-14 -left-8 w-52 h-52 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 lg:gap-5 items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              className="relative rounded-[24px] overflow-hidden group h-[500px] sm:h-[220px] lg:h-[280px]"
              style={{
                WebkitMaskImage: "url('/landing-2/wp-content/uploads/2025/09/feature-image-bg-shape.svg')",
                WebkitMaskSize: "100% 100%",
                WebkitMaskPosition: "center",
                WebkitMaskRepeat: "no-repeat",
                maskImage: "url('/landing-2/wp-content/uploads/2025/09/feature-image-bg-shape.svg')",
                maskSize: "100% 100%",
                maskPosition: "center",
                maskRepeat: "no-repeat",
              }}
            >
              <img
                src="/landing-2/wp-content/uploads/2025/11/about-us-image-2.jpg"
                alt="Doctor portrait"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161A2D] via-[#161A2D]/30 to-transparent opacity-90 z-20" />
              <div className="absolute bottom-10 md:bottom-4 left-10 md:left-4 right-10 md:right-4 space-y-2 z-30">
                <h3 className="text-lg font-bold text-white leading-tight">Committed to Long-Term Oral Health</h3>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              viewport={{ once: true, amount: 0.25 }}
              className="bg-[#EEF2FF] rounded-[24px] h-[200px] sm:h-[180px] lg:h-[180px] px-6 py-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-center -space-x-2.5 sm:pl-2">
                {[1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={`/landing-2/wp-content/uploads/2025/09/author-${i}.jpg`}
                    alt=""
                    className="h-15 w-15 md:h-6 md:w-6 rounded-full border-2 border-white object-cover shadow-sm sm:h-10 sm:w-10"
                  />
                ))}
                <div className="flex h-15 w-15 md:h-8 md:w-8 items-center justify-center rounded-full border-2 border-white bg-[#316DFF] text-sm font-black text-white shadow-sm sm:h-10 sm:w-10">
                  +
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-4xl font-black text-[#161A2D] leading-none">4k+</p>
                <p className="text-sm text-[#6B7280] mt-2">Patient Worldwide</p>
              </div>
              
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              viewport={{ once: true, amount: 0.25 }}
              className="relative rounded-[24px] overflow-hidden group h-[300px] sm:h-[220px] lg:h-[280px]"
            >
              <img
                src="/landing-2/wp-content/uploads/2025/11/about-us-image-2.jpg"
                alt="Emergency support"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161A2D] via-[#161A2D]/30 to-transparent opacity-90" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-4xl font-black text-white leading-none">24/7</h3>
                <p className="text-white/85 text-sm mt-1">Because your dental health can&apos;t wait.</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            className="bg-[#161A2D] p-8 lg:p-10 rounded-[28px] text-white flex flex-col justify-between min-h-[360px] lg:min-h-[430px] relative overflow-hidden group"
          >
            <img
              src="/landing-2/wp-content/uploads/2025/11/feature-item-bg-image-2.png" 
              alt="Dental mascot"
              className="absolute top-0 right-0 w-120 h-auto opacity-95"
            />
            <div className="space-y-4 z-10 ">
              <h3 className="text-2xl lg:text-2xl font-bold">
                Advanced Technologies for Comfortable Treatments
              </h3>
            </div>
            <img
              src="/landing-2/wp-content/uploads/2025/09/hero-character-img-2.png"
              alt="Dental mascot"
              className="absolute left-[22%] bottom-0 w-55 lg:w-60 h-auto opacity-95 transition-transform duration-500 group-hover:translate-y-1"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(49,109,255,.2),transparent_45%)]" />
          </motion.div>
        </div>

        <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-3 text-center text-[#6B7280] text-sm">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <img
                key={`bottom-avatar-${i}`}
                src={`/landing-2/wp-content/uploads/2025/09/author-${i}.jpg`}
                alt={`Member ${i}`}
                className="w-12 h-12 md:w-7 md:h-7 rounded-full border-2 border-white"
              />
            ))}
          </div>
          <p>Join us to build smarter, faster, and future-ready technology solutions.</p>
        </div>
      </div>
    </section>
  )
}
