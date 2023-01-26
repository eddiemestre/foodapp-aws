import useAuth from "./useAuth";
import { Auth } from "aws-amplify";

const useLogout = () => {
    const { setAuth } = useAuth();

    const logout = async () => {
        setAuth(null)

        try {
            await Auth.signOut()
            // console.log("signed out user")
        } catch (error) {
            // console.log("error signing out: ", error)
        }
    }

    return logout;
}

export default useLogout;