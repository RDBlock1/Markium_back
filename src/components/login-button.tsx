// app/components/LoginButton.tsx

'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { UserMenu } from "./ui/user-menu";

export default function LoginButton() {
    const { data: session } = useSession();


    const handleLogout = async () => {
        console.log('Logging out...');
        try {
            await signOut({ redirect: false });
            toast.success('Logout successful');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
    return (
       <>
       {
                session?.user ? (
                    <UserMenu
                        name={session.user.name!}
                        email={session.user.email!}
                        imageUrl={session.user.image!}
                        onLogout={handleLogout}
                    />
                ) : (
                    <Button variant="outline" className="rounded-md font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-4 py-2 text-sm" onClick={() => signIn('google')}>Sign In</Button>
                )}
       </>
    );
}

