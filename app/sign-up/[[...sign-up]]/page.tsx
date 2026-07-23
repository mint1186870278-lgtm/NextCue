import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F7FAF8]">
      <SignUp path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
