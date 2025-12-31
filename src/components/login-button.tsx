// app/components/LoginButton.tsx

'use client';

import { signIn, signOut, useSession } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { UserMenu } from "@/components/ui/user-menu";

export default function LoginButton({ callbackUrlArgs }: { callbackUrlArgs?: string }) {


    const { data: session, isPending } = useSession();

    const handleSignIn = () => {

        signIn.social({
            provider: "google",
            callbackURL: callbackUrlArgs ? callbackUrlArgs : '/'
        })
    }

    const handleLogout = async () => {
        console.log('Logging out...');
        try {
            await signOut();
            toast.success('Logout successful');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
    return (
        <>
            {
                session?.user ? (
                    <>
                        <UserMenu
                            name={session.user.name!}
                            email={session.user.email!}
                            imageUrl={session.user.image!}
                            onLogout={handleLogout}
                        />

                    </>


                ) : (
                    <Button variant="outline" className="rounded-md font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-4 py-2 text-sm" onClick={handleSignIn}>Sign In</Button>
                )}
        </>
    );
}

