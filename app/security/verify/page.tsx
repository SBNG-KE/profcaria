import { redirect } from "next/navigation";

export default function SecurityVerifyRedirect() {
    redirect('/?mode=verify');
}
