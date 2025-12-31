'use client'
import {motion} from "framer-motion"
import Link from "next/link";
import { BsTwitterX } from "react-icons/bs";
import { FiMail } from "react-icons/fi";



export  function Footer(){

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className=" fixed bottom-0 mt-auto  w-full flex justify-between items-center px-4 bg-[#0A0B0D] text-white py-4 border-t-2 border-dashed border-[#282727] backdrop-blur-sm"
        >
            <div className="hidden md:flex items-center justify-center gap-x-2  ">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"/>

                <p className="text-sm">
                    Online
                </p>
            </div>
         <div className="">
            <p className="text-xs uppercase">© 2026 Markium. All rights reserved.</p>
         </div>

         <div className="flex items-center justify-center gap-x-4 text-gray-400">
            <Link href="https://twitter.com/@markiumpro" target="_blank">
                <BsTwitterX className="h-4 w-4"/>

            </Link>
            <Link href="/contact">
                <FiMail  className="h-4 w-4"/>
            </Link>




         </div>
        </motion.div>
    )
}