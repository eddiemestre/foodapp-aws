import { useContext } from "react";
import AuthContext from "../shared/context/AuthProvider";

// defines custom hook for auth
const useAuth = () => {
    return useContext(AuthContext);
}

export default useAuth;