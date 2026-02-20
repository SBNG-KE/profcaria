import { redirect } from "next/navigation";

export default function SecuritySetupRedirect() {
    redirect('/?mode=setup');
}