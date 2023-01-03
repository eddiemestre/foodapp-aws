import useAuth from "./useAuth";
// import DataContext from "../context/DataContext";
import { useContext } from "react";
import { Auth } from "aws-amplify";

const useLogout = () => {
    const { setAuth } = useAuth();
    // const { setReviews } = useContext(DataContext)

    const logout = async () => {
        setAuth(null)
        // setReviews([])

        try {
            await Auth.signOut()
            console.log("signed out user")
        } catch (error) {
            console.log("error signing out: ", error)
        }
    }

    return logout;
}

export default useLogout;