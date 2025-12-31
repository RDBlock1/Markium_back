import ContactPageComponent from "@/components/contact-page/contact-page";
import { Metadata } from "next";


export const metadata:Metadata = {
    title:'Contact | Markium',
    keywords: ['markium contact page',
        'contact markium',
        'contact markium team'],

    alternates:{
        canonical:"https://markiumpro.com"
    },
    robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
        },
    },
    other: {
        "x-robots-tag": "index, follow",
    },

}

export default function ContactPage(){

    return (
        <div>
            <ContactPageComponent/>
        </div>
    )
}