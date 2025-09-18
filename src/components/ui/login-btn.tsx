import { signIn } from "../../../auth"
 
export function SignIn() {
  const signInGoogle = async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); };
  const signInGitHub = async () => { "use server"; await signIn("github", { redirectTo: "/dashboard" }); };

  return (
    <>
      <form action={signInGoogle}><button type="submit">Google</button></form>
      <form action={signInGitHub}><button type="submit">GitHub</button></form>
    </>
  )
}


