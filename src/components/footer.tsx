'use client'
import {motion} from "framer-motion"


export  function Footer(){

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className=" sticky bottom-0 flex justify-center items-center bg-[#0A0B0D] text-white py-4 border-t border-dashed border-[#282727] backdrop-blur-sm"
        >
         <div className="">
            <p className=" uppercase">© 2025 Markium. All rights reserved.</p>
         </div>
        </motion.div>
    )
}