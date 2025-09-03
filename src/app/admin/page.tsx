
import { getAllBlogs } from '@/app/actions/blogs';
import { auth } from '@/auth';
import AdminDashboardSectiion from '@/components/admin-dashboard-section';
import { Button } from '@/components/ui/button';
import Link from 'next/link';




export default async function AdminPage() {

    const session = await auth();

    // rugdetectives@gmail.com

  if (!session?.user || session.user.email !== 'pratikmbade18@gmail.com') {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold text-center">
            You are not authorized to view this page
          </h1>
          <Link href={'/'} className="mt-4">
            <Button className="">Go to home</Button>
          </Link>
        </div>
      );
    }


    const blogs = await getAllBlogs()


    return (
        <>
        <AdminDashboardSectiion username={session.user.name!} email={session.user.email!} profileImage={session.user.image!}  blogPosts={blogs } session={session} />
        </>
    )
}