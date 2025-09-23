import { auth} from "../../../auth";
import {signInAction, signOutAction} from "../../app/api/auth/[...nextauth]/actions";


export default async function SignInButtons() {
  const session = await auth();

  return (
    <>
      {session ? (
        <form
          action={async () => {
            "use server";
            await signOutAction();
          }}
        >
          <button className="text-sm rounded-md border px-3 py-1.5">
            Sign out
          </button>
        </form>
      ) : (
        <form
          action={async () => {
            "use server";
            await signInAction();
          }}
        >
          <button className="text-sm rounded-md border px-3 py-1.5">
            Sign in
          </button>
        </form>
      )}
    </>
  );
  
}
