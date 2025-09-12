import UserDashboard from "@/components/user-profile/user-dashboard";


type Props = {
  params: Promise<{ address: string }>;
};


export default async function UserProfilePage({ params }: Props) {
    const address  = (await params).address;
    console.log('UserProfilePage address:', address);

    return (
        <div>
                      <UserDashboard address={address}/>
          

        </div>
    )
}